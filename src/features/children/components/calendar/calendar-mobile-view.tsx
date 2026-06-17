"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "@/components/mobile-sheet";
import { cn, formatIsoDateLocal } from "@/lib/utils";
import { DayQuickAddSection } from "./day-quick-add";
import { TimeRangeFields } from "./event-form-shell";
import {
  DAY_LABELS_DE,
  DAY_SHORT_DE,
  addDays,
  einsatzExceeds,
  germanWeekRangeLabel,
  parseTime,
} from "./week-utils";
import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "../../actions";
import type {
  SerializedAbsence,
  SerializedAssignment,
  SerializedSchedule,
  SerializedVertretung,
  SerializedWorkEvent,
} from "../../serialize";

type SchoolAssistantOption = { id: string; name: string };

type Props = {
  childId: string;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  schedules: SerializedSchedule[];
  assignments: SerializedAssignment[];
  absences: SerializedAbsence[];
  vertretungen: SerializedVertretung[];
  workEventsByDate: Map<string, SerializedWorkEvent[]>;
  schoolAssistantOptions: SchoolAssistantOption[];
  onChanged: () => void;
};

type ScheduleSheetState =
  | { mode: "create" }
  | { mode: "edit"; schedule: SerializedSchedule }
  | null;

/**
 * The mobile counterpart of the 7-day drag grid: a week strip + a single-day
 * agenda. A whole day fits a phone, so every desktop capability is preserved —
 * Stundenplan/Zuweisung/Vertretung/Krankheit are created and edited through
 * touch forms (the same server actions the drag grid uses), the drag merely
 * being replaced by tapping. The Einsatz coverage cross-check is shown inline.
 */
export function CalendarMobileView({
  childId,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  schedules,
  assignments,
  absences,
  vertretungen,
  workEventsByDate,
  schoolAssistantOptions,
  onChanged,
}: Props) {
  const todayIso = formatIsoDateLocal(new Date());
  const [selectedWeekday, setSelectedWeekday] = useState<number>(() => {
    // Default to today when the current week is shown.
    const wd = (new Date().getDay() + 6) % 7;
    return wd;
  });
  const [scheduleSheet, setScheduleSheet] = useState<ScheduleSheetState>(null);

  const schedulesByWeekday = useMemo(() => {
    const map = new Map<number, SerializedSchedule[]>();
    for (const s of schedules) {
      if (!map.has(s.weekday)) map.set(s.weekday, []);
      map.get(s.weekday)!.push(s);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [schedules]);

  const assignmentsByWeekday = useMemo(() => {
    const map = new Map<number, SerializedAssignment[]>();
    for (const a of assignments) {
      if (!map.has(a.weekday)) map.set(a.weekday, []);
      map.get(a.weekday)!.push(a);
    }
    return map;
  }, [assignments]);

  const absencesByWeekday = useMemo(() => {
    const map = new Map<number, SerializedAbsence>();
    const isoFrom = formatIsoDateLocal(weekStart);
    const isoTo = formatIsoDateLocal(addDays(weekStart, 6));
    for (const ab of absences) {
      if (ab.date < isoFrom || ab.date > isoTo) continue;
      const wd = (new Date(ab.date).getUTCDay() + 6) % 7;
      map.set(wd, ab);
    }
    return map;
  }, [absences, weekStart]);

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

  const dayDots = useMemo(() => {
    const out: string[][] = [];
    for (let wd = 0; wd < 7; wd++) {
      const iso = formatIsoDateLocal(addDays(weekStart, wd));
      const dots: string[] = [];
      if (schedulesByWeekday.get(wd)?.length) dots.push("bg-sky-500");
      if (assignmentsByWeekday.get(wd)?.length) dots.push("bg-primary");
      if (vertretungenByDate.get(iso)?.length) dots.push("bg-amber-500");
      if (absencesByWeekday.get(wd)) dots.push("bg-red-500");
      out.push(dots);
    }
    return out;
  }, [
    weekStart,
    schedulesByWeekday,
    assignmentsByWeekday,
    vertretungenByDate,
    absencesByWeekday,
  ]);

  const selectedDate = addDays(weekStart, selectedWeekday);
  const selectedIso = formatIsoDateLocal(selectedDate);
  const daySchedules = schedulesByWeekday.get(selectedWeekday) ?? [];
  const dayAssignments = assignmentsByWeekday.get(selectedWeekday) ?? [];
  const dayAbsence = absencesByWeekday.get(selectedWeekday) ?? null;
  const dayVertretungen = vertretungenByDate.get(selectedIso) ?? [];
  const dayEinsaetze = workEventsByDate.get(selectedIso) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevWeek}
          aria-label="Vorherige Woche"
        >
          <ChevronLeft />
        </Button>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-sm font-medium">
            {germanWeekRangeLabel(weekStart)}
          </span>
          <button
            type="button"
            onClick={onToday}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Heute
          </button>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextWeek}
          aria-label="Nächste Woche"
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_SHORT_DE.map((label, wd) => {
          const d = addDays(weekStart, wd);
          const iso = formatIsoDateLocal(d);
          const isSelected = wd === selectedWeekday;
          const isToday = iso === todayIso;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedWeekday(wd)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center gap-1 rounded-lg border py-1.5 text-xs transition-colors",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-accent",
                isToday && !isSelected && "text-primary",
              )}
            >
              <span className="uppercase text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">
                {d.getDate().toString().padStart(2, "0")}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {dayDots[wd].map((c, i) => (
                  <span
                    key={i}
                    className={cn("size-1.5 rounded-full", c)}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-sm font-semibold">
        {DAY_LABELS_DE[selectedWeekday]},{" "}
        {selectedDate.getDate().toString().padStart(2, "0")}.
        {(selectedDate.getMonth() + 1).toString().padStart(2, "0")}.
      </div>

      {/* Whole-day items: assignments, substitutions, sick days. */}
      <section className="rounded-lg border p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ganztägig
        </h4>
        <DayQuickAddSection
          weekday={selectedWeekday}
          date={selectedDate}
          childId={childId}
          assignments={dayAssignments}
          absence={dayAbsence}
          vertretungen={dayVertretungen}
          daySchedules={daySchedules}
          schoolAssistantOptions={schoolAssistantOptions}
          onChanged={onChanged}
        />
      </section>

      {/* Stundenplan + Einsatz coverage cross-check. */}
      <section className="rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stundenplan
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScheduleSheet({ mode: "create" })}
          >
            <Plus /> Hinzufügen
          </Button>
        </div>
        {daySchedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Kein Stundenplan für diesen Tag.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {daySchedules.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    setScheduleSheet({ mode: "edit", schedule: s })
                  }
                  className="w-full rounded-md border border-sky-500/40 bg-sky-500/5 p-2 text-left transition-colors active:bg-sky-500/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="size-4 text-sky-600" />
                      <span className="tabular-nums">
                        {s.startTime}–{s.endTime}
                      </span>
                    </span>
                    <Pencil className="size-4 text-muted-foreground" />
                  </div>
                  {dayEinsaetze.length > 0 ? (
                    <div className="mt-1.5 flex flex-col gap-1 border-t border-sky-500/20 pt-1.5">
                      {dayEinsaetze.map((e) => {
                        const exceeds = einsatzExceeds(
                          e,
                          parseTime(s.startTime),
                          parseTime(s.endTime),
                        );
                        return (
                          <div
                            key={e.id}
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              exceeds && "text-red-600 dark:text-red-400",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                exceeds ? "bg-red-500" : "bg-sky-500",
                              )}
                            />
                            <span className="font-medium">{e.userName}</span>
                            <span className="tabular-nums">
                              {e.startTime}–{e.endTime}
                            </span>
                            {exceeds ? (
                              <span className="ml-auto font-medium">
                                außerhalb
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Logged Einsätze with no matching Stundenplan — surfaced so coverage
          gaps are visible (the desktop grid only shows these attached to a
          schedule block). */}
      {daySchedules.length === 0 && dayEinsaetze.length > 0 ? (
        <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
            Einsätze ohne Stundenplan
          </h4>
          <ul className="flex flex-col gap-1">
            {dayEinsaetze.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-1.5 text-xs"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-red-500" />
                <span className="font-medium">{e.userName}</span>
                <span className="tabular-nums">
                  {e.startTime}–{e.endTime}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {scheduleSheet ? (
        <ScheduleFormSheet
          open
          onOpenChange={(o) => {
            if (!o) setScheduleSheet(null);
          }}
          childId={childId}
          weekday={selectedWeekday}
          dayLabel={DAY_LABELS_DE[selectedWeekday]}
          schedule={
            scheduleSheet.mode === "edit" ? scheduleSheet.schedule : null
          }
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}

function ScheduleFormSheet({
  open,
  onOpenChange,
  childId,
  weekday,
  dayLabel,
  schedule,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  weekday: number;
  dayLabel: string;
  schedule: SerializedSchedule | null;
  onChanged: () => void;
}) {
  const isEdit = schedule != null;
  const [start, setStart] = useState(schedule?.startTime ?? "08:00");
  const [end, setEnd] = useState(schedule?.endTime ?? "13:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      if (schedule) {
        await updateScheduleAction(schedule.id, {
          weekday,
          startTime: start,
          endTime: end,
        });
        toast.success("Stundenplan aktualisiert.");
      } else {
        await createScheduleAction({
          childId,
          weekday,
          startTime: start,
          endTime: end,
        });
        toast.success("Stundenplan gespeichert.");
      }
      onChanged();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!schedule) return;
    setError(null);
    setBusy(true);
    try {
      await deleteScheduleAction(schedule.id);
      toast.success("Stundenplan gelöscht.");
      onChanged();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Stundenplan bearbeiten" : "Neuer Stundenplan"}
      description={dayLabel}
      footer={
        <>
          {isEdit ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={busy}
              className="mr-auto"
            >
              <Trash2 /> Löschen
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={busy}
          >
            {busy ? "Speichert…" : isEdit ? "Speichern" : "Anlegen"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TimeRangeFields
          start={start}
          end={end}
          onStartChange={setStart}
          onEndChange={setEnd}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </MobileSheet>
  );
}
