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
