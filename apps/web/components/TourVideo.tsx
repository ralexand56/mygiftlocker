"use client";

import { Play, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * "Watch the 45-second tour": opens the promo video (video/ in the repo renders it into
 * public/video/). Spanish visitors get the Spanish cut, other languages the English one;
 * phones get the vertical cut. Nothing loads until it's opened.
 */
export function TourButton({ className = "" }: { className?: string }) {
  const t = useTranslations("tour");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-2.5 rounded-full text-[15px] font-bold text-ink hover:text-plum ${className}`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose to-plum text-white shadow-soft transition-transform group-hover:scale-105">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden />
        </span>
        {t("watch")}
      </button>
      {open && <TourDialog onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * A big preview card: a 12-second silent loop of the app (plays only while on screen, and not
 * at all for reduced motion) with a play button that opens the full tour with sound.
 */
export function TourPreview({ className = "" }: { className?: string }) {
  const t = useTranslations("tour");
  const lang = useLocale() === "es" ? "es" : "en";
  const [open, setOpen] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("watch")}
        className={`group relative block w-full overflow-hidden rounded-[28px] bg-cream text-left shadow-lift ring-1 ring-white/80 ${className}`}
      >
        <video
          ref={video}
          src={`/video/preview-${lang}.mp4`}
          poster={`/video/preview-${lang}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          className="block aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-x-0 top-0 grid aspect-video place-items-center bg-ink/10 transition-colors group-hover:bg-ink/5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-rose to-plum text-white shadow-lift ring-8 ring-white/50 transition-transform group-hover:scale-110 sm:h-24 sm:w-24">
            <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" aria-hidden />
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-white/80 px-5 py-4 sm:px-7 sm:py-5">
          <span className="font-display text-lg font-semibold text-ink sm:text-2xl">{t("watch")}</span>
          <span className="text-sm font-bold text-plum">{t("withSound")}</span>
        </span>
      </button>
      {open && <TourDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function TourDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("tour");
  const lang = useLocale() === "es" ? "es" : "en";
  const [vertical] = useState(() => window.matchMedia("(max-width: 640px), (max-aspect-ratio: 4/5)").matches);
  const shape = vertical ? "9x16" : "16x9";
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("title")} className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <video
          src={`/video/tour-${lang}-${shape}.mp4`}
          poster={`/video/tour-${lang}-${shape}.jpg`}
          controls
          autoPlay
          playsInline
          className={`block rounded-[24px] bg-cream shadow-lift ${vertical ? "aspect-[9/16] h-[min(84dvh,calc((100vw-2rem)*16/9))]" : "aspect-video w-[min(calc(100vw-2rem),1100px,calc((100dvh-2rem)*16/9))]"}`}
        />
        <button
          ref={close}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute -top-3 -right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-soft hover:bg-cream"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
