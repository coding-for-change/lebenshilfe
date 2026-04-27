"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  Stethoscope,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
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
import { EventCreateForm } from "./event-create-dialog";
import {
  createAssignmentAction,
  deleteAbsenceAction,
  deleteAssignmentAction,
  deleteScheduleAction,
  saveAbsenceAction,
  updateAssignmentAction,
  updateScheduleAction,
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

export type EventKind = "schedule" | "assignment" | "absence";

// Static legend in the toolbar — the segmented kind-picker is gone now that
// only Stundenplan is created via drag in the hour grid; Zuweisung +
// Krankheit are added per day from the header's "+" button.
const LEGEND_ITEMS: { label: string; swatch: string }[] = [
  { label: "Stundenplan", swatch: "bg-sky-500" },
  { label: "Zuweisung", swatch: "bg-primary/70" },
  { label: "Krankheit", swatch: "bg-red-500/70" },
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
  schulbegleiterOptions,
  onChanged,
}: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date()),
  );
  const [drag, setDrag] = useState<DragState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

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
  const absencesByWeekday = useMemo(() => {
    const map = new Map<number, SerializedAbsence>();
    const weekFrom = weekStart;
    const weekTo = addDays(weekStart, 6);
    for (const ab of absences) {
      const d = new Date(`${ab.date}T00:00:00`);
      if (d < weekFrom || d > weekTo) continue;
      const wd = (d.getDay() + 6) % 7;
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
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {LEGEND_ITEMS.map(({ label, swatch }) => (
            <span
              key={label}
              className="flex items-center gap-1.5"
            >
              <span className={cn("size-2.5 rounded-sm", swatch)} />
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
            const isToday = toIso(date) === toIso(new Date());
            const dayAssignments = assignmentsByWeekday.get(weekday) ?? [];
            const dayAbsence = absencesByWeekday.get(weekday) ?? null;
            return (
              <div
                key={label}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 border-l px-1.5 py-2 first:border-l-0",
                  isToday && "text-primary",
                )}
              >
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {DAY_SHORT_DE[weekday]}
                </div>
                <div className="text-sm font-medium">
                  {date.getDate().toString().padStart(2, "0")}
                </div>
                <DayQuickAddSection
                  weekday={weekday}
                  date={date}
                  childId={childId}
                  assignments={dayAssignments}
                  absence={dayAbsence}
                  schulbegleiterOptions={schulbegleiterOptions}
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

                {/* Schedules only — assignment + absence live in the day header. */}
                {dayStacked.map((ev) => (
                  <EventBlock
                    key={`${ev.layer}-${ev.id}`}
                    ev={ev}
                    col={ev.col}
                    cols={ev.cols}
                    onDelete={() => handleDelete(ev.layer, ev.id)}
                    onMove={(s, e) => handleMove(ev, s, e)}
                  />
                ))}

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
                        schulbegleiterOptions={schulbegleiterOptions}
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

function EventBlock({
  ev,
  col,
  cols,
  onDelete,
  onMove,
}: {
  ev: CalendarEvent;
  col: number;
  cols: number;
  onDelete: () => void;
  onMove: (newStartHour: number, newEndHour: number) => void | Promise<void>;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  // Visual offset (in fractional hours) while a drag-to-move is in progress.
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const draggable = ev.layer !== "absence";
  const top = (ev.startHour - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(20, (ev.endHour - ev.startHour) * HOUR_HEIGHT);
  const visualTopOffset = (dragOffset ?? 0) * HOUR_HEIGHT;

  // Breathing room: an inset on every side so the surrounding grid is still
  // clickable for drag-to-create even when columns are densely packed.
  const SIDE_INSET = 4; // px on left + right
  const TOP_INSET = 3; // px on top + bottom

  // Per-column positioning. Cluster width is divided into `cols` slots; this
  // event occupies slot `col`.
  const slotWidthPct = 100 / cols;
  const leftPct = col * slotWidthPct;
  const style: React.CSSProperties = {
    top: top + visualTopOffset + TOP_INSET,
    height: Math.max(12, height - 2 * TOP_INSET),
    left: `calc(${leftPct}% + ${SIDE_INSET}px)`,
    width: `calc(${slotWidthPct}% - ${2 * SIDE_INSET}px)`,
  };

  let layerClasses = "";
  if (ev.layer === "schedule") {
    layerClasses =
      "z-0 bg-sky-500/15 border border-sky-500/40 text-sky-900 dark:text-sky-200";
  } else if (ev.layer === "assignment") {
    layerClasses =
      "z-10 bg-primary/15 border border-primary/40 text-foreground";
    if (ev.tandem) {
      layerClasses += " ring-1 ring-primary";
    }
  } else {
    // Absence: full-width backdrop, override the column slot.
    style.left = `${SIDE_INSET}px`;
    style.width = `calc(100% - ${2 * SIDE_INSET}px)`;
    layerClasses =
      "z-20 bg-red-500/15 border border-red-500/40 text-red-900 dark:text-red-200";
  }
  if (dragOffset !== null) {
    layerClasses += " ring-2 ring-primary cursor-grabbing";
  }

  // Drag-to-move on event blocks. Mouse-down records the starting Y. If the
  // pointer moves > 4px before release, we treat it as a drag and snap to
  // 15-minute increments. Otherwise the click opens the delete popover.
  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    // Stop the calendar grid from starting a drag-to-create on the same press.
    e.stopPropagation();

    if (!draggable) {
      // Click on absence: open popover; don't drag.
      setPopoverOpen(true);
      return;
    }

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    let dragged = false;
    let lastOffset = 0;
    const minOffset = START_HOUR - ev.startHour;
    const maxOffset = END_HOUR - ev.endHour;

    const onMoveEv = (mv: PointerEvent) => {
      const dy = mv.clientY - startY;
      if (Math.abs(dy) > 4) dragged = true;
      const raw = snapHours(dy / HOUR_HEIGHT);
      lastOffset = Math.max(minOffset, Math.min(maxOffset, raw));
      setDragOffset(lastOffset);
    };
    const onUpEv = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", onMoveEv);
      target.removeEventListener("pointerup", onUpEv);
      target.removeEventListener("pointercancel", onUpEv);
      setDragOffset(null);
      if (dragged && lastOffset !== 0) {
        void onMove(ev.startHour + lastOffset, ev.endHour + lastOffset);
      } else if (!dragged) {
        setPopoverOpen(true);
      }
    };
    target.addEventListener("pointermove", onMoveEv);
    target.addEventListener("pointerup", onUpEv);
    target.addEventListener("pointercancel", onUpEv);
  }

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
    >
      <PopoverAnchor asChild>
        <button
          type="button"
          className={cn(
            "absolute flex flex-col gap-0.5 overflow-hidden rounded px-1.5 py-1 text-left text-[11px] leading-tight hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            draggable && "cursor-grab",
            layerClasses,
          )}
          style={style}
          onPointerDown={handlePointerDown}
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
      </PopoverAnchor>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-col gap-2 text-sm"
          onPointerDown={(e) => e.stopPropagation()}
        >
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

// Per-day cell shown beneath the date number: chips for existing
// assignments + absence, plus a dashed "+" button that opens a popover
// to create a new whole-day Zuweisung or Krankheit for this day.
function DayQuickAddSection({
  weekday,
  date,
  childId,
  assignments,
  absence,
  schulbegleiterOptions,
  onChanged,
}: {
  weekday: number;
  date: Date;
  childId: string;
  assignments: SerializedAssignment[];
  absence: SerializedAbsence | null;
  schulbegleiterOptions: { id: string; name: string }[];
  onChanged: () => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "assignment" | "absence">(
    "choose",
  );

  function reset() {
    setStep("choose");
  }

  async function handleDeleteAssignment(id: string) {
    try {
      await deleteAssignmentAction(id);
      toast.success("Zuweisung entfernt.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    }
  }

  async function handleDeleteAbsence(id: string) {
    try {
      await deleteAbsenceAction(id);
      toast.success("Krankheitstag entfernt.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
      {/* Existing chips for this day. */}
      {absence ? (
        <DayChip
          variant="absence"
          label="Krank"
          title={absence.note ?? undefined}
          onDelete={() => handleDeleteAbsence(absence.id)}
        />
      ) : null}
      {assignments.map((a) => (
        <DayChip
          key={a.id}
          variant="assignment"
          label={a.userName}
          title={a.tandem ? "Tandem" : undefined}
          tandem={a.tandem}
          onDelete={() => handleDeleteAssignment(a.id)}
        />
      ))}

      <Popover
        open={popoverOpen}
        onOpenChange={(next) => {
          setPopoverOpen(next);
          if (!next) reset();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Zuweisung oder Krankheit hinzufügen"
            className="flex h-6 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground transition-colors hover:border-primary hover:bg-accent/50 hover:text-foreground"
          >
            <Plus className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="w-64 p-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {step === "choose" ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setStep("assignment")}
                className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="size-2.5 rounded-sm bg-primary/70" />
                <User className="size-4" />
                <span className="font-medium">Zuweisung</span>
              </button>
              <button
                type="button"
                onClick={() => setStep("absence")}
                className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="size-2.5 rounded-sm bg-red-500/70" />
                <Stethoscope className="size-4" />
                <span className="font-medium">Krankheit</span>
              </button>
            </div>
          ) : step === "assignment" ? (
            <DayAssignmentForm
              childId={childId}
              weekday={weekday}
              schulbegleiterOptions={schulbegleiterOptions}
              onSaved={() => {
                setPopoverOpen(false);
                reset();
                onChanged();
              }}
              onBack={() => setStep("choose")}
            />
          ) : (
            <DayAbsenceForm
              childId={childId}
              date={date}
              onSaved={() => {
                setPopoverOpen(false);
                reset();
                onChanged();
              }}
              onBack={() => setStep("choose")}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DayChip({
  variant,
  label,
  title,
  tandem,
  onDelete,
}: {
  variant: "assignment" | "absence";
  label: string;
  title?: string;
  tandem?: boolean;
  onDelete: () => void;
}) {
  const styles =
    variant === "assignment"
      ? "bg-primary/15 text-foreground border-primary/30"
      : "bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/30";
  return (
    <div
      title={title ?? label}
      className={cn(
        "group/chip flex w-full min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight",
        styles,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {tandem ? (
        <span className="shrink-0 rounded bg-primary px-1 py-px text-[9px] font-semibold text-primary-foreground">
          T
        </span>
      ) : null}
      <button
        type="button"
        aria-label="Entfernen"
        onClick={onDelete}
        className="ml-auto shrink-0 opacity-0 transition-opacity group-hover/chip:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function DayAssignmentForm({
  childId,
  weekday,
  schulbegleiterOptions,
  onSaved,
  onBack,
}: {
  childId: string;
  weekday: number;
  schulbegleiterOptions: { id: string; name: string }[];
  onSaved: () => void;
  onBack: () => void;
}) {
  const [userId, setUserId] = useState(schulbegleiterOptions[0]?.id ?? "");
  const [tandem, setTandem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!userId) {
      setError("Bitte Schulbegleiter wählen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Whole-day assignment — the server still requires start/end so we
      // pin them to the visible day boundaries.
      await createAssignmentAction({
        childId,
        userId,
        weekday,
        startTime: "00:00",
        endTime: "23:59",
        tandem,
      });
      toast.success("Zuweisung gespeichert.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-xs font-medium">Neue Zuweisung</div>
      <SchulbegleiterMiniCombobox
        options={schulbegleiterOptions}
        value={userId || null}
        onChange={(id) => setUserId(id ?? "")}
      />
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={tandem}
          onCheckedChange={(v) => setTandem(v === true)}
        />
        <span className="text-xs">Tandem</span>
      </label>
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={busy}
        >
          Zurück
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}

function DayAbsenceForm({
  childId,
  date,
  onSaved,
  onBack,
}: {
  childId: string;
  date: Date;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await saveAbsenceAction({
        childId,
        date: toIso(date),
        note: note.trim() || null,
      });
      toast.success("Krankheitstag gespeichert.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-xs font-medium">Krankheitstag</div>
      <Textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notiz (optional)…"
      />
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={busy}
        >
          Zurück
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}

function SchulbegleiterMiniCombobox({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value) ?? null;
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full justify-between font-normal"
          disabled={options.length === 0}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected
              ? selected.name
              : options.length === 0
                ? "Keine angenommenen Schulbegleiter."
                : "Schulbegleiter…"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Suchen…" />
          <CommandList>
            <CommandEmpty>Keine Treffer.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => {
                    onChange(o.id === value ? null : o.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

type PositionedEvent = CalendarEvent & { col: number; cols: number };

// Column-pack overlapping events per weekday, like Google/Outlook calendars.
// Step 1: greedy lane assignment (each event goes into the leftmost lane that
// is free at its startHour). Step 2: union-find clusters of events connected
// by overlap. Step 3: every event in a cluster reports the cluster's max lane
// count + 1 as its `cols`, so widths are uniform within the cluster.
function packEvents(events: CalendarEvent[]): PositionedEvent[] {
  const out: PositionedEvent[] = [];
  const byDay = new Map<number, CalendarEvent[]>();
  for (const e of events) {
    if (!byDay.has(e.weekday)) byDay.set(e.weekday, []);
    byDay.get(e.weekday)!.push(e);
  }

  for (const dayEvents of byDay.values()) {
    const sorted = [...dayEvents].sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      return b.endHour - b.startHour - (a.endHour - a.startHour);
    });

    // Greedy lane assignment.
    const lanes: number[] = []; // lane endHour
    const laneOf = new Map<CalendarEvent, number>();
    for (const ev of sorted) {
      let placed = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= ev.startHour) {
          placed = i;
          lanes[i] = ev.endHour;
          break;
        }
      }
      if (placed === -1) {
        placed = lanes.length;
        lanes.push(ev.endHour);
      }
      laneOf.set(ev, placed);
    }

    // Cluster events connected by overlap (transitively) via union-find.
    const parent = new Map<CalendarEvent, CalendarEvent>();
    for (const e of sorted) parent.set(e, e);
    const find = (e: CalendarEvent): CalendarEvent => {
      const p = parent.get(e)!;
      if (p === e) return e;
      const root = find(p);
      parent.set(e, root);
      return root;
    };
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (a.startHour < b.endHour && b.startHour < a.endHour) {
          const ra = find(a);
          const rb = find(b);
          if (ra !== rb) parent.set(ra, rb);
        }
      }
    }

    // Cluster size = max lane index + 1, shared by all members.
    const clusterCols = new Map<CalendarEvent, number>();
    for (const e of sorted) {
      const root = find(e);
      const next = (laneOf.get(e) ?? 0) + 1;
      const cur = clusterCols.get(root) ?? 0;
      if (next > cur) clusterCols.set(root, next);
    }

    for (const e of sorted) {
      out.push({
        ...e,
        col: laneOf.get(e)!,
        cols: clusterCols.get(find(e))!,
      });
    }
  }

  return out;
}
