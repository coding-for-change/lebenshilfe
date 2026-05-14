"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatIsoDateUtc } from "@/lib/utils";
import {
  MONTHS_SHORT,
  WEEKDAYS_SHORT,
  addDays,
  isSameUtcDay,
  isoWeek,
  startOfWeekUtc,
} from "./date-utils";
import type { Event } from "@/generated/prisma";

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  today: Date;
  events: Array<Pick<Event, "date" | "type">>;
};

export function WeekStrip({
  selectedDate,
  onSelectDate,
  today,
  events,
}: Props) {
  const monday = startOfWeekUtc(selectedDate);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const eventByIso = new Map<string, { work: boolean; sick: boolean }>();
  for (const ev of events) {
    const iso = formatIsoDateUtc(ev.date);
    const cur = eventByIso.get(iso) ?? { work: false, sick: false };
    if (ev.type === "WORK") cur.work = true;
    else cur.sick = true;
    eventByIso.set(iso, cur);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          KW {isoWeek(selectedDate)} ·{" "}
          {MONTHS_SHORT[selectedDate.getUTCMonth()]}{" "}
          {selectedDate.getUTCFullYear()}
        </p>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onSelectDate(addDays(selectedDate, -7))}
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectDate(today)}
          >
            Heute
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onSelectDate(addDays(selectedDate, 7))}
            aria-label="Nächste Woche"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {week.map((d, i) => {
          const iso = formatIsoDateUtc(d);
          const status = eventByIso.get(iso);
          const selected = isSameUtcDay(d, selectedDate);
          const isToday = isSameUtcDay(d, today);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(d)}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  selected
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {WEEKDAYS_SHORT[i]}
              </span>
              <span
                className={cn(
                  "relative text-base font-semibold tabular-nums",
                  isToday && !selected && "text-amber-600",
                )}
              >
                {d.getUTCDate()}
                {isToday && !selected && (
                  <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-amber-500" />
                )}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {status?.work && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      selected ? "bg-primary-foreground" : "bg-primary",
                    )}
                  />
                )}
                {status?.sick && (
                  <span className="size-1.5 rounded-full bg-rose-500" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
