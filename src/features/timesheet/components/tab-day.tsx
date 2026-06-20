"use client";

import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { Clock, Lock, Plus, Stethoscope, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  formatDateLong,
  formatDuration,
  isSameUtcDay,
  relativeLabel,
  timeToMinutes,
} from "@/lib/dates";
import { WeekStrip } from "./week-strip";
import { deleteEventAction } from "../actions";
import { cancelChildSickAction } from "@/features/children/actions";
import type { Event, Schedule } from "@/generated/prisma";
import type { ChildOption } from "./children-filter";
import type { ChildAbsenceItem, VertretungDay } from "./timesheet-shell";
import { childIdsForDate } from "../weekday";
import type { AssignmentsByWeekday } from "../weekday";

type EventWithChild = Event & {
  child: { firstName: string; lastName: string } | null;
};

type Props = {
  currentUserId: string;
  selectedDate: Date;
  today: Date;
  onSelectDate: (d: Date) => void;
  onRequestNewEntry: () => void;
  events: EventWithChild[];
  lockedMonths: Set<string>;
  assignedChildren: ChildOption[];
  childAbsences: ChildAbsenceItem[];
  schedules: Schedule[];
  assignmentsByWeekday: AssignmentsByWeekday;
  substituteOn?: VertretungDay[];
};

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function TabDay({
  currentUserId,
  selectedDate,
  today,
  onSelectDate,
  onRequestNewEntry,
  events,
  lockedMonths,
  assignedChildren,
  childAbsences,
  schedules,
  assignmentsByWeekday,
  substituteOn = [],
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const dayEvents = useMemo(
    () => events.filter((e) => isSameUtcDay(e.date, selectedDate)),
    [events, selectedDate],
  );

  const selectedDateIso = useMemo(() => {
    const y = selectedDate.getUTCFullYear();
    const m = String(selectedDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const childById = useMemo(
    () => new Map(assignedChildren.map((c) => [c.id, c])),
    [assignedChildren],
  );

  const dayAbsences = useMemo(() => {
    return childAbsences
      .filter((a) => a.date === selectedDateIso)
      .map((a) => ({ ...a, child: childById.get(a.childId) }))
      .filter((a): a is ChildAbsenceItem & { child: ChildOption } => !!a.child);
  }, [childAbsences, selectedDateIso, childById]);

  const daySchedules = useMemo(() => {
    const weekday = (selectedDate.getUTCDay() + 6) % 7;
    const assignedToday = new Set(
      childIdsForDate(assignmentsByWeekday, selectedDate),
    );
    const todaySubstituteChildIds = new Set(
      substituteOn
        .filter((v) => v.date === selectedDateIso)
        .map((v) => v.childId),
    );
    return schedules
      .filter((s) => {
        if (s.weekday !== weekday) return false;
        // Only show a child's Stundenplan on days this user actually covers
        // them — through a regular weekday assignment or by stepping in as
        // today's substitute. Without this gate every assigned child would
        // appear on every weekday, regardless of who is on duty.
        return (
          assignedToday.has(s.childId) || todaySubstituteChildIds.has(s.childId)
        );
      })
      .map((s) => ({ ...s, child: childById.get(s.childId) }))
      .filter((s): s is Schedule & { child: ChildOption } => !!s.child)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [
    schedules,
    selectedDate,
    selectedDateIso,
    childById,
    assignmentsByWeekday,
    substituteOn,
  ]);

  const dayVertretungenGrouped = useMemo(() => {
    const blocks = substituteOn.filter((v) => v.date === selectedDateIso);
    const map = new Map<
      string,
      {
        childId: string;
        childName: string;
        timeBlocks: { startTime: string; endTime: string }[];
      }
    >();
    for (const v of blocks) {
      if (!map.has(v.childId)) {
        map.set(v.childId, {
          childId: v.childId,
          childName: v.childName,
          timeBlocks: [],
        });
      }
      map
        .get(v.childId)!
        .timeBlocks.push({ startTime: v.startTime, endTime: v.endTime });
    }
    for (const entry of map.values()) {
      entry.timeBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return Array.from(map.values());
  }, [substituteOn, selectedDateIso]);

  const sickEvent = dayEvents.find((e) => e.type === "SICK");
  const workEvents = dayEvents.filter(
    (e) => e.type === "WORK" || e.type === "INDIRECT",
  );
  const monthKey = `${selectedDate.getUTCFullYear()}-${
    selectedDate.getUTCMonth() + 1
  }`;
  const locked = lockedMonths.has(monthKey);

  const totalMinutes = workEvents.reduce(
    (sum, e) =>
      sum +
      (e.startTime && e.endTime
        ? timeToMinutes(e.endTime) - timeToMinutes(e.startTime)
        : 0),
    0,
  );
  const totalDuration =
    totalMinutes > 0
      ? `${Math.floor(totalMinutes / 60)}h${
          totalMinutes % 60 ? ` ${totalMinutes % 60}m` : ""
        }`
      : null;

  const canDelete = (ev: EventWithChild) =>
    !locked && Date.now() - ev.createdAt.getTime() <= EDIT_WINDOW_MS;

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteEventAction(id);
      toast.success("Eintrag gelöscht.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        today={today}
        events={events}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatDateLong(selectedDate)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {relativeLabel(selectedDate, today)}
            {locked && (
              <>
                {" · "}
                <Lock className="inline size-3.5" /> gesperrt
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-right">
          {totalDuration && (
            <Badge
              variant="secondary"
              className="font-mono tabular-nums"
            >
              {totalDuration}
            </Badge>
          )}
        </div>
      </div>

      {dayAbsences.length > 0 && (
        <Card className="border-rose-200 bg-rose-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center size-10 shrink-0 rounded-full bg-rose-500/15 text-rose-700">
              <Stethoscope className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-rose-900">
                {dayAbsences.length === 1
                  ? `${dayAbsences[0].child.firstName} ${dayAbsences[0].child.lastName} ist krank gemeldet`
                  : `${dayAbsences.length} zugewiesene Kinder sind krank gemeldet`}
              </p>
              {dayAbsences.map((a) => {
                const canCancel =
                  a.createdByUserId === currentUserId &&
                  isSameUtcDay(today, new Date());
                return (
                  <div
                    key={a.childId}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-rose-900/80">
                      {dayAbsences.length > 1 &&
                        `${a.child.firstName} ${a.child.lastName}`}
                      {a.note
                        ? `${dayAbsences.length > 1 ? " — " : ""}${a.note}`
                        : ""}
                    </span>
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-rose-700 hover:text-rose-900 hover:bg-rose-500/10"
                        disabled={busyId === a.id}
                        onClick={async () => {
                          setBusyId(a.id);
                          try {
                            await cancelChildSickAction(a.id);
                            toast.success("Krankmeldung zurückgenommen.");
                          } catch (e: unknown) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Rücknahme fehlgeschlagen.",
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Zurücknehmen
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {daySchedules.length > 0 && (
        <Card className="border-muted bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center size-10 shrink-0 rounded-full bg-muted text-muted-foreground">
              <Clock className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold">Stundenplan der Kinder</p>
              <ul className="text-sm text-muted-foreground">
                {daySchedules.map((s) => (
                  <li
                    key={s.id}
                    className="flex justify-between gap-3 tabular-nums"
                  >
                    <span>
                      {s.child.firstName} {s.child.lastName}
                    </span>
                    <span>
                      {s.startTime}–{s.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {dayVertretungenGrouped.map((g) => (
        <Card
          key={g.childId}
          className="border-amber-200 bg-amber-500/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="grid place-items-center size-10 shrink-0 rounded-full bg-amber-500/15 text-amber-700">
              <UserCheck className="size-5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="font-semibold text-amber-900">Vertretung</p>
              <p className="text-sm text-amber-900/80">{g.childName}</p>
              <p className="font-mono text-xs text-amber-700">
                {g.timeBlocks
                  .map((b) => `${b.startTime}–${b.endTime}`)
                  .join(", ")}
              </p>
            </div>
          </div>
        </Card>
      ))}

      {sickEvent && (
        <Card className="border-rose-200 bg-rose-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-10 rounded-full bg-rose-500/20 text-rose-700">
              <Stethoscope className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Krank · ganztägig</p>
              {sickEvent.note && (
                <p className="text-sm text-rose-900/80">{sickEvent.note}</p>
              )}
            </div>
            {canDelete(sickEvent) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(sickEvent.id)}
                disabled={busyId === sickEvent.id}
              >
                Löschen
              </Button>
            )}
          </div>
        </Card>
      )}

      {workEvents.length > 0 && (
        <div className="space-y-2">
          {workEvents.map((ev) => {
            const child = ev.child;
            const dur =
              ev.startTime && ev.endTime
                ? formatDuration(ev.startTime, ev.endTime)
                : "";
            const childName = child
              ? `${child.firstName} ${child.lastName}`
              : null;
            const title = match(ev.type)
              .with("INDIRECT", () =>
                childName ? `Indirekt — ${childName}` : "Indirekte Leistung",
              )
              .otherwise(() => childName ?? "Arbeit");
            return (
              <Card
                key={ev.id}
                className="p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className="font-mono"
                      >
                        {dur}
                      </Badge>
                      {ev.signatureKey ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 text-emerald-700"
                        >
                          Signiert
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 text-amber-700"
                        >
                          Bestätigung ausstehend
                        </Badge>
                      )}
                      {ev.signatureKey &&
                        assignedChildren.length > 1 &&
                        workEvents.filter(
                          (w) =>
                            w.signatureKey === ev.signatureKey &&
                            w.id !== ev.id,
                        ).length > 0 && (
                          <Badge variant="outline">Mehrere Kinder</Badge>
                        )}
                    </div>
                    {ev.note && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ev.note}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {ev.startTime}–{ev.endTime}
                  </span>
                  {canDelete(ev) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(ev.id)}
                      disabled={busyId === ev.id}
                    >
                      Löschen
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {dayEvents.length === 0 && (
        <Card className="flex flex-col items-center gap-3 border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">Keine Einträge</p>
          {!locked && (
            <Button onClick={onRequestNewEntry}>
              <Plus className="size-4" /> Eintrag hinzufügen
            </Button>
          )}
        </Card>
      )}

      {!locked && dayEvents.length > 0 && (
        <Button
          onClick={onRequestNewEntry}
          className="fixed bottom-24 right-4 size-14 rounded-full shadow-lg sm:bottom-6"
          aria-label="Neuer Eintrag"
        >
          <Plus className="size-6" />
        </Button>
      )}
      {!locked && dayEvents.length === 0 && (
        <Button
          onClick={onRequestNewEntry}
          className="fixed bottom-24 right-4 size-14 rounded-full shadow-lg sm:bottom-6"
          aria-label="Neuer Eintrag"
        >
          <Plus className="size-6" />
        </Button>
      )}
    </div>
  );
}
