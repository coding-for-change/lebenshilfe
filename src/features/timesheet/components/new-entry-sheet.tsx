"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Stethoscope, UserCheck } from "lucide-react";
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
import { submitVertretungRequestAction } from "@/features/vertretung-requests/actions";
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

/** UI entry mode. VERTRETUNG is a free-text substitution report (COD-51) and is
 * NOT an EventType — it becomes a pending VertretungRequest, not an Event. */
type EntryMode = "WORK" | "VERTRETUNG" | "SICK";

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

function TimeRangeInputs({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: {
  startTime: string;
  endTime: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
      <div className="space-y-1.5">
        <Label htmlFor="start">Start</Label>
        <Input
          id="start"
          type="time"
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
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
          onChange={(e) => onEndChange(e.target.value)}
          className="h-14 text-xl font-mono tabular-nums"
        />
      </div>
    </div>
  );
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
  const [mode, setMode] = useState<EntryMode>("WORK");
  const [date, setDate] = useState(formatIsoDateUtc(defaultDate));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [childNameText, setChildNameText] = useState("");

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
  const [sigOpen, setSigOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(formatIsoDateUtc(defaultDate));
      setMode("WORK");
      setStartTime("08:00");
      setEndTime("17:00");
      setNote("");
      setChildNameText("");
    }
  }, [open, defaultDate]);

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
    mode === "SICK"
      ? true
      : mode === "VERTRETUNG"
        ? childNameText.trim().length >= 2 && Boolean(duration)
        : childIds.length >= 1 && Boolean(duration);

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

  const submitWithSignature = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      if (mode === "VERTRETUNG") {
        await submitVertretungRequestAction({
          childNameText: childNameText.trim(),
          date,
          startTime,
          endTime,
          note: note.trim() || undefined,
          signaturePngBase64: pngBase64,
        });
        toast.success("Vertretung gemeldet — wird vom Team zugeordnet.");
      } else {
        await createEventAction({
          type: mode === "SICK" ? EventType.SICK : EventType.WORK,
          date,
          childIds: mode === "WORK" ? childIds : [],
          startTime: mode === "WORK" ? startTime : undefined,
          endTime: mode === "WORK" ? endTime : undefined,
          note: note.trim() || undefined,
          signaturePngBase64: pngBase64,
        });
        toast.success(
          mode === "WORK"
            ? `Eintrag gespeichert (${childIds.length} Kind${
                childIds.length === 1 ? "" : "er"
              })`
            : "Krankheit gespeichert",
        );
      }
      setSigOpen(false);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  const signerSubtitle =
    mode === "SICK"
      ? `${date} · Krank · ganztägig`
      : `${date} · ${startTime}–${endTime}${duration ? ` · ${duration}` : ""}`;

  const signerTitle =
    mode === "VERTRETUNG"
      ? "Vertretung bestätigen"
      : mode === "WORK"
        ? "Arbeitszeit bestätigen"
        : "Krankheit bestätigen";

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
              if (canProceed && !submitting) setSigOpen(true);
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

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={mode === "WORK" ? "default" : "outline"}
                onClick={() => setMode("WORK")}
                className="h-12 flex-col gap-1 text-xs"
              >
                <Briefcase className="size-4" /> Arbeit
              </Button>
              <Button
                type="button"
                variant={mode === "VERTRETUNG" ? "default" : "outline"}
                onClick={() => setMode("VERTRETUNG")}
                className={cn(
                  "h-12 flex-col gap-1 text-xs",
                  mode === "VERTRETUNG" &&
                    "bg-amber-500 hover:bg-amber-600 text-white",
                )}
              >
                <UserCheck className="size-4" /> Vertretung
              </Button>
              <Button
                type="button"
                variant={mode === "SICK" ? "default" : "outline"}
                onClick={() => setMode("SICK")}
                className={cn(
                  "h-12 flex-col gap-1 text-xs",
                  mode === "SICK" &&
                    "bg-rose-600 hover:bg-rose-700 text-white",
                )}
              >
                <Stethoscope className="size-4" /> Krank
              </Button>
            </div>

            {mode === "WORK" && (
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

                <TimeRangeInputs
                  startTime={startTime}
                  endTime={endTime}
                  onStartChange={setStartTime}
                  onEndChange={setEndTime}
                />

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

            {mode === "VERTRETUNG" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="childName">Name des Kindes</Label>
                  <Input
                    id="childName"
                    value={childNameText}
                    onChange={(e) => setChildNameText(e.target.value)}
                    placeholder="Vor- und Nachname"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bitte den Namen frei eintippen. Die genaue Zuordnung
                    übernimmt das Team.
                  </p>
                </div>

                <TimeRangeInputs
                  startTime={startTime}
                  endTime={endTime}
                  onStartChange={setStartTime}
                  onEndChange={setEndTime}
                />

                <p className="text-sm text-muted-foreground">
                  {duration
                    ? `Dauer: ${duration}`
                    : "Ende muss nach Start liegen"}
                </p>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  mode === "SICK"
                    ? "z.B. Arzttermin"
                    : "z.B. besondere Vorkommnisse"
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
                disabled={!canProceed}
              >
                Speichern & signieren
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <SignaturePadDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        title={signerTitle}
        subtitle={signerSubtitle}
        signerLabel={`${currentUserName} (Mitarbeiter)`}
        onConfirm={submitWithSignature}
        submitting={submitting}
      />
    </>
  );
}
