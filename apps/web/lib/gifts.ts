"use client";

/**
 * "Find the perfect gift": person photos (Amplify Storage) and gift-idea runs.
 * A run creates a GiftJob, calls the async findGifts mutation (Claude on Amazon Bedrock),
 * then polls the job. Demo mode makes ideas locally from the person's own data.
 */
import { MAX_GIFT_REQUEST, MAX_PERSON_PHOTOS, cleanGiftIdeas, newId, type AffiliateConfig, type GiftIdea, type Locale, type Person } from "@mgl/core";
import { api, backendEnabled } from "./amplify";
import { updateOwnerFields } from "./invites";

export const giftAffiliate: AffiliateConfig = {
  amazonTag: process.env.NEXT_PUBLIC_AMAZON_TAG || undefined,
  sovrnKey: process.env.NEXT_PUBLIC_SOVRN_KEY || undefined,
  skimlinksId: process.env.NEXT_PUBLIC_SKIMLINKS_ID || undefined,
};

export const photosEnabled = backendEnabled;

/** Error keys from the gift-ideas function (and here), translated by the page. */
export type GiftError = "notFound" | "limit" | "declined" | "failed" | "timeout";

export class GiftRunError extends Error {
  constructor(public readonly key: GiftError) {
    super(key);
  }
}

// ---- photos -----------------------------------------------------------------

/** Shrinks a photo to at most 1280px on the long side as JPEG (smaller uploads, cheaper AI). */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.82));
}

/** Uploads a photo of this person and adds it to their card. Returns the new list of paths. */
export async function addPersonPhoto(person: Person, file: File): Promise<string[]> {
  const current = person.photos ?? [];
  if (current.length >= MAX_PERSON_PHOTOS) return current;
  const { uploadData } = await import("aws-amplify/storage");
  const blob = await shrink(file);
  const { path } = await uploadData({
    path: ({ identityId }) => `person-photos/${identityId}/${person.id}/${newId()}.jpg`,
    data: blob,
    options: { contentType: "image/jpeg" },
  }).result;
  const photos = [...current, path];
  await updateOwnerFields(person.id, { photos });
  return photos;
}

export async function removePersonPhoto(person: Person, path: string): Promise<string[]> {
  const photos = (person.photos ?? []).filter((p) => p !== path);
  await updateOwnerFields(person.id, { photos });
  const { remove } = await import("aws-amplify/storage");
  await remove({ path }).catch(() => {}); // the card no longer points at it either way
  return photos;
}

/** Short-lived signed URL for showing (or sending) a photo. */
export async function photoUrl(path: string, minutes = 15): Promise<string> {
  const { getUrl } = await import("aws-amplify/storage");
  const { url } = await getUrl({ path, options: { expiresIn: minutes * 60 } });
  return url.toString();
}

// ---- gift runs ----------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Asks for gift ideas for one person, optionally steered by a request in plain words. */
export async function findGifts(person: Person, ownerSub: string, request: string, locale: Locale): Promise<GiftIdea[]> {
  const ask = request.trim().slice(0, MAX_GIFT_REQUEST);
  if (!backendEnabled) {
    await sleep(1600);
    return demoIdeas(person, ask);
  }
  const { data: job, errors } = await api().models.GiftJob.create({ ownerSub, profileId: person.id, request: ask || undefined, locale, status: "pending" });
  if (!job) throw new Error(errors?.[0]?.message ?? "failed");
  const photoUrls = person.kind === "adult" ? await Promise.all((person.photos ?? []).slice(0, MAX_PERSON_PHOTOS).map((p) => photoUrl(p, 10).catch(() => ""))) : [];
  await api().mutations.findGifts({ jobId: job.id, photoUrls: photoUrls.filter(Boolean) });

  // The function usually answers in 20-60 seconds.
  const started = Date.now();
  while (Date.now() - started < 170_000) {
    await sleep(2500);
    const { data: now } = await api().models.GiftJob.get({ id: job.id });
    if (now?.status === "done") {
      void api().models.GiftJob.delete({ id: job.id });
      return cleanGiftIdeas(typeof now.ideas === "string" ? JSON.parse(now.ideas) : now.ideas);
    }
    if (now?.status === "error") {
      void api().models.GiftJob.delete({ id: job.id });
      throw new GiftRunError((now.error as GiftError) ?? "failed");
    }
  }
  throw new GiftRunError("timeout");
}

/** Demo mode: a few ideas from their own wishes and loves, so the page can be tried offline. */
function demoIdeas(p: Person, request: string): GiftIdea[] {
  const f = p.favorites ?? {};
  const seeds = [
    ...(f.wishes ?? []).filter(Boolean).map((w) => ({ title: w, why: "It's on their own wish list.", category: "other" as const })),
    ...(f.likes ? [{ title: `Something for ${f.likes.split(",")[0]!.trim()}`, why: `They love ${f.likes}.`, category: "hobby" as const }] : []),
    { title: "Cozy knit throw", why: "Always welcome, and it fits any home.", category: "home" as const },
    { title: "Personalized photo book", why: "Memories you share, made into something to keep.", category: "home" as const },
    { title: "Cooking class for two", why: "An experience you can enjoy together.", category: "experience" as const },
    { title: "Hand-thrown ceramic mug", why: "Small, beautiful and used every day.", category: "home" as const },
  ];
  return cleanGiftIdeas(
    seeds.slice(0, 8).map((s, i) => ({
      ...s,
      id: `demo-${i}`,
      title: request && i === 0 ? `${s.title} (${request})` : s.title,
      priceMin: 20 + i * 10,
      priceMax: 40 + i * 15,
      store: s.category === "home" && i % 2 ? "etsy" : "amazon",
      searchQuery: s.title,
    })),
  );
}
