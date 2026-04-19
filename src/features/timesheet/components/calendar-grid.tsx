"use client";

import { cn } from "@/lib/utils";
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  formatDateIso,
  isSameUtcDay,
  startOfWeekUtc,
} from "./date-utils";
import type { Event } from "@/generated/prisma";

type Props = {
  year: number;
  month: number;
  today: Date;
  selectedDate: Date;
  events: Array<Pick<Event, "date" | "type" | "startTime" | "endTime">>;
  onSelectDay: (date: Date) => void;
  locked?: boolean;
};

export function CalendarGrid({
  year,
  month,
  today,
  selectedDate,
  events,
  onSelectDay,
  locked,
}: Props) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const gridStart = startOfWeekUtc(firstOfMonth);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const byIso = new Map<string, { work: boolean; sick: boolean }>();
  for (const ev of events) {
    const iso = formatDateIso(ev.date);
    const cur = byIso.get(iso) ?? { work: false, sick: false };
    if (ev.type === "WORK") cur.work = true;
    else cur.sick = true;
    byIso.set(iso, cur);
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-base font-semibold">
        {MONTHS_LONG[month - 1]} {year}
        {locked && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            · gesperrt
          </span>
        )}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = formatDateIso(d);
          const status = byIso.get(iso);
          const inMonth = d.getUTCMonth() === month - 1;
          const isToday = isSameUtcDay(d, today);
          const isSelected = isSameUtcDay(d, selectedDate);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border text-xs transition-colors",
                status?.sick
                  ? "bg-rose-500/15 border-rose-200 text-rose-900"
                  : "bg-card border-border",
                !inMonth && "opacity-40",
                isSelected && "ring-2 ring-primary",
                isToday && !isSelected && "border-primary",
              )}
            >
              <span
                className={cn(
                  "absolute left-1.5 top-1 text-xs font-medium tabular-nums",
                  isToday && !isSelected && "text-primary",
                )}
              >
                {d.getUTCDate()}
              </span>
              {status?.work && !status.sick && (
                <span className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-primary" />
              )}
              {status?.sick && (
                <span className="absolute bottom-1 left-1 right-1 text-[9px] font-medium uppercase tracking-wider">
                  Krank
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
