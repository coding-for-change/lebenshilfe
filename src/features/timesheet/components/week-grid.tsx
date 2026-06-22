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
import type { ChildSchoolHolidayItem, VertretungDay } from "./timesheet-shell";
import { childIdsForDate } from "../weekday";
import type { AssignmentsByWeekday } from "../weekday";

type Props = {
  anchorDate: Date;
  today: Date;
  childList: ChildOption[];
  selectedChildIds: string[];
  events: Array<
    Pick<Event, "id" | "date" | "type" | "startTime" | "endTime" | "childId">
  >;
  schedules: Schedule[];
  assignmentsByWeekday: AssignmentsByWeekday;
  onSelectDay: (date: Date) => void;
  childSchoolHolidays?: ChildSchoolHolidayItem[];
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

type ColumnSpan = { col: number; cols: number };

// Greedy interval-graph packing: blocks that overlap in time are spread across
// adjacent columns instead of stacking on top of each other. Returns one
// { col, cols } per input block, aligned to the input order.
function packColumns(
  blocks: Array<{ start: number; end: number }>,
): ColumnSpan[] {
  const order = blocks
    .map((b, i) => ({ i, start: b.start, end: b.end }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const result: ColumnSpan[] = new Array(blocks.length);
  let group: Array<{ i: number; col: number }> = [];
  let colEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    const cols = colEnds.length;
    for (const g of group) result[g.i] = { col: g.col, cols };
    group = [];
    colEnds = [];
    groupEnd = -Infinity;
  };

  for (const b of order) {
    // A new overlap group starts once a block begins after everything so far.
    if (group.length && b.start >= groupEnd) flush();
    let col = colEnds.findIndex((end) => end <= b.start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(b.end);
    } else {
      colEnds[col] = b.end;
    }
    group.push({ i: b.i, col });
    groupEnd = Math.max(groupEnd, b.end);
  }
  flush();
  return result;
}

export function WeekGrid({
  anchorDate,
  today,
  childList,
  selectedChildIds,
  events,
  schedules,
  assignmentsByWeekday,
  onSelectDay,
  childSchoolHolidays = [],
  substituteOn = [],
}: Props) {
  const monday = startOfWeekUtc(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Distinct school-holiday names covering each weekday, limited to the
  // currently selected children (matching how schedules/work are filtered).
  const holidayNamesByIso = new Map<string, string[]>();
  for (const d of days) {
    const iso = formatIsoDateUtc(d);
    const names: string[] = [];
    for (const h of childSchoolHolidays) {
      const inSelection =
        selectedChildIds.length === 0 || selectedChildIds.includes(h.childId);
      if (!inSelection) continue;
      if (iso < h.startDate || iso > h.endDate) continue;
      const label = h.name ?? "Schulferien";
      if (!names.includes(label)) names.push(label);
    }
    if (names.length > 0) holidayNamesByIso.set(iso, names);
  }

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

  const minutesToPos = (mins: number) => {
    const offset = mins - START_HOUR * 60;
    return Math.max(0, Math.min(totalHeight, (offset / 60) * HOUR_HEIGHT));
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-border">
        <div />
        {days.map((d, i) => {
          const isToday = isSameUtcDay(d, today);
          const holidayNames = holidayNamesByIso.get(formatIsoDateUtc(d));
          return (
            <button
              key={formatIsoDateUtc(d)}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "flex flex-col items-center py-2 text-xs hover:bg-accent",
                i > 0 && "border-l border-border",
                holidayNames && "bg-emerald-700/10",
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
              {holidayNames ? (
                <span
                  className="mt-0.5 w-full truncate px-1 text-center text-[9px] font-medium text-emerald-800"
                  title={holidayNames.join(" · ")}
                >
                  {holidayNames.join(", ")}
                </span>
              ) : null}
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
              (e.type === "WORK" || e.type === "INDIRECT") &&
              isSameUtcDay(e.date, d) &&
              // Indirekte Leistungen ohne Kind-Verknüpfung werden unabhängig
              // vom Kinder-Filter angezeigt, da sie nicht kindgebunden sind.
              (selectedChildIds.length === 0 ||
                !e.childId ||
                selectedChildIds.includes(e.childId)),
          );
          // Only the children this user actually covers on this weekday get a
          // Stundenplan block. Substitute coverage is rendered separately as
          // its own amber Vertretung block, so pure-substitute children are
          // naturally excluded here (they aren't in the regular assignment).
          const assignedToday = new Set(
            childIdsForDate(assignmentsByWeekday, d),
          );
          const daySchedules = schedules.filter(
            (s) =>
              s.weekday === wd &&
              selectedChildIds.includes(s.childId) &&
              assignedToday.has(s.childId),
          );

          const isHoliday = holidayNamesByIso.has(iso);

          return (
            <div
              key={formatIsoDateUtc(d)}
              className={cn(
                "relative",
                i > 0 && "border-l border-border",
                isHoliday && "bg-emerald-700/5",
              )}
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
                (() => {
                  // Lay schedules (planned), logged work and Vertretungen out
                  // together so overlapping blocks sit side by side instead of
                  // stacking their text on top of each other.
                  type DayBlock = { id: string; start: number; end: number } & (
                    | {
                        kind: "vertretung";
                        data: (typeof dayVertretungen)[number];
                      }
                    | { kind: "schedule"; data: (typeof daySchedules)[number] }
                    | { kind: "work"; data: (typeof dayWork)[number] }
                  );

                  const blocks: DayBlock[] = [];
                  for (const v of dayVertretungen) {
                    blocks.push({
                      kind: "vertretung",
                      id: `v-${v.id}`,
                      start: timeToMinutes(v.startTime),
                      end: timeToMinutes(v.endTime),
                      data: v,
                    });
                  }
                  const workSpans = dayWork.map((ev) => {
                    const start = ev.startTime
                      ? timeToMinutes(ev.startTime)
                      : START_HOUR * 60;
                    const end = ev.endTime
                      ? timeToMinutes(ev.endTime)
                      : start + 60;
                    return { childId: ev.childId, start, end };
                  });
                  for (const s of daySchedules) {
                    const start = timeToMinutes(s.startTime);
                    const end = timeToMinutes(s.endTime);
                    // Skip the planned block when the same child already has
                    // logged work covering it — the work block supersedes it.
                    const covered = workSpans.some(
                      (w) =>
                        w.childId === s.childId &&
                        w.start < end &&
                        start < w.end,
                    );
                    if (covered) continue;
                    blocks.push({
                      kind: "schedule",
                      id: `s-${s.id}`,
                      start,
                      end,
                      data: s,
                    });
                  }
                  for (const ev of dayWork) {
                    const start = ev.startTime
                      ? timeToMinutes(ev.startTime)
                      : START_HOUR * 60;
                    const end = ev.endTime
                      ? timeToMinutes(ev.endTime)
                      : start + 60;
                    blocks.push({
                      kind: "work",
                      id: `w-${ev.id}`,
                      start,
                      end,
                      data: ev,
                    });
                  }

                  const layout = packColumns(blocks);

                  return blocks.map((b, idx) => {
                    const { col, cols } = layout[idx];
                    const top = minutesToPos(b.start);
                    const height = Math.max(minutesToPos(b.end) - top, 16);
                    const width = `calc(${100 / cols}% - 3px)`;
                    const left = `calc(${(100 / cols) * col}% + 1px)`;
                    const style = { top, height, width, left };

                    if (b.kind === "vertretung") {
                      const v = b.data;
                      return (
                        <div
                          key={b.id}
                          className="absolute overflow-hidden rounded-md border border-amber-400 bg-amber-500/25 px-1 text-[10px] font-medium leading-tight text-amber-950"
                          style={style}
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
                    }

                    if (b.kind === "schedule") {
                      const s = b.data;
                      const name = childFirstName(s.childId);
                      return (
                        <div
                          key={b.id}
                          className="absolute overflow-hidden rounded-sm border border-dashed border-muted-foreground/30 bg-muted/40 px-1 text-[9px] leading-tight text-muted-foreground"
                          style={style}
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
                    }

                    const ev = b.data;
                    const name = childFirstName(ev.childId);
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "absolute overflow-hidden rounded-md border px-1 text-[10px] font-medium leading-tight",
                          colorFor(ev.childId),
                        )}
                        style={style}
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
                  });
                })()
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
