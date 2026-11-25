/**
 * "Find the perfect gift" for one person in the caller's locker.
 *
 * Invoked asynchronously by the findGifts mutation (so it isn't bound by AppSync's 30s limit).
 * The caller first creates a GiftJob (status pending); this function checks they own it and
 * the person, applies the daily cap, asks Claude Opus 5.5 on Amazon Bedrock for ideas
 * (with up to 5 photos), and writes the ideas, or an error key, back to the job.
 *
 * Error keys the site translates: notFound, limit, declined, failed.
 */
import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import {
  DAILY_GIFT_RUNS,
  GIFT_CATEGORIES,
  GIFT_STORES,
  LOCALE_NAMES,
  MAX_GIFT_REQUEST,
  MAX_PERSON_PHOTOS,
  cleanGiftIdeas,
  cleanHolidays,
  dateKey,
  giftContext,
  isLocale,
  type GiftIdea,
  type Person,
} from "@mgl/core";
import { env } from "$amplify/env/gift-ideas";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { z } from "zod";
import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const data = generateClient<Schema>({ authMode: "iam" });
// Anthropic's API when the ANTHROPIC_API_KEY secret is set; otherwise Claude in Amazon Bedrock.
const direct = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;
const bedrock = direct ? null : new AnthropicBedrockMantle({ awsRegion: process.env.BEDROCK_REGION || process.env.AWS_REGION, apiKey: null });

interface FindGiftsEvent {
  arguments: { jobId?: string; photoUrls?: (string | null)[] | null };
  identity?: { sub?: string } | null;
}

class Failure extends Error {}

const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      priceMin: z.number(),
      priceMax: z.number(),
      category: z.enum(GIFT_CATEGORIES),
      store: z.enum(GIFT_STORES),
      searchQuery: z.string(),
    }),
  ),
});

// Stable across every request (and cached): instructions only, nothing per person.
const SYSTEM = `You are the personal shopper inside My Gift Lockers, an app where people keep the sizes, dates and favorite things of the people they love.
You suggest gifts for one person the user shops for, using everything they've saved about that person, their private notes, and any photos of the person.

Return exactly 12 ideas unless the user asks for a different number (never more than 15). Good ideas:
- fit this specific person: their sizes, favorite colors, loves, wishes and the occasions coming up. Say why in one warm, specific sentence written to the user ("She mentioned…", "Her photos show a lot of…").
- respect "Avoid" strictly, and never suggest clothing in a size other than theirs.
- may include up to two of their own wishes, made concrete.
- mix price points and categories unless the user's request narrows them. Prices are realistic US dollar ranges.
- are specific product types a person can find in a store search, not vague themes ("hand-thrown matcha bowl and whisk set", not "something for tea lovers"). Name a brand only when the notes or photos point to it.
- If the user's request is about something else, still answer with the best gift ideas you can that honor it.

Photos are only for reading taste and interests: style, hobbies, home, pets, places. Never comment on someone's body, looks or age from a photo, and never guess sensitive traits (health, religion, ethnicity, sexuality).

Fields:
- title and why: in the language the user names.
- store: "etsy" for handmade or personalized things, "target" or "walmart" for everyday home and kids' basics, otherwise "amazon".
- searchQuery: a short English search for that US store (3-6 words), e.g. "personalized leather passport holder".
- category: the closest of the allowed values.`;

function toPerson(raw: Schema["Profile"]["type"]): Person {
  const j = <T>(v: unknown): T | undefined => {
    if (typeof v !== "string") return (v ?? undefined) as T | undefined;
    try {
      return JSON.parse(v) as T;
    } catch {
      return undefined;
    }
  };
  const d = (x: { month: number; day: number; year?: number | null } | null | undefined) => (x ? { month: x.month, day: x.day, year: x.year ?? undefined } : undefined);
  return {
    id: raw.id,
    name: raw.name,
    kind: raw.kind === "child" ? "child" : "adult",
    relationship: raw.relationship ?? undefined,
    color: raw.color ?? "#fff",
    sizes: j(raw.sizes) ?? {},
    birthday: d(raw.birthday),
    anniversary: d(raw.anniversary),
    favorites: j(raw.favorites),
    holidays: cleanHolidays(raw.holidays),
    ownerNote: raw.ownerNote ?? undefined,
    updatedAt: raw.updatedAt,
  };
}

const usageId = (sub: string) => `${sub}#${dateKey(new Date())}`;

/** Failure("limit") once today's cap is reached. */
async function checkLimit(sub: string) {
  const { data: usage } = await data.models.GiftUsage.get({ id: usageId(sub) });
  if (usage && usage.count >= DAILY_GIFT_RUNS) throw new Failure("limit");
}

/** Counts a finished list (failed runs don't use up the day's lists). */
async function recordRun(sub: string) {
  const id = usageId(sub);
  const { data: usage } = await data.models.GiftUsage.get({ id });
  if (usage) await data.models.GiftUsage.update({ id, count: usage.count + 1 });
  else await data.models.GiftUsage.create({ id, ownerSub: sub, count: 1 });
}

/** Downloads the person's photos from signed URLs for our own bucket only (never other hosts). */
async function loadPhotos(urls: string[], profileId: string): Promise<Anthropic.ImageBlockParam[]> {
  const bucket = process.env.PHOTO_BUCKET;
  if (!bucket) return [];
  const hosts = new Set([`${bucket}.s3.amazonaws.com`, `${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`]);
  const out: Anthropic.ImageBlockParam[] = [];
  for (const raw of urls.slice(0, MAX_PERSON_PHOTOS)) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:" || !hosts.has(u.hostname) || !u.pathname.startsWith("/person-photos/") || !u.pathname.includes(`/${profileId}/`)) continue;
      const res = await fetch(u, { signal: AbortSignal.timeout(5000), redirect: "error" });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length > 3_500_000) continue;
      out.push({ type: "image", source: { type: "base64", media_type: type as "image/jpeg", data: bytes.toString("base64") } });
    } catch (e) {
      console.warn("photo skipped", e instanceof Error ? e.message : e);
    }
  }
  return out;
}

/**
 * One illustrative Unsplash photo per idea (not the exact product). Unsplash's rules: show
 * their hotlinked URL, credit the photographer, and ping download_location when a photo is used.
 * Without UNSPLASH_ACCESS_KEY, or if Unsplash is slow, ideas simply have no photo.
 */
async function addPhotos(ideas: GiftIdea[]): Promise<GiftIdea[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return ideas;
  const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
  return Promise.all(
    ideas.map(async (idea) => {
      try {
        const q = new URLSearchParams({ query: idea.searchQuery, per_page: "1", orientation: "landscape", content_filter: "high" });
        const res = await fetch(`https://api.unsplash.com/search/photos?${q}`, { headers, signal: AbortSignal.timeout(4000) });
        if (!res.ok) return idea;
        const photo = ((await res.json()) as { results?: UnsplashPhoto[] }).results?.[0];
        if (!photo) return idea;
        void fetch(photo.links.download_location, { headers, signal: AbortSignal.timeout(4000) }).catch(() => {});
        return {
          ...idea,
          image: { url: photo.urls.small, color: photo.color ?? undefined, alt: photo.alt_description ?? undefined, by: photo.user.name, byUrl: photo.user.links.html },
        };
      } catch {
        return idea;
      }
    }),
  );
}

interface UnsplashPhoto {
  color?: string | null;
  alt_description?: string | null;
  urls: { small: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
}

export const handler = async (event: FindGiftsEvent) => {
  const sub = event.identity?.sub;
  const jobId = event.arguments.jobId;
  if (!sub || !jobId) return;
  const { data: job } = await data.models.GiftJob.get({ id: jobId });
  if (!job || job.ownerSub !== sub || job.status !== "pending") return;
  await data.models.GiftJob.update({ id: job.id, status: "running" });

  try {
    const { data: raw } = await data.models.Profile.get({ id: job.profileId });
    if (!raw || (raw.ownerSub !== sub && !(raw.guardians ?? []).includes(sub))) throw new Failure("notFound");
    await checkLimit(sub);

    const person = toPerson(raw);
    const locale = isLocale(job.locale) ? job.locale : "en";
    const request = (job.request ?? "").trim().slice(0, MAX_GIFT_REQUEST);
    const photos = person.kind === "adult" ? await loadPhotos((event.arguments.photoUrls ?? []).filter((u): u is string => !!u), person.id) : [];
    const previous = cleanGiftIdeas((typeof raw.giftIdeas === "string" ? JSON.parse(raw.giftIdeas) : raw.giftIdeas)?.ideas);

    const text = [
      `Write the title and why in ${LOCALE_NAMES[locale]} (${locale}).`,
      `About the person:\n${giftContext(person)}`,
      photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"} of them ${photos.length === 1 ? "is" : "are"} attached.` : "No photos.",
      request && previous.length ? `Ideas I already saw (don't repeat them): ${previous.map((i) => i.title).join("; ")}` : "",
      request ? `What I'm looking for: ${request}` : "Give me your best ideas for them.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const system = [{ type: "text" as const, text: SYSTEM, cache_control: { type: "ephemeral" as const } }];
    const messages = [{ role: "user" as const, content: [...photos, { type: "text" as const, text }] }];
    // On the direct API, a declined request is retried on a fallback model chosen by the API.
    const response = direct
      ? await direct.beta.messages.parse({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system,
          output_config: { effort: "medium", format: betaZodOutputFormat(IdeasSchema) },
          messages,
        })
      : await bedrock!.messages.parse({
          model: "anthropic.claude-opus-5-5",
          max_tokens: 16000,
          system,
          output_config: { effort: "medium", format: zodOutputFormat(IdeasSchema) },
          messages,
        });
    console.log("gift ideas", { via: direct ? "anthropic" : "bedrock", model: response.model, stop: response.stop_reason, usage: response.usage, photos: photos.length });
    if (response.stop_reason === "refusal") throw new Failure("declined");
    const ideas = cleanGiftIdeas(await addPhotos(cleanGiftIdeas(response.parsed_output?.ideas)));
    if (!ideas.length) throw new Failure("failed");

    await recordRun(sub);
    const at = new Date().toISOString();
    await data.models.GiftJob.update({ id: job.id, status: "done", ideas: JSON.stringify(ideas) });
    await data.models.Profile.update({ id: raw.id, giftIdeas: JSON.stringify({ ideas, request: request || undefined, at }) });
  } catch (e) {
    const key = e instanceof Failure ? e.message : "failed";
    if (!(e instanceof Failure)) console.error("gift ideas failed", e);
    await data.models.GiftJob.update({ id: job.id, status: "error", error: key });
  }
};
