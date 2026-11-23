import { useId } from "react";

/** The My Gift Locker mark: a gift-locker whose ribbon bow forms the "M". */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}b`} x1="8" y1="22" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBD3E3" />
          <stop offset="1" stopColor="#D9C8FF" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC9A8" />
          <stop offset="1" stopColor="#FF9FBF" />
        </linearGradient>
      </defs>
      <rect x="7" y="24" width="50" height="35" rx="11" fill={`url(#${id}b)`} />
      <path d="M7 33.5h50" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" />
      <path d="M14 40h9M14 45h9M14 50h9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeOpacity=".9" />
      <circle cx="45" cy="43" r="3" fill="#7A5AA6" />
      <path d="M43.6 44.5h2.8l.9 5.5h-4.6z" fill="#7A5AA6" />
      <rect x="28.5" y="24" width="7" height="35" fill={`url(#${id}r)`} />
      <path d="M15 24 L19.5 9.5 Q21 6 23.6 8.6 L32 19 L40.4 8.6 Q43 6 44.5 9.5 L49 24" stroke="#E9779F" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 24 L19.5 9.5 Q21 6 23.6 8.6 L32 19 L40.4 8.6 Q43 6 44.5 9.5 L49 24" stroke={`url(#${id}r)`} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="21" r="4.2" fill="#E9779F" />
    </svg>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight">
        <span className="text-rose">My</span> Gift Locker
      </span>
    </span>
  );
}
