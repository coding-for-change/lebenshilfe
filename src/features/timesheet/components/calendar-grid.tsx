"use client";

import { cn, formatIsoDateUtc } from "@/lib/utils";
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  isSameUtcDay,
  startOfWeekUtc,
} from "./date-utils";
import type { Event } from "@/generated/prisma";

type VertretungDay = {
  date: string; // YYYY-MM-DD
  childName: string;
  startTime: string;
  endTime: string;
};

type Props = {
  year: number;
  month: number;
  today: Date;
  selectedDate: Date;
  events: Array<Pick<Event, "date" | "type" | "startTime" | "endTime">>;
  onSelectDay: (date: Date) => void;
  locked?: boolean;
  /** Days this user is stepping in as substitute. */
  substituteOn?: VertretungDay[];
};

export function CalendarGrid({
  year,
  month,
  today,
  selectedDate,
  events,
  onSelectDay,
  locked,
  substituteOn = [],
}: Props) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const gridStart = startOfWeekUtc(firstOfMonth);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const byIso = new Map<string, { work: boolean; sick: boolean }>();
  for (const ev of events) {
    const iso = formatIsoDateUtc(ev.date);
    const cur = byIso.get(iso) ?? { work: false, sick: false };
    if (ev.type === "WORK") cur.work = true;
    else cur.sick = true;
    byIso.set(iso, cur);
  }

  const substituteByIso = new Map<string, VertretungDay>();
  for (const v of substituteOn) substituteByIso.set(v.date, v);

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
          const iso = formatIsoDateUtc(d);
          const status = byIso.get(iso);
          const substitute = substituteByIso.get(iso);
          const inMonth = d.getUTCMonth() === month - 1;
          const isToday = isSameUtcDay(d, today);
          const isSelected = isSameUtcDay(d, selectedDate);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(d)}
              title={
                substitute
                  ? `Vertretung · ${substitute.childName} · ${substitute.startTime}–${substitute.endTime}`
                  : undefined
              }
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

              {/* Regular work dot */}
              {status?.work && !status.sick && !substitute && (
                <span className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-primary" />
              )}

              {/* Sick label */}
              {status?.sick && (
                <span className="absolute bottom-1 left-1 right-1 text-[9px] font-medium uppercase tracking-wider">
                  Krank
                </span>
              )}

              {/* Amber dot — user is stepping in as substitute */}
              {substitute && !status?.sick && (
                <span className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
