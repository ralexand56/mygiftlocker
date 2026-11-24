import { holiday, type EventKind, type HolidayId } from "@mgl/core";
import { Cake, Heart, Sparkles } from "lucide-react";

const ICON = { birthday: Cake, anniversary: Heart, other: Sparkles } as const;

/** Lucide icon for personal dates; the holiday's emoji for tagged holidays. */
export function EventIcon({ kind, holidayId, className = "h-4 w-4" }: { kind: EventKind; holidayId?: HolidayId; className?: string }) {
  if (kind === "holiday" && holidayId)
    return (
      <span aria-hidden className="inline-block leading-none">
        {holiday(holidayId).emoji}
      </span>
    );
  const Icon = ICON[kind as keyof typeof ICON] ?? Sparkles;
  return <Icon className={className} />;
}
