"use client";

import { cn, formatIsoDateUtc } from "@/lib/utils";
import {
  WEEKDAYS_SHORT,
  addDays,
  isSameUtcDay,
  startOfWeekUtc,
  timeToMinutes,
  weekdayIndex,
} from "@/lib/dates";
import type { Event, Schedule } from "@/generated/prisma";
import type { ChildOption } from "./children-filter";
import type { VertretungDay } from "./timesheet-shell";

type Props = {
  anchorDate: Date;
  today: Date;
  childList: ChildOption[];
  selectedChildIds: string[];
  events: Array<
    Pick<Event, "id" | "date" | "type" | "startTime" | "endTime" | "childId">
  >;
  schedules: Schedule[];
  onSelectDay: (date: Date) => void;
  substituteOn?: VertretungDay[];
};

const START_HOUR = 7;
const END_HOUR = 20; // exclusive upper
const HOUR_HEIGHT = 44; // px per hour

const CHILD_COLORS = [
  "bg-violet-500/20 border-violet-400 text-violet-950",
  "bg-blue-500/20 border-blue-400 text-blue-950",
  "bg-emerald-500/20 border-emerald-400 text-emerald-950",
  "bg-amber-500/25 border-amber-400 text-amber-950",
  "bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-950",
];

export function WeekGrid({
  anchorDate,
  today,
  childList,
  selectedChildIds,
  events,
  schedules,
  onSelectDay,
  substituteOn = [],
}: Props) {
  const monday = startOfWeekUtc(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const colorFor = (childId: string | null | undefined) => {
    if (!childId) return "bg-rose-500/15 border-rose-400 text-rose-950";
    const idx = childList.findIndex((c) => c.id === childId);
    return CHILD_COLORS[(idx >= 0 ? idx : 0) % CHILD_COLORS.length];
  };

  const childFirstName = (childId: string | null | undefined) => {
    if (!childId) return "";
    return childList.find((c) => c.id === childId)?.firstName ?? "";
  };

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  const posFromTime = (time: string) => {
    const mins = timeToMinutes(time) - START_HOUR * 60;
    return Math.max(0, Math.min(totalHeight, (mins / 60) * HOUR_HEIGHT));
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-border">
        <div />
        {days.map((d, i) => {
          const isToday = isSameUtcDay(d, today);
          return (
            <button
              key={formatIsoDateUtc(d)}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "flex flex-col items-center py-2 text-xs hover:bg-accent",
                i > 0 && "border-l border-border",
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {WEEKDAYS_SHORT[i]}
              </span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  isToday && "text-primary",
                )}
              >
                {d.getUTCDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] relative"
        style={{ height: totalHeight }}
      >
        <div className="relative">
          {hours.map((h, i) => (
            <div
              key={h}
              className={cn(
                "pr-1 text-right text-[10px] font-mono tabular-nums text-muted-foreground",
                i > 0 && "border-t border-border",
              )}
              style={{ height: HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>
        {days.map((d, i) => {
          const wd = weekdayIndex(d);
          const iso = formatIsoDateUtc(d);
          const daySick = events.find(
            (e) => e.type === "SICK" && isSameUtcDay(e.date, d),
          );
          const dayVertretungen = substituteOn.filter((v) => v.date === iso);
          const dayWork = events.filter(
            (e) =>
              e.type === "WORK" &&
              isSameUtcDay(e.date, d) &&
              (selectedChildIds.length === 0 ||
                (e.childId && selectedChildIds.includes(e.childId))),
          );
          const daySchedules = schedules.filter(
            (s) =>
              s.weekday === wd &&
              selectedChildIds.includes(s.childId) &&
              !dayVertretungen.some((v) => v.childId === s.childId),
          );

          return (
            <div
              key={formatIsoDateUtc(d)}
              className={cn("relative", i > 0 && "border-l border-border")}
            >
              {hours.map((h, j) => (
                <div
                  key={h}
                  className={cn(j > 0 && "border-t border-border")}
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {daySick ? (
                <div className="absolute inset-1 rounded-md border border-rose-300 bg-rose-500/15 p-2 text-center text-[11px] font-semibold uppercase tracking-wider text-rose-900">
                  Krank
                </div>
              ) : (
                <>
                  {dayVertretungen.map((v) => {
                    const top = posFromTime(v.startTime);
                    const blockH =
                      posFromTime(v.endTime) - posFromTime(v.startTime);
                    const height = Math.max(blockH, 16);
                    return (
                      <div
                        key={v.id}
                        className="absolute left-0.5 right-0.5 rounded-md border border-amber-400 bg-amber-500/25 px-1 text-[10px] font-medium leading-tight text-amber-950"
                        style={{ top, height }}
                      >
                        <div className="font-mono tabular-nums">
                          {v.startTime}–{v.endTime}
                        </div>
                        {height >= 26 ? (
                          <div className="truncate text-[9px] font-semibold opacity-80">
                            {v.childName}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {daySchedules.map((s) => {
                    const top = posFromTime(s.startTime);
                    const h = posFromTime(s.endTime) - posFromTime(s.startTime);
                    const height = Math.max(h, 14);
                    const name = childFirstName(s.childId);
                    return (
                      <div
                        key={s.id}
                        className="absolute left-0.5 right-0.5 rounded-sm border border-dashed border-muted-foreground/30 bg-muted/40 px-1 text-[9px] leading-tight text-muted-foreground"
                        style={{ top, height }}
                      >
                        <div className="font-mono tabular-nums">
                          {s.startTime}
                        </div>
                        {name && height >= 22 ? (
                          <div className="truncate font-medium text-foreground/70">
                            {name}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {dayWork.map((ev, k) => {
                    const top = ev.startTime ? posFromTime(ev.startTime) : 0;
                    const h =
                      ev.startTime && ev.endTime
                        ? posFromTime(ev.endTime) - posFromTime(ev.startTime)
                        : HOUR_HEIGHT;
                    const height = Math.max(h, 16);
                    const width = `calc(${100 / Math.max(dayWork.length, 1)}% - 4px)`;
                    const left = `calc(${(100 / Math.max(dayWork.length, 1)) * k}% + 2px)`;
                    const name = childFirstName(ev.childId);
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "absolute rounded-md border px-1 text-[10px] font-medium leading-tight",
                          colorFor(ev.childId),
                        )}
                        style={{
                          top,
                          height,
                          width,
                          left,
                        }}
                      >
                        <div className="font-mono tabular-nums">
                          {ev.startTime}–{ev.endTime}
                        </div>
                        {name && height >= 26 ? (
                          <div className="truncate text-[9px] font-semibold opacity-80">
                            {name}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
