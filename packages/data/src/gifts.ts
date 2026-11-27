/**
 * "Find the perfect gift" runs, people's photos and reminder-email settings.
 * Same backend calls as apps/web/lib/gifts.ts and the reminders page.
 */
import { MAX_GIFT_REQUEST, MAX_PERSON_PHOTOS, cleanGiftIdeas, newId, type GiftIdea, type Locale, type Person } from "@mgl/core";
import { api, unwrap } from "./client";

/** Error keys from the gift-ideas function (translated with gifts.errors.*). */
export type GiftError = "notFound" | "limit" | "declined" | "failed" | "timeout";

export class GiftRunError extends Error {
  constructor(public readonly key: GiftError) {
    super(key);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Short-lived signed URL for showing (or sending) a photo. */
export async function photoUrl(path: string, minutes = 15): Promise<string> {
  const { getUrl } = await import("aws-amplify/storage");
  const { url } = await getUrl({ path, options: { expiresIn: minutes * 60 } });
  return url.toString();
}

/**
 * Runs one gift list for a locker card (or your own profile, id "self"). The function answers
 * asynchronously into a GiftJob, which is polled; it also saves the list on the card.
 */
export async function findGifts(ownerSub: string, person: Person, request: string, locale: Locale): Promise<GiftIdea[]> {
  const ask = request.trim().slice(0, MAX_GIFT_REQUEST);
  const { data: job, errors } = await api().models.GiftJob.create({ ownerSub, profileId: person.id, request: ask || undefined, locale, status: "pending" });
  if (!job) {
    console.error("GiftJob.create", errors);
    throw new GiftRunError("failed");
  }
  const photoUrls = person.kind === "adult" ? await Promise.all((person.photos ?? []).slice(0, MAX_PERSON_PHOTOS).map((p) => photoUrl(p, 10).catch(() => ""))) : [];
  const started_ = await api().mutations.findGifts({ jobId: job.id, photoUrls: photoUrls.filter(Boolean) });
  if (started_.errors?.length) throw new GiftRunError("failed");
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

/**
 * Uploads a photo (already resized to JPEG by the app) and adds it to the card.
 * `data` is the file's bytes (the app reads them from the photo library).
 */
export async function addPersonPhoto(person: Person, data: Blob | ArrayBuffer, ownerSub: string): Promise<string[]> {
  const current = person.photos ?? [];
  if (current.length >= MAX_PERSON_PHOTOS) return current;
  const { uploadData } = await import("aws-amplify/storage");
  const { path } = await uploadData({
    path: ({ identityId }) => `person-photos/${identityId}/${person.id}/${newId()}.jpg`,
    data,
    options: { contentType: "image/jpeg" },
  }).result;
  const photos = [...current, path];
  await savePhotos(person, photos, ownerSub);
  return photos;
}

export async function removePersonPhoto(person: Person, path: string, ownerSub: string): Promise<string[]> {
  const photos = (person.photos ?? []).filter((p) => p !== path);
  await savePhotos(person, photos, ownerSub);
  const { remove } = await import("aws-amplify/storage");
  await Promise.resolve(remove({ path })).catch(() => {});
  return photos;
}

async function savePhotos(person: Person, photos: string[], ownerSub: string) {
  const list = photos.slice(0, MAX_PERSON_PHOTOS);
  if (person.id === "self") unwrap(await api().models.SelfProfile.update({ ownerSub, photos: list }));
  else unwrap(await api().models.Profile.update({ id: person.id, photos: list }));
}

/** Reminder emails for the signed-in owner: on unless they turned them off. */
export async function getReminders(ownerSub: string): Promise<{ on: boolean; token: string | null }> {
  const { data } = await api().models.ReminderSettings.get({ ownerSub });
  return { on: !data?.remindersOff, token: data?.unsubscribeToken ?? null };
}

/**
 * Turns reminder emails on or off. Owners can read (not write) their settings row, so this uses
 * the same token-based call as the email's unsubscribe link; setMyLocale creates the row if needed.
 */
export async function setRemindersOn(ownerSub: string, on: boolean, locale: Locale): Promise<void> {
  let { token } = await getReminders(ownerSub);
  if (!token) {
    unwrap(await api().mutations.setMyLocale({ locale }));
    token = (await getReminders(ownerSub)).token;
  }
  if (!token) throw new Error("No reminder settings");
  unwrap(await api().mutations.setReminders({ token, enabled: on }));
}
