"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DAY_LABELS_DE,
  DAY_SHORT_DE,
  END_HOUR,
  HOUR_HEIGHT,
  START_HOUR,
  addDays,
  clampHours,
  germanWeekRangeLabel,
  hoursToTime,
  packEvents,
  parseTime,
  snapHours,
  startOfWeekMonday,
  type CalendarEvent,
} from "./week-utils";
import { formatDate, formatIsoDateLocal } from "@/lib/utils";
import { EventCreateForm } from "./event-create-dialog";
import { EventBlock } from "./event-block";
import { ScheduleEinsatzBlock } from "./schedule-einsatz-block";
import { DayQuickAddSection } from "./day-quick-add";
import {
  deleteAbsenceAction,
  deleteAssignmentAction,
  deleteScheduleAction,
  listWorkEventsForChildInRangeAction,
  updateAssignmentAction,
  updateScheduleAction,
} from "../../actions";
import type {
  SerializedAbsence,
  SerializedAssignment,
  SerializedSchedule,
  SerializedSchoolHoliday,
  SerializedVertretung,
  SerializedWorkEvent,
} from "../../serialize";

type SchoolAssistantOption = { id: string; name: string };

type Props = {
  childId: string;
  childLabel: string;
  schedules: SerializedSchedule[];
  assignments: SerializedAssignment[];
  absences: SerializedAbsence[];
  holidays: SerializedSchoolHoliday[];
  vertretungen: SerializedVertretung[];
  schoolAssistantOptions: SchoolAssistantOption[];
  onChanged: () => void;
};

type DragState = {
  weekday: number;
  startHour: number;
  endHour: number;
} | null;

export type EventKind = "schedule" | "assignment" | "absence";

const LEGEND_ITEMS: { label: string; swatch: string }[] = [
  { label: "Stundenplan", swatch: "bg-sky-500" },
  { label: "Zuweisung", swatch: "bg-primary/70" },
  { label: "Vertretung", swatch: "bg-amber-500/70" },
  { label: "Krankheit", swatch: "bg-red-500/70" },
  { label: "Einsatz überschreitet", swatch: "bg-red-500" },
];

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
);

export function KinderWeekCalendar({
  childId,
  childLabel,
  schedules,
  assignments,
  absences,
  holidays,
  vertretungen,
  schoolAssistantOptions,
  onChanged,
}: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date()),
  );
  const [workEvents, setWorkEvents] = useState<SerializedWorkEvent[]>([]);
  const [drag, setDrag] = useState<DragState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const weekStartIso = formatIsoDateLocal(weekStart);
    listWorkEventsForChildInRangeAction(childId, weekStartIso)
      .then(setWorkEvents)
      .catch(() => setWorkEvents([]));
  }, [childId, weekStart]);

  const workEventsByDate = useMemo(() => {
    const map = new Map<string, SerializedWorkEvent[]>();
    for (const e of workEvents) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [workEvents]);

  // Hour grid is schedules only — assignments and absences are whole-day
  // and live in the day-header chips, not the time grid.
  const stacked = useMemo(() => {
    const stackable: CalendarEvent[] = schedules.map((s) => ({
      layer: "schedule",
      weekday: s.weekday,
      startHour: clampHours(parseTime(s.startTime)),
      endHour: clampHours(parseTime(s.endTime)),
      id: s.id,
      label: "Stundenplan",
      sublabel: `${s.startTime}–${s.endTime}`,
    }));
    return packEvents(stackable);
  }, [schedules]);

  // Map absence date → entry, restricted to the visible week.
  // Use ISO string comparison (YYYY-MM-DD) to avoid local-vs-UTC timezone
  // issues: addDays uses raw ms (local midnight), but stored dates are UTC.
  const absencesByWeekday = useMemo(() => {
    const map = new Map<number, SerializedAbsence>();
    const isoFrom = formatIsoDateLocal(weekStart);
    const isoTo = formatIsoDateLocal(addDays(weekStart, 6));
    for (const ab of absences) {
      if (ab.date < isoFrom || ab.date > isoTo) continue;
      // Parse as UTC to get the correct weekday.
      const wd = (new Date(ab.date).getUTCDay() + 6) % 7;
      map.set(wd, ab);
    }
    return map;
  }, [absences, weekStart]);

  const assignmentsByWeekday = useMemo(() => {
    const map = new Map<number, SerializedAssignment[]>();
    for (const a of assignments) {
      if (!map.has(a.weekday)) map.set(a.weekday, []);
      map.get(a.weekday)!.push(a);
    }
    return map;
  }, [assignments]);

  // For each weekday in the visible week, the school holiday covering it (if
  // any), keeping the latest end date for the "bis …" hint. ISO-string compare
  // matches the absence handling and avoids timezone drift.
  const holidayByWeekday = useMemo(() => {
    const map = new Map<number, SerializedSchoolHoliday>();
    for (let wd = 0; wd < 7; wd++) {
      const iso = formatIsoDateLocal(addDays(weekStart, wd));
      let match: SerializedSchoolHoliday | null = null;
      for (const h of holidays) {
        if (iso < h.startDate || iso > h.endDate) continue;
        if (!match || h.endDate > match.endDate) match = h;
      }
      if (match) map.set(wd, match);
    }
    return map;
  }, [holidays, weekStart]);

  // Map ISO date string → vertretungen for that date (restricted to visible week).
  // Use ISO string comparison (YYYY-MM-DD) to avoid local-vs-UTC timezone
  // issues: addDays uses raw ms (local midnight), but stored dates are UTC.
  const vertretungenByDate = useMemo(() => {
    const map = new Map<string, SerializedVertretung[]>();
    const isoFrom = formatIsoDateLocal(weekStart);
    const isoTo = formatIsoDateLocal(addDays(weekStart, 6));
    for (const v of vertretungen) {
      if (v.date < isoFrom || v.date > isoTo) continue;
      if (!map.has(v.date)) map.set(v.date, []);
      map.get(v.date)!.push(v);
    }
    return map;
  }, [vertretungen, weekStart]);

  const goPrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const goNextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(startOfWeekMonday(new Date()));

  // Drag-to-create wiring on a per-day column.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, weekday: number) => {
      if (e.button !== 0) return;
      const col = e.currentTarget;
      col.setPointerCapture(e.pointerId);
      const rect = col.getBoundingClientRect();
      const yToHour = (clientY: number) =>
        snapHours(START_HOUR + (clientY - rect.top) / HOUR_HEIGHT);
      const startHour = clampHours(yToHour(e.clientY));
      setDrag({ weekday, startHour, endHour: startHour + 0.5 });

      const onMove = (ev: PointerEvent) => {
        const next = clampHours(yToHour(ev.clientY));
        setDrag((prev) =>
          prev
            ? {
                ...prev,
                endHour: next === prev.startHour ? next + 0.25 : next,
              }
            : prev,
        );
      };
      const onUp = () => {
        col.releasePointerCapture(e.pointerId);
        col.removeEventListener("pointermove", onMove);
        col.removeEventListener("pointerup", onUp);
        col.removeEventListener("pointercancel", onUp);
        setDrag((prev) => {
          if (!prev) return null;
          // Open dialog next render with the captured selection.
          queueMicrotask(() => setCreateOpen(true));
          return prev;
        });
      };
      col.addEventListener("pointermove", onMove);
      col.addEventListener("pointerup", onUp);
      col.addEventListener("pointercancel", onUp);
    },
    [],
  );

  async function handleDelete(layer: CalendarEvent["layer"], id: string) {
    try {
      if (layer === "assignment") await deleteAssignmentAction(id);
      else if (layer === "schedule") await deleteScheduleAction(id);
      else await deleteAbsenceAction(id);
      toast.success("Eintrag gelöscht.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    }
  }

  async function handleMove(
    ev: CalendarEvent,
    newStartHour: number,
    newEndHour: number,
  ) {
    try {
      const startTime = hoursToTime(newStartHour);
      const endTime = hoursToTime(newEndHour);
      if (ev.layer === "assignment") {
        await updateAssignmentAction(ev.id, {
          weekday: ev.weekday,
          startTime,
          endTime,
        });
      } else if (ev.layer === "schedule") {
        await updateScheduleAction(ev.id, {
          weekday: ev.weekday,
          startTime,
          endTime,
        });
      } else {
        return;
      }
      toast.success("Verschoben.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Verschieben fehlgeschlagen.",
      );
    }
  }

  const dragSelection = useMemo(() => {
    if (!drag) return null;
    const a = Math.min(drag.startHour, drag.endHour);
    const b = Math.max(drag.startHour, drag.endHour);
    return { weekday: drag.weekday, startHour: a, endHour: b };
  }, [drag]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrevWeek}
            aria-label="Vorherige Woche"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
          >
            Heute
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goNextWeek}
            aria-label="Nächste Woche"
          >
            <ChevronRight />
          </Button>
        </div>
        <span className="text-sm font-medium">
          {germanWeekRangeLabel(weekStart)}
        </span>
        <div className="grid grid-flow-col grid-rows-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {LEGEND_ITEMS.map(({ label, swatch }) => (
            <span
              key={label}
              className="flex items-center gap-1.5"
            >
              <span className={cn("size-2.5 shrink-0 rounded-sm", swatch)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-md border bg-card"
        ref={gridRef}
      >
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b bg-muted/40 text-xs">
          <div />
          {DAY_LABELS_DE.map((label, weekday) => {
            const date = addDays(weekStart, weekday);
            const isToday =
              formatIsoDateLocal(date) === formatIsoDateLocal(new Date());
            const dayAssignments = assignmentsByWeekday.get(weekday) ?? [];
            const dayAbsence = absencesByWeekday.get(weekday) ?? null;
            const dayHoliday = holidayByWeekday.get(weekday) ?? null;
            const isoDate = formatIsoDateLocal(date);
            const dayVertretungen = vertretungenByDate.get(isoDate) ?? [];
            const daySchedules = schedules.filter((s) => s.weekday === weekday);
            return (
              <div
                key={label}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 border-l px-1.5 py-2 first:border-l-0",
                  isToday && "text-primary",
                  dayHoliday && "bg-emerald-700/20",
                )}
              >
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {DAY_SHORT_DE[weekday]}
                </div>
                <div className="text-sm font-medium">
                  {date.getDate().toString().padStart(2, "0")}
                </div>
                {dayHoliday ? (
                  <div
                    className="w-full truncate rounded bg-emerald-700/20 px-1 py-0.5 text-center text-[10px] font-medium text-emerald-900"
                    title={`${dayHoliday.name ?? "Schulferien"} · bis ${formatDate(dayHoliday.endDate)}`}
                  >
                    {dayHoliday.name ?? "Schulferien"}
                  </div>
                ) : null}
                <DayQuickAddSection
                  weekday={weekday}
                  date={date}
                  childId={childId}
                  assignments={dayAssignments}
                  absence={dayAbsence}
                  vertretungen={dayVertretungen}
                  daySchedules={daySchedules}
                  schoolAssistantOptions={schoolAssistantOptions}
                  onChanged={onChanged}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          {/* Hours gutter */}
          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="border-b pr-2 text-right text-[11px] text-muted-foreground"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {DAY_LABELS_DE.map((label, weekday) => {
            const dayStacked = stacked.filter((e) => e.weekday === weekday);
            const dateIso = formatIsoDateLocal(addDays(weekStart, weekday));
            const dayEinsaetze = workEventsByDate.get(dateIso) ?? [];
            const dayHoliday = holidayByWeekday.get(weekday) ?? null;
            return (
              <div
                key={label}
                className={cn(
                  "relative border-l select-none",
                  dayHoliday && "bg-emerald-700/5",
                )}
                onPointerDown={(e) => handlePointerDown(e, weekday)}
                style={{
                  height: HOURS.length * HOUR_HEIGHT,
                  touchAction: "none",
                }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-border/50"
                  />
                ))}

                {dayStacked.map((ev) =>
                  ev.layer === "schedule" && dayEinsaetze.length > 0 ? (
                    <ScheduleEinsatzBlock
                      key={`schedule-einsatz-${ev.id}`}
                      ev={ev}
                      col={ev.col}
                      cols={ev.cols}
                      einsaetze={dayEinsaetze}
                      onDelete={() => handleDelete(ev.layer, ev.id)}
                      onMove={(s, e) => handleMove(ev, s, e)}
                    />
                  ) : (
                    <EventBlock
                      key={`${ev.layer}-${ev.id}`}
                      ev={ev}
                      col={ev.col}
                      cols={ev.cols}
                      onDelete={() => handleDelete(ev.layer, ev.id)}
                      onMove={(s, e) => handleMove(ev, s, e)}
                    />
                  ),
                )}

                {dragSelection && dragSelection.weekday === weekday ? (
                  <Popover
                    open={createOpen}
                    onOpenChange={(next) => {
                      if (!next) {
                        setCreateOpen(false);
                        setDrag(null);
                      }
                    }}
                  >
                    <PopoverAnchor asChild>
                      <div
                        className="pointer-events-none absolute inset-x-1 z-30 rounded border-2 border-sky-500 bg-sky-500/15"
                        style={{
                          top:
                            (dragSelection.startHour - START_HOUR) *
                            HOUR_HEIGHT,
                          height: Math.max(
                            12,
                            (dragSelection.endHour - dragSelection.startHour) *
                              HOUR_HEIGHT,
                          ),
                        }}
                      >
                        <div className="absolute -top-5 left-0 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {hoursToTime(dragSelection.startHour)}–
                          {hoursToTime(dragSelection.endHour)}
                        </div>
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      collisionPadding={12}
                      className="w-72 p-3"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerDownOutside={(e) => e.stopPropagation()}
                    >
                      <EventCreateForm
                        kind="schedule"
                        childId={childId}
                        weekStart={weekStart}
                        weekday={dragSelection.weekday}
                        startHour={dragSelection.startHour}
                        endHour={dragSelection.endHour}
                        schoolAssistantOptions={schoolAssistantOptions}
                        onSaved={() => {
                          setCreateOpen(false);
                          setDrag(null);
                          onChanged();
                        }}
                        onCancel={() => {
                          setCreateOpen(false);
                          setDrag(null);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tipp: Klicke und ziehe in der Wochenansicht, um einen neuen Eintrag für{" "}
        <strong>{childLabel}</strong> anzulegen.
      </p>
    </div>
  );
}
