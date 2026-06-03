"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Clock, Stethoscope, UserCheck } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  assignedChildren: ChildOption[];
  assignmentsByWeekday: AssignmentsByWeekday;
  currentUserName: string;
  schedules: Schedule[];
  /** Vertretung days for the current user — so substitute children appear in the form. */
  substituteOn?: VertretungDay[];
};

type ScheduleBlock = {
  id: string;
  childId: string;
  childFirstName: string;
  startTime: string;
  endTime: string;
};

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function NewEntrySheet({
  open,
  onOpenChange,
  defaultDate,
  assignedChildren,
  assignmentsByWeekday,
  currentUserName,
  schedules,
  substituteOn = [],
}: Props) {
  const [type, setType] = useState<EventType>(EventType.WORK);
  const [date, setDate] = useState(formatIsoDateUtc(defaultDate));
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
  const [sigOpen, setSigOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(formatIsoDateUtc(defaultDate));
      setType(EventType.WORK);
      setNote("");
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

  const toggleChild = (id: string) => {
    setChildIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const weekday = useMemo(() => weekdayIndex(parseIsoDate(date)), [date]);

  // The exact blocks that will be saved server-side: one entry per Stundenplan
  // block per selected child. Times are read-only — they come from the
  // Stundenplan, never from manual input (COD-48).
  const scheduleBlocks = useMemo<ScheduleBlock[]>(() => {
    return childIds.flatMap((childId) => {
      const child = dayAssignedChildren.find((c) => c.id === childId);
      return schedules
        .filter((s) => s.childId === childId && s.weekday === weekday)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
        .map((s) => ({
          id: s.id,
          childId,
          childFirstName: child?.firstName ?? "",
          startTime: s.startTime,
          endTime: s.endTime,
        }));
    });
  }, [childIds, schedules, weekday, dayAssignedChildren]);

  // First names of selected children that have no Stundenplan on this weekday;
  // an entry can't be derived for them, so submission is blocked.
  const missingScheduleNames = useMemo(() => {
    return childIds
      .filter(
        (id) =>
          !schedules.some((s) => s.childId === id && s.weekday === weekday),
      )
      .map(
        (id) => dayAssignedChildren.find((c) => c.id === id)?.firstName ?? "",
      )
      .filter(Boolean);
  }, [childIds, schedules, weekday, dayAssignedChildren]);

  const totalMinutes = useMemo(
    () =>
      scheduleBlocks.reduce(
        (sum, b) =>
          sum + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)),
        0,
      ),
    [scheduleBlocks],
  );

  const canProceed =
    type === EventType.SICK
      ? true
      : childIds.length >= 1 &&
        missingScheduleNames.length === 0 &&
        scheduleBlocks.length >= 1;

  const submitWithSignature = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      await createEventAction({
        type,
        date,
        childIds: type === EventType.WORK ? childIds : [],
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
      ? `${date} · ${scheduleBlocks.length} ${
          scheduleBlocks.length === 1 ? "Einsatz" : "Einsätze"
        }${totalMinutes > 0 ? ` · ${formatMinutes(totalMinutes)}` : ""}`
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

                {childIds.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Zeiten (aus Stundenplan)</Label>
                    {missingScheduleNames.length > 0 ? (
                      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Für {missingScheduleNames.join(", ")} ist an diesem Tag
                        kein Stundenplan hinterlegt. Ein Eintrag ist nur entlang
                        des Stundenplans möglich.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-2">
                          {scheduleBlocks.map((b) => (
                            <div
                              key={b.id}
                              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
                            >
                              <span className="flex items-center gap-2">
                                <Clock className="size-4 text-muted-foreground" />
                                {childIds.length > 1 && (
                                  <span className="text-muted-foreground">
                                    {b.childFirstName}
                                  </span>
                                )}
                                <span className="font-mono tabular-nums text-base">
                                  {b.startTime}–{b.endTime}
                                </span>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(b.startTime, b.endTime)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Die Zeiten kommen aus dem Stundenplan und sind nicht
                          veränderbar
                          {scheduleBlocks.length > 1
                            ? " — pro Block ein Eintrag."
                            : "."}
                        </p>
                      </>
                    )}
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
