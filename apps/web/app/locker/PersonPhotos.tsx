"use client";

import { MAX_PERSON_PHOTOS, type Person } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { addPersonPhoto, photoUrl, removePersonPhoto } from "@/lib/gifts";

/** Up to 5 private photos of an adult in the locker, used to tailor gift ideas. */
export function PersonPhotos({ person: p, onChange }: { person: Person; onChange: (photos: string[]) => void }) {
  const t = useTranslations("photos");
  const first = p.name.split(" ")[0]!;
  const photos = p.photos ?? [];
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    for (const path of photos) {
      if (urls[path]) continue;
      photoUrl(path)
        .then((u) => live && setUrls((m) => ({ ...m, [path]: u })))
        .catch(() => {});
    }
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.join("|")]);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    let list = photos;
    try {
      for (const f of [...files].slice(0, MAX_PERSON_PHOTOS - list.length)) {
        list = await addPersonPhoto({ ...p, photos: list }, f);
        onChange(list);
      }
    } catch {
      setError(t("uploadFailed"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const remove = async (path: string) => {
    setError(null);
    try {
      onChange(await removePersonPhoto(p, path));
    } catch {
      setError(t("removeFailed"));
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <p className="text-sm font-bold text-ink-soft">{t("title", { name: first })}</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        <AnimatePresence initial={false}>
          {photos.map((path) => (
            <motion.div
              key={path}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square overflow-hidden rounded-xl bg-cream"
            >
              {urls[path] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[path]} alt={t("alt", { name: first })} className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove(path)}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                aria-label={t("remove")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {photos.length < MAX_PERSON_PHOTOS && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-lavender text-plum hover:bg-cream disabled:opacity-50"
            aria-label={t("add")}
          >
            {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-plum border-t-transparent" /> : <ImagePlus className="h-5 w-5" />}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      <p className="mt-2 text-xs text-ink-soft">{t("hint", { max: MAX_PERSON_PHOTOS })}</p>
      {error && <p className="mt-1 text-xs font-bold text-rose-deep">{error}</p>}
    </div>
  );
}
