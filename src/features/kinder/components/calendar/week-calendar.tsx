"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  snapHours,
  startOfWeekMonday,
  toIso,
  type CalendarEvent,
} from "./week-utils";
import { EventCreateDialog } from "./event-create-dialog";
import {
  deleteAbsenceAction,
  deleteAssignmentAction,
  deleteScheduleAction,
} from "../../actions";
import type {
  SerializedAbsence,
  SerializedAssignment,
  SerializedSchedule,
} from "../serialize";

type SchulbegleiterOption = { id: string; name: string };

type Props = {
  childId: string;
  childLabel: string;
  schedules: SerializedSchedule[];
  assignments: SerializedAssignment[];
  absences: SerializedAbsence[];
  schulbegleiterOptions: SchulbegleiterOption[];
  onChanged: () => void;
};

type DragState = {
  weekday: number;
  startHour: number;
  endHour: number;
} | null;

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
  schulbegleiterOptions,
  onChanged,
}: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date()),
  );
  const [drag, setDrag] = useState<DragState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    for (const s of schedules) {
      list.push({
        layer: "schedule",
        weekday: s.weekday,
        startHour: clampHours(parseTime(s.startTime)),
        endHour: clampHours(parseTime(s.endTime)),
        id: s.id,
        label: "Stundenplan",
        sublabel: `${s.startTime}–${s.endTime}`,
      });
    }
    for (const a of assignments) {
      list.push({
        layer: "assignment",
        weekday: a.weekday,
        startHour: clampHours(parseTime(a.startTime)),
        endHour: clampHours(parseTime(a.endTime)),
        id: a.id,
        label: a.userName,
        sublabel: `${a.startTime}–${a.endTime}`,
        tandem: a.tandem,
      });
    }
    const weekFrom = weekStart;
    const weekTo = addDays(weekStart, 6);
    for (const ab of absences) {
      const d = new Date(`${ab.date}T00:00:00`);
      if (d < weekFrom || d > weekTo) continue;
      const wd = (d.getDay() + 6) % 7;
      list.push({
        layer: "absence",
        weekday: wd,
        startHour: START_HOUR,
        endHour: END_HOUR,
        id: ab.id,
        label: "Krank",
        sublabel: ab.note ?? undefined,
      });
    }
    return list;
  }, [schedules, assignments, absences, weekStart]);

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
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Legend
            color="bg-muted"
            label="Stundenplan"
          />
          <Legend
            color="bg-primary/70"
            label="Zuweisung"
          />
          <Legend
            color="bg-red-500/70"
            label="Krankheit"
          />
        </div>
      </div>

      <div
        className="overflow-hidden rounded-md border bg-card"
        ref={gridRef}
      >
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b bg-muted/40 text-xs">
          <div />
          {DAY_LABELS_DE.map((label, i) => {
            const date = addDays(weekStart, i);
            const isToday = toIso(date) === toIso(new Date());
            return (
              <div
                key={label}
                className={cn(
                  "px-2 py-2 text-center font-medium",
                  isToday && "text-primary",
                )}
              >
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {DAY_SHORT_DE[i]}
                </div>
                <div className="text-sm">
                  {date.getDate().toString().padStart(2, "0")}
                </div>
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
            const dayEvents = events.filter((e) => e.weekday === weekday);
            return (
              <div
                key={label}
                className="relative border-l select-none"
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

                {dayEvents.map((ev) => (
                  <EventBlock
                    key={`${ev.layer}-${ev.id}`}
                    ev={ev}
                    onDelete={() => handleDelete(ev.layer, ev.id)}
                  />
                ))}

                {dragSelection && dragSelection.weekday === weekday ? (
                  <div
                    className="pointer-events-none absolute inset-x-1 z-10 rounded border-2 border-primary bg-primary/15"
                    style={{
                      top: (dragSelection.startHour - START_HOUR) * HOUR_HEIGHT,
                      height: Math.max(
                        12,
                        (dragSelection.endHour - dragSelection.startHour) *
                          HOUR_HEIGHT,
                      ),
                    }}
                  >
                    <div className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      {hoursToTime(dragSelection.startHour)}–
                      {hoursToTime(dragSelection.endHour)}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {dragSelection ? (
        <EventCreateDialog
          open={createOpen}
          onOpenChange={(next) => {
            setCreateOpen(next);
            if (!next) setDrag(null);
          }}
          childId={childId}
          weekStart={weekStart}
          weekday={dragSelection.weekday}
          startHour={dragSelection.startHour}
          endHour={dragSelection.endHour}
          schulbegleiterOptions={schulbegleiterOptions}
          onSaved={() => {
            setDrag(null);
            onChanged();
          }}
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        Tipp: Klicke und ziehe in der Wochenansicht, um einen neuen Eintrag für{" "}
        <strong>{childLabel}</strong> anzulegen.
      </p>
    </div>
  );
}

function EventBlock({
  ev,
  onDelete,
}: {
  ev: CalendarEvent;
  onDelete: () => void;
}) {
  const top = (ev.startHour - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(20, (ev.endHour - ev.startHour) * HOUR_HEIGHT);

  const style: React.CSSProperties = { top, height };
  let layerClasses = "";
  if (ev.layer === "schedule") {
    layerClasses =
      "left-1 right-1 z-0 bg-muted border border-muted-foreground/20 text-foreground/70";
  } else if (ev.layer === "assignment") {
    layerClasses =
      "left-1 right-1 z-10 bg-primary/15 border border-primary/40 text-foreground";
    if (ev.tandem) {
      style.right = "50%";
      layerClasses += " ring-1 ring-primary";
    }
  } else {
    layerClasses =
      "left-1 right-1 z-20 bg-red-500/15 border border-red-500/40 text-red-900 dark:text-red-200";
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute flex flex-col gap-0.5 overflow-hidden rounded px-1.5 py-1 text-left text-[11px] leading-tight hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            layerClasses,
          )}
          style={style}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="font-medium">
            {ev.label}
            {ev.tandem ? (
              <span className="ml-1 rounded bg-primary px-1 py-px text-[9px] font-semibold text-primary-foreground">
                Tandem
              </span>
            ) : null}
          </span>
          {ev.sublabel ? (
            <span className="truncate text-[10px] opacity-80">
              {ev.sublabel}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
      >
        <div className="flex flex-col gap-2 text-sm">
          <div>
            <div className="font-medium">{ev.label}</div>
            {ev.sublabel ? (
              <div className="text-xs text-muted-foreground">{ev.sublabel}</div>
            ) : null}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
          >
            <Trash2 />
            Löschen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}
