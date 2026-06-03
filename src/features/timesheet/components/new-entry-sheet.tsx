"use client";

import { useEffect, useMemo, useState } from "react";
import { Baby, Briefcase, Stethoscope, UserCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { EventType, type Schedule } from "@/generated/prisma";
import { SignaturePadDialog } from "./signature-pad-dialog";
import { createEventAction } from "../actions";
import { reportChildSickAction } from "@/features/children/actions";
import {
  formatDuration,
  parseIsoDate,
  timeToMinutes,
  weekdayIndex,
} from "@/lib/dates";
import type { ChildOption } from "./children-filter";
import { childIdsForDate, type AssignmentsByWeekday } from "../weekday";
import { cn, formatIsoDateUtc } from "@/lib/utils";
import type { VertretungDay } from "./timesheet-shell";

type LastEntry = {
  startTime: string | null;
  endTime: string | null;
};

type QuickSlot = {
  key: string;
  label: string;
  start: string;
  end: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  assignedChildren: ChildOption[];
  assignmentsByWeekday: AssignmentsByWeekday;
  currentUserName: string;
  schedules: Schedule[];
  lastEntry: LastEntry | null;
  /** Vertretung days for the current user — so substitute children appear in the form. */
  substituteOn?: VertretungDay[];
};

function addMinutes(time: string, minutes: number): string {
  const total = Math.max(
    0,
    Math.min(24 * 60 - 1, timeToMinutes(time) + minutes),
  );
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function NewEntrySheet({
  open,
  onOpenChange,
  defaultDate,
  assignedChildren,
  assignmentsByWeekday,
  currentUserName,
  schedules,
  lastEntry,
  substituteOn = [],
}: Props) {
  const [type, setType] = useState<EventType>(EventType.WORK);
  const [date, setDate] = useState(formatIsoDateUtc(defaultDate));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");

  // Vertretungen for the currently selected date
  const dayVertretungen = useMemo(
    () => substituteOn.filter((v) => v.date === date),
    [substituteOn, date],
  );

  const dayAssignedChildren = useMemo(() => {
    // Regular weekday-based assignments
    const regularIds = new Set(
      childIdsForDate(assignmentsByWeekday, parseIsoDate(date)),
    );
    // Date-specific Vertretung children
    for (const v of dayVertretungen) regularIds.add(v.childId);

    if (regularIds.size === 0) return [] as ChildOption[];
    return assignedChildren.filter((c) => regularIds.has(c.id));
  }, [date, assignmentsByWeekday, assignedChildren, dayVertretungen]);

  const [childIds, setChildIds] = useState<string[]>(
    dayAssignedChildren.length === 1 ? [dayAssignedChildren[0].id] : [],
  );
  // For type=SICK: who is sick — the Schulbegleiter ("self") or one assigned
  // child (the child's id). Self keeps the unchanged own-sick (signed) flow;
  // a child id triggers a ChildAbsence report.
  const [sickSubject, setSickSubject] = useState<"self" | string>("self");
  const [sigOpen, setSigOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(formatIsoDateUtc(defaultDate));
      setType(EventType.WORK);
      setSickSubject("self");
      setStartTime("08:00");
      setEndTime("17:00");
      setNote("");
    }
  }, [open, defaultDate]);

  // Drop a child selection that is no longer valid for the day (e.g. after a
  // date change) so the sick report can never target an unassigned child.
  useEffect(() => {
    setSickSubject((prev) =>
      prev === "self" || dayAssignedChildren.some((c) => c.id === prev)
        ? prev
        : "self",
    );
  }, [dayAssignedChildren]);

  // Whenever the day's assigned children change (open, date change, or
  // the underlying data updates), preselect the only one if applicable
  // and otherwise clear any selections that are no longer valid for the day.
  useEffect(() => {
    setChildIds((prev) => {
      const allowed = new Set(dayAssignedChildren.map((c) => c.id));
      const filtered = prev.filter((id) => allowed.has(id));
      if (filtered.length === 0 && dayAssignedChildren.length === 1) {
        return [dayAssignedChildren[0].id];
      }
      return filtered;
    });
  }, [dayAssignedChildren]);

  const duration = useMemo(() => {
    if (!startTime || !endTime) return null;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return null;
    return formatDuration(startTime, endTime);
  }, [startTime, endTime]);

  const canProceed =
    type === EventType.SICK ? true : childIds.length >= 1 && Boolean(duration);

  const toggleChild = (id: string) => {
    setChildIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const quickSlots = useMemo<QuickSlot[]>(() => {
    const out: QuickSlot[] = [];
    const seen = new Set<string>();
    const push = (slot: QuickSlot) => {
      const fp = `${slot.start}-${slot.end}`;
      if (seen.has(fp)) return;
      seen.add(fp);
      out.push(slot);
    };

    // Vertretung time slot(s) — shown first so the substitute can quickly confirm
    for (const v of dayVertretungen) {
      push({
        key: `vertretung-${v.childId}`,
        label: `Vertretung (${v.childName.split(" ")[0]})`,
        start: v.startTime,
        end: v.endTime,
      });
    }

    const wd = weekdayIndex(parseIsoDate(date));
    const relevantChildIds =
      childIds.length > 0 ? childIds : dayAssignedChildren.map((c) => c.id);
    const daySchedules = schedules.filter(
      (s) => s.weekday === wd && relevantChildIds.includes(s.childId),
    );
    if (daySchedules.length > 0) {
      const start = daySchedules.reduce((acc, s) =>
        timeToMinutes(s.startTime) < timeToMinutes(acc.startTime) ? s : acc,
      ).startTime;
      const end = daySchedules.reduce((acc, s) =>
        timeToMinutes(s.endTime) > timeToMinutes(acc.endTime) ? s : acc,
      ).endTime;
      push({
        key: "schedule",
        label: "Stundenplan",
        start,
        end,
      });
    }

    if (lastEntry?.startTime && lastEntry?.endTime) {
      push({
        key: "last",
        label: "Letzter Eintrag",
        start: lastEntry.startTime,
        end: lastEntry.endTime,
      });
      push({
        key: "last-plus-15",
        label: "Letzter +15m",
        start: lastEntry.startTime,
        end: addMinutes(lastEntry.endTime, 15),
      });
    }

    return out;
  }, [
    date,
    schedules,
    dayAssignedChildren,
    childIds,
    lastEntry,
    dayVertretungen,
  ]);

  // A child sick report writes a ChildAbsence directly — no signature required.
  const submitChildSick = async () => {
    if (sickSubject === "self") return;
    setSubmitting(true);
    try {
      await reportChildSickAction({
        childId: sickSubject,
        date,
        note: note.trim() || undefined,
      });
      const child = dayAssignedChildren.find((c) => c.id === sickSubject);
      toast.success(
        child ? `${child.firstName} krank gemeldet` : "Kind krank gemeldet",
      );
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitWithSignature = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      await createEventAction({
        type,
        date,
        childIds: type === EventType.WORK ? childIds : [],
        startTime: type === EventType.WORK ? startTime : undefined,
        endTime: type === EventType.WORK ? endTime : undefined,
        note: note.trim() || undefined,
        signaturePngBase64: pngBase64,
      });
      toast.success(
        type === EventType.WORK
          ? `Eintrag gespeichert (${childIds.length} Kind${
              childIds.length === 1 ? "" : "er"
            })`
          : "Krankheit gespeichert",
      );
      setSigOpen(false);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  const signerSubtitle =
    type === EventType.WORK
      ? `${date} · ${startTime}–${endTime}${duration ? ` · ${duration}` : ""}`
      : `${date} · Krank · ganztägig`;

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
      >
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-x-hidden overflow-y-auto rounded-t-2xl sm:inset-y-0 sm:my-auto sm:h-fit sm:mx-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Neuer Eintrag</SheetTitle>
            <SheetDescription>
              Ein Eintrag wird nach der Unterschrift gespeichert.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canProceed || submitting) return;
              // A child sick report saves immediately; everything else
              // (work entry, own sick) is confirmed with a signature.
              if (type === EventType.SICK && sickSubject !== "self") {
                void submitChildSick();
              } else {
                setSigOpen(true);
              }
            }}
            className="px-4 pb-6 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                max={formatIsoDateUtc(new Date())}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === EventType.WORK ? "default" : "outline"}
                onClick={() => setType(EventType.WORK)}
                className="h-12"
              >
                <Briefcase className="size-4" /> Arbeit
              </Button>
              <Button
                type="button"
                variant={type === EventType.SICK ? "default" : "outline"}
                onClick={() => setType(EventType.SICK)}
                className={cn(
                  "h-12",
                  type === EventType.SICK &&
                    "bg-rose-600 hover:bg-rose-700 text-white",
                )}
              >
                <Stethoscope className="size-4" /> Krank
              </Button>
            </div>

            {type === EventType.SICK && (
              <div className="space-y-1.5">
                <Label>Wer ist krank?</Label>
                <div className="grid grid-cols-1 gap-1.5">
                  <Button
                    type="button"
                    variant={sickSubject === "self" ? "default" : "outline"}
                    onClick={() => setSickSubject("self")}
                    className={cn(
                      "h-11 justify-start",
                      sickSubject === "self" &&
                        "bg-rose-600 hover:bg-rose-700 text-white",
                    )}
                  >
                    <Stethoscope className="size-4" /> Ich (eigene Krankmeldung)
                  </Button>
                  {dayAssignedChildren.map((c) => (
                    <Button
                      key={c.id}
                      type="button"
                      variant={sickSubject === c.id ? "default" : "outline"}
                      onClick={() => setSickSubject(c.id)}
                      className={cn(
                        "h-11 justify-start",
                        sickSubject === c.id &&
                          "bg-rose-600 hover:bg-rose-700 text-white",
                      )}
                    >
                      <Baby className="size-4" />
                      <span className="flex-1 text-left">
                        {c.firstName} {c.lastName}
                      </span>
                      {dayVertretungen.some((v) => v.childId === c.id) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          <UserCheck className="size-3" />
                          Vertretung
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
                {dayAssignedChildren.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    An diesem Tag ist dir kein Kind zugewiesen — nur deine eigene
                    Krankmeldung ist möglich.
                  </p>
                ) : sickSubject !== "self" ? (
                  <p className="text-xs text-muted-foreground">
                    Wird ohne Unterschrift gespeichert und ist für die
                    Verwaltung sichtbar.
                  </p>
                ) : null}
              </div>
            )}

            {type === EventType.WORK && (
              <>
                {dayAssignedChildren.length === 0 ? (
                  <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    An diesem Tag ist dir kein Kind zugewiesen.
                  </p>
                ) : dayAssignedChildren.length === 1 ? (
                  <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">Kind: </span>
                    <span>
                      {dayAssignedChildren[0].firstName}{" "}
                      {dayAssignedChildren[0].lastName}
                    </span>
                    {dayVertretungen.some(
                      (v) => v.childId === dayAssignedChildren[0].id,
                    ) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        <UserCheck className="size-3" />
                        Vertretung
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Kinder</Label>
                    <div className="space-y-1 rounded-lg border border-border p-2">
                      {dayAssignedChildren.map((c) => (
                        <label
                          key={c.id}
                          htmlFor={`child-${c.id}`}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <Checkbox
                            id={`child-${c.id}`}
                            checked={childIds.includes(c.id)}
                            onCheckedChange={() => toggleChild(c.id)}
                          />
                          <span className="flex-1">
                            {c.firstName} {c.lastName}
                          </span>
                          {dayVertretungen.some((v) => v.childId === c.id) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              <UserCheck className="size-3" />
                              Vertretung
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Der Eintrag wird für jedes ausgewählte Kind separat
                      gespeichert — mit derselben Unterschrift.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="start">Start</Label>
                    <Input
                      id="start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-14 text-xl font-mono tabular-nums"
                    />
                  </div>
                  <span className="pb-3 text-muted-foreground">→</span>
                  <div className="space-y-1.5">
                    <Label htmlFor="end">Ende</Label>
                    <Input
                      id="end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-14 text-xl font-mono tabular-nums"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {duration
                    ? `Dauer: ${duration}`
                    : "Ende muss nach Start liegen"}
                </p>

                {quickSlots.length > 0 && (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    {quickSlots.map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => {
                          setStartTime(slot.start);
                          setEndTime(slot.end);
                        }}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                          startTime === slot.start && endTime === slot.end
                            ? "border-amber-400 bg-amber-400/10 text-foreground"
                            : "border-border bg-muted/40 hover:bg-accent",
                        )}
                      >
                        <span className="font-medium">{slot.label}</span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {slot.start}–{slot.end}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  type === EventType.WORK
                    ? "z.B. besondere Vorkommnisse"
                    : "z.B. Arzttermin"
                }
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={!canProceed || submitting}
              >
                {type === EventType.SICK && sickSubject !== "self"
                  ? "Kind krank melden"
                  : "Speichern & signieren"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <SignaturePadDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        title={
          type === EventType.WORK
            ? "Arbeitszeit bestätigen"
            : "Krankheit bestätigen"
        }
        subtitle={signerSubtitle}
        signerLabel={`${currentUserName} (Mitarbeiter)`}
        onConfirm={submitWithSignature}
        submitting={submitting}
      />
    </>
  );
}
