"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { match } from "ts-pattern";
import {
  ArrowRight,
  Baby,
  Briefcase,
  FileText,
  Info,
  Stethoscope,
  User,
  UserPlus,
} from "lucide-react";
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
import { EventType, type Event, type Schedule } from "@/generated/prisma";
import { SignaturePadDialog } from "./signature-pad-dialog";
import {
  createEventAction,
  createIndirectEventByNameAction,
  createPoolWorkEventAction,
} from "../actions";
import { reportChildSickAction } from "@/features/children/actions";
import {
  createVertretungRequestAction,
  lookupVertretungPrefillAction,
} from "@/features/vertretung-requests/actions";
import {
  formatDuration,
  parseIsoDate,
  timeToMinutes,
  weekdayIndex,
} from "@/lib/dates";
import type { ChildOption } from "./children-filter";
import { childIdsForDate, type AssignmentsByWeekday } from "../weekday";
import { quarterHourHint } from "../quarter-hour";
import { cn, formatIsoDateUtc } from "@/lib/utils";
import type { VertretungDay } from "./timesheet-shell";

type EventLike = Pick<
  Event,
  "id" | "type" | "date" | "childId" | "startTime" | "endTime"
>;
type WorkVariant = "OWN" | "VERTRETUNG" | "INDIRECT";

function isWeekend(iso: string) {
  const d = parseIsoDate(iso);
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  assignedChildren: ChildOption[];
  assignmentsByWeekday: AssignmentsByWeekday;
  currentUserName: string;
  schedules: Schedule[];
  /** Vertretung days for the current user — listed in the Vertretung tab. */
  substituteOn?: VertretungDay[];
  /** Existing events — used to hide Vertretungen that already have an Eintrag. */
  events?: EventLike[];
  /** Pool SB: only Direkt work + own sick, no child selection. */
  inPool?: boolean;
};

export function NewEntrySheet({
  open,
  onOpenChange,
  defaultDate,
  assignedChildren,
  assignmentsByWeekday,
  currentUserName,
  schedules,
  substituteOn = [],
  events = [],
  inPool = false,
}: Props) {
  const [type, setType] = useState<EventType>(EventType.WORK);
  const [workVariant, setWorkVariant] = useState<WorkVariant>("OWN");
  const [sickTarget, setSickTarget] = useState<"self" | "child" | null>(null);
  const [sickChildId, setSickChildId] = useState<string | null>(null);
  const [date, setDate] = useState(formatIsoDateUtc(defaultDate));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [vertretungChildName, setVertretungChildName] = useState("");
  const [indirectChildName, setIndirectChildName] = useState("");
  const [vertretungQuarter, setVertretungQuarter] = useState<{
    before: boolean;
    after: boolean;
  } | null>(null);
  // Guards the debounce lookup from overwriting a quick-pick's exact block times.
  const pickedTimesRef = useRef(false);

  // Child IDs that already have a work Event for this date — used to hide
  // Vertretungen the SB has already submitted an Eintrag for. Filtering by
  // childId is correct because one Event represents one Vertretung (regardless
  // of how many time blocks the ChildVertretung was split into).
  const usedChildIdsForDate = useMemo(() => {
    const out = new Set<string>();
    for (const e of events) {
      if (e.type !== "WORK" || !e.childId) continue;
      if (formatIsoDateUtc(e.date) === date) out.add(e.childId);
    }
    return out;
  }, [events, date]);

  // Regular weekday-based assignments (Vertretungen live on the Vertretung tab now)
  const dayAssignedChildren = useMemo(() => {
    const regularIds = new Set(
      childIdsForDate(assignmentsByWeekday, parseIsoDate(date)),
    );
    if (regularIds.size === 0) return [] as ChildOption[];
    return assignedChildren.filter((c) => regularIds.has(c.id));
  }, [date, assignmentsByWeekday, assignedChildren]);

  // Vertretungen for the day, grouped by child, excluding ones already used
  const availableVertretungen = useMemo(() => {
    const blocks = substituteOn.filter(
      (v) => v.date === date && !usedChildIdsForDate.has(v.childId),
    );
    const map = new Map<
      string,
      {
        childId: string;
        childName: string;
        vorviertelstunde: boolean;
        nachviertelstunde: boolean;
        timeBlocks: { startTime: string; endTime: string }[];
      }
    >();
    for (const v of blocks) {
      if (!map.has(v.childId)) {
        map.set(v.childId, {
          childId: v.childId,
          childName: v.childName,
          vorviertelstunde: v.vorviertelstunde,
          nachviertelstunde: v.nachviertelstunde,
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
  }, [substituteOn, date, usedChildIdsForDate]);

  const [childIds, setChildIds] = useState<string[]>(
    dayAssignedChildren.length === 1 ? [dayAssignedChildren[0].id] : [],
  );
  const [sigOpen, setSigOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(formatIsoDateUtc(defaultDate));
      setType(EventType.WORK);
      setWorkVariant("OWN");
      setSickTarget(null);
      setSickChildId(null);
      setNote("");
      setVertretungChildName("");
      setIndirectChildName("");
      setVertretungQuarter(null);
      pickedTimesRef.current = false;
    }
    // Start/End are owned by the Stundenplan effect below, not reset here.
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

  const dateIsWeekend = isWeekend(date);

  const canProceed = useMemo(() => {
    if (type === EventType.SICK) {
      // A child sick report submits via its own button, not the form.
      if (sickTarget === "child") return false;
      return sickTarget === "self";
    }
    if (workVariant === "VERTRETUNG") {
      return vertretungChildName.trim().length >= 2 && Boolean(duration);
    }
    if (workVariant === "OWN") {
      if (dateIsWeekend) return false;
      if (inPool) return Boolean(duration);
      return childIds.length >= 1 && Boolean(duration);
    }
    // INDIRECT
    return (
      indirectChildName.trim().length >= 2 &&
      note.trim().length >= 3 &&
      Boolean(duration)
    );
  }, [
    type,
    sickTarget,
    workVariant,
    vertretungChildName,
    dateIsWeekend,
    childIds.length,
    duration,
    indirectChildName,
    note,
    inPool,
  ]);

  const toggleChild = (id: string) => {
    setChildIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const childFlags = useMemo(
    () =>
      new Map(
        assignedChildren.map((c) => [
          c.id,
          { before: c.vorviertelstunde, after: c.nachviertelstunde },
        ]),
      ),
    [assignedChildren],
  );

  // Prefill a single schedule block: the first (by start) for which no entry
  // exists yet. So a split day (e.g. 08:00–11:00 + 13:00–18:00) prefills the
  // morning block first, then the afternoon block once the morning is entered.
  // ±15 mirrors the export — before only when the block is the child's earliest
  // of the day, after only when it is the latest.
  const dayScheduleTimes = useMemo<{
    start: string;
    end: string;
    before: boolean;
    after: boolean;
  } | null>(() => {
    const wd = weekdayIndex(parseIsoDate(date));
    const relevantChildIds =
      childIds.length > 0 ? childIds : dayAssignedChildren.map((c) => c.id);
    const daySchedules = schedules
      .filter((s) => s.weekday === wd && relevantChildIds.includes(s.childId))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    if (daySchedules.length === 0) return null;

    const dayWorkEvents = events.filter(
      (e) =>
        e.type === "WORK" &&
        e.childId &&
        e.startTime &&
        e.endTime &&
        formatIsoDateUtc(e.date) === date,
    );
    const isCovered = (s: Schedule) =>
      dayWorkEvents.some(
        (e) =>
          e.childId === s.childId &&
          timeToMinutes(e.startTime!) < timeToMinutes(s.endTime) &&
          timeToMinutes(s.startTime) < timeToMinutes(e.endTime!),
      );

    const chosen = daySchedules.find((s) => !isCovered(s)) ?? daySchedules[0];

    // Per child, the earliest start / latest end across the day (the export
    // widens only those boundaries, once per day).
    const childDay = daySchedules.filter((s) => s.childId === chosen.childId);
    const minStart = childDay.reduce(
      (m, s) =>
        timeToMinutes(s.startTime) < timeToMinutes(m) ? s.startTime : m,
      childDay[0].startTime,
    );
    const maxEnd = childDay.reduce(
      (m, s) => (timeToMinutes(s.endTime) > timeToMinutes(m) ? s.endTime : m),
      childDay[0].endTime,
    );
    const flags = childFlags.get(chosen.childId);
    return {
      start: chosen.startTime,
      end: chosen.endTime,
      before: (flags?.before ?? false) && chosen.startTime === minStart,
      after: (flags?.after ?? false) && chosen.endTime === maxEnd,
    };
  }, [date, schedules, dayAssignedChildren, childIds, childFlags, events]);

  // Display-only billed span for the time inputs — the saved Start/End stay raw.
  const quarterHint = useMemo(() => {
    const flags = match(workVariant)
      .with("OWN", () =>
        dayScheduleTimes
          ? { before: dayScheduleTimes.before, after: dayScheduleTimes.after }
          : null,
      )
      .with("VERTRETUNG", () => vertretungQuarter)
      .otherwise(() => null);
    if (!flags || !startTime || !endTime) return null;
    const hint = quarterHourHint(flags.before, flags.after, startTime, endTime);
    return hint && { ...flags, ...hint };
  }, [workVariant, dayScheduleTimes, vertretungQuarter, startTime, endTime]);

  // Seed raw Start/End from the Stundenplan. Depends on `open` so reopening the
  // same day re-applies the schedule instead of keeping the previous fallback.
  useEffect(() => {
    if (!open) return;
    if (type !== EventType.WORK || workVariant !== "OWN") return;
    if (dayScheduleTimes) {
      setStartTime(dayScheduleTimes.start);
      setEndTime(dayScheduleTimes.end);
    } else {
      setStartTime("08:00");
      setEndTime("17:00");
    }
  }, [open, type, workVariant, dayScheduleTimes]);

  // Free-text Vertretung: debounce-look up the typed name and prefill its
  // Stundenplan times + ±15 hint on an exact match.
  useEffect(() => {
    if (!open || type !== EventType.WORK || workVariant !== "VERTRETUNG")
      return;
    const name = vertretungChildName.trim();
    if (name.length < 2) {
      setVertretungQuarter(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await lookupVertretungPrefillAction({ name, date });
        if (cancelled) return;
        if (!res.matched) {
          setVertretungQuarter(null);
          return;
        }
        setVertretungQuarter({
          before: res.vorviertelstunde,
          after: res.nachviertelstunde,
        });
        if (res.startTime && res.endTime && !pickedTimesRef.current) {
          setStartTime(res.startTime);
          setEndTime(res.endTime);
        }
      } catch {
        // Lookup is a best-effort convenience — ignore failures silently.
      } finally {
        if (!cancelled) pickedTimesRef.current = false;
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, type, workVariant, vertretungChildName, date]);

  const submitWithSignature = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      if (type === EventType.WORK && workVariant === "VERTRETUNG") {
        await createVertretungRequestAction({
          childNameText: vertretungChildName.trim(),
          date,
          startTime,
          endTime,
          signaturePngBase64: pngBase64,
        });
        toast.success("Vertretungs-Antrag eingereicht.");
      } else if (type === EventType.SICK) {
        await createEventAction({
          type: EventType.SICK,
          date,
          childIds: [],
          note: note.trim() || undefined,
          signaturePngBase64: pngBase64,
        });
        toast.success("Krankheit gespeichert");
      } else if (workVariant === "OWN" && inPool) {
        await createPoolWorkEventAction({
          date,
          startTime,
          endTime,
          note: note.trim() || undefined,
          signaturePngBase64: pngBase64,
        });
        toast.success("Eintrag gespeichert");
      } else if (workVariant === "OWN") {
        await createEventAction({
          type: EventType.WORK,
          date,
          childIds,
          startTime,
          endTime,
          note: note.trim() || undefined,
          signaturePngBase64: pngBase64,
        });
        toast.success(
          `Eintrag gespeichert (${childIds.length} Kind${
            childIds.length === 1 ? "" : "er"
          })`,
        );
      } else {
        const result = await createIndirectEventByNameAction({
          childNameText: indirectChildName.trim(),
          date,
          startTime,
          endTime,
          note: note.trim(),
          signaturePngBase64: pngBase64,
        });
        if (result.status === "QUEUED") {
          toast.success(
            "Indirekte Leistung gespeichert — wird vom Admin dem Kind zugeordnet.",
          );
        } else {
          toast.success("Indirekte Leistung gespeichert");
        }
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
    type === EventType.WORK && workVariant === "VERTRETUNG"
      ? `${date} · Vertretung · ${startTime}–${endTime}${
          duration ? ` · ${duration}` : ""
        }`
      : type === EventType.SICK
        ? `${date} · Krank · ganztägig`
        : `${date} · ${startTime}–${endTime}${duration ? ` · ${duration}` : ""}`;

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
                onClick={() => {
                  setType(EventType.WORK);
                  setSickTarget(null);
                  setSickChildId(null);
                }}
                className="h-12"
              >
                <Briefcase className="size-4" /> Arbeit
              </Button>
              <Button
                type="button"
                variant={type === EventType.SICK ? "default" : "outline"}
                onClick={() => {
                  setType(EventType.SICK);
                  setSickTarget(null);
                  setSickChildId(null);
                }}
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
              <>
                {sickTarget === null && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Wer ist krank?</p>
                    <div className="grid gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 justify-start gap-3"
                        onClick={() => setSickTarget("self")}
                      >
                        <div className="grid place-items-center size-8 rounded-full bg-rose-500/10 text-rose-600">
                          <User className="size-4" />
                        </div>
                        <span>Ich (eigene Krankmeldung)</span>
                      </Button>
                      {dayAssignedChildren.map((c) => (
                        <Button
                          key={c.id}
                          type="button"
                          variant="outline"
                          className="h-12 justify-start gap-3"
                          onClick={() => {
                            setSickTarget("child");
                            setSickChildId(c.id);
                          }}
                        >
                          <div className="grid place-items-center size-8 rounded-full bg-amber-500/10 text-amber-600">
                            <Baby className="size-4" />
                          </div>
                          <span>
                            {c.firstName} {c.lastName}
                          </span>
                        </Button>
                      ))}
                      {dayAssignedChildren.length === 0 && (
                        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                          An diesem Tag ist dir kein Kind zugewiesen.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {sickTarget === "child" &&
                  sickChildId &&
                  (() => {
                    const child = dayAssignedChildren.find(
                      (c) => c.id === sickChildId,
                    );
                    if (!child) return null;
                    return (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-amber-200 bg-amber-500/5 px-3 py-2.5">
                          <p className="text-sm font-medium">
                            Kind krank melden
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {child.firstName} {child.lastName} · {date}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="child-sick-note">
                            Notiz (optional)
                          </Label>
                          <Textarea
                            id="child-sick-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="z.B. Eltern haben angerufen"
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setSickTarget(null);
                              setSickChildId(null);
                              setNote("");
                            }}
                          >
                            Zurück
                          </Button>
                          <Button
                            type="button"
                            disabled={submitting}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                            onClick={async () => {
                              setSubmitting(true);
                              try {
                                await reportChildSickAction({
                                  childId: sickChildId,
                                  date,
                                  note: note.trim() || undefined,
                                });
                                toast.success(
                                  `${child.firstName} wurde krank gemeldet.`,
                                );
                                onOpenChange(false);
                              } catch (e: unknown) {
                                toast.error(
                                  e instanceof Error
                                    ? e.message
                                    : "Speichern fehlgeschlagen.",
                                );
                              } finally {
                                setSubmitting(false);
                              }
                            }}
                          >
                            Krank melden
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
              </>
            )}

            {type === EventType.WORK && (
              <>
                {!inPool && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      type="button"
                      variant={workVariant === "OWN" ? "default" : "outline"}
                      onClick={() => setWorkVariant("OWN")}
                      className="h-10 text-xs sm:text-sm"
                    >
                      <Briefcase className="size-3.5" /> Direkt
                    </Button>
                    <Button
                      type="button"
                      variant={
                        workVariant === "VERTRETUNG" ? "default" : "outline"
                      }
                      onClick={() => setWorkVariant("VERTRETUNG")}
                      className={cn(
                        "h-10 text-xs sm:text-sm",
                        workVariant === "VERTRETUNG" &&
                          "bg-amber-600 hover:bg-amber-700 text-white",
                      )}
                    >
                      <UserPlus className="size-3.5" /> Vertretung
                    </Button>
                    <Button
                      type="button"
                      variant={
                        workVariant === "INDIRECT" ? "default" : "outline"
                      }
                      onClick={() => setWorkVariant("INDIRECT")}
                      className="h-10 text-xs sm:text-sm"
                    >
                      <FileText className="size-3.5" /> Indirekt
                    </Button>
                  </div>
                )}

                {!inPool &&
                  workVariant === "OWN" &&
                  (dayAssignedChildren.length === 0 ? (
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
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Der Eintrag wird für jedes ausgewählte Kind separat
                        gespeichert — mit derselben Unterschrift.
                      </p>
                    </div>
                  ))}

                {workVariant === "VERTRETUNG" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="vertretung-child">Name des Kindes</Label>
                    <Input
                      id="vertretung-child"
                      value={vertretungChildName}
                      onChange={(e) => setVertretungChildName(e.target.value)}
                      placeholder="Vor- und Nachname"
                      autoComplete="off"
                    />
                  </div>
                )}

                {workVariant === "INDIRECT" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="indirect-child">Name des Kindes</Label>
                    <Input
                      id="indirect-child"
                      value={indirectChildName}
                      onChange={(e) => setIndirectChildName(e.target.value)}
                      placeholder="Vor- und Nachname"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Eine indirekte Leistung muss einem Kind zugeordnet werden.
                    </p>
                  </div>
                )}

                {workVariant === "OWN" && dateIsWeekend && (
                  <p className="rounded-lg border border-amber-400/50 bg-amber-50/50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    Diese Tätigkeit ist nur an Werktagen möglich. Für
                    Wochenend-Tätigkeiten bitte &bdquo;Indirekt&ldquo; wählen.
                  </p>
                )}

                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="start">
                      Start
                      {quarterHint?.before && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          (ohne ¼-Std.)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-14 text-xl font-mono tabular-nums"
                    />
                  </div>
                  {/* h-14 matches the input height so the arrow centres on the
                      inputs (not the label+input stack) regardless of label wrap. */}
                  <div
                    aria-hidden
                    className="flex h-14 items-center justify-center text-muted-foreground"
                  >
                    <ArrowRight className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="end">
                      Ende
                      {quarterHint?.after && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          (ohne ¼-Std.)
                        </span>
                      )}
                    </Label>
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

                {quarterHint && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {quarterHint.label} genehmigt · Abrechnung{" "}
                      <span className="font-medium tabular-nums">
                        {quarterHint.billed}
                      </span>
                      . Bitte die Zeit <strong>ohne</strong> ¼-Stunden
                      eintragen.
                    </span>
                  </p>
                )}

                {workVariant === "VERTRETUNG" && (
                  <>
                    {availableVertretungen.length > 0 && (
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {availableVertretungen.flatMap((v) =>
                          v.timeBlocks.map((b, i) => {
                            const active =
                              vertretungChildName === v.childName &&
                              startTime === b.startTime &&
                              endTime === b.endTime;
                            return (
                              <button
                                key={`${v.childId}-${i}`}
                                type="button"
                                onClick={() => {
                                  pickedTimesRef.current = true;
                                  setVertretungChildName(v.childName);
                                  setStartTime(b.startTime);
                                  setEndTime(b.endTime);
                                  setVertretungQuarter({
                                    before: v.vorviertelstunde,
                                    after: v.nachviertelstunde,
                                  });
                                }}
                                className={cn(
                                  "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                                  active
                                    ? "border-amber-400 bg-amber-400/10 text-foreground"
                                    : "border-border bg-muted/40 hover:bg-accent",
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Vertretung
                                  </span>
                                  <span className="font-medium">
                                    {v.childName}
                                  </span>
                                </div>
                                <span className="font-mono tabular-nums text-muted-foreground">
                                  {b.startTime}–{b.endTime}
                                </span>
                              </button>
                            );
                          }),
                        )}
                      </div>
                    )}

                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Bei exakter Übereinstimmung wird der Eintrag sofort
                      gespeichert — sonst leiten wir den Antrag an einen Admin
                      weiter.
                    </div>
                  </>
                )}
              </>
            )}

            {!(type === EventType.SICK && sickTarget !== "self") && (
              <>
                {!(type === EventType.WORK && workVariant === "VERTRETUNG") &&
                  (() => {
                    const indirect =
                      type === EventType.WORK && workVariant === "INDIRECT";
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="note">
                          {indirect ? "Notiz (Pflicht)" : "Notiz (optional)"}
                        </Label>
                        <Textarea
                          id="note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={
                            indirect
                              ? "z.B. Lehrergespräch, Workshop, Vorbereitung"
                              : type === EventType.SICK
                                ? "z.B. Arzttermin"
                                : "z.B. besondere Vorkommnisse"
                          }
                          rows={3}
                        />
                      </div>
                    );
                  })()}

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
              </>
            )}
          </form>
        </SheetContent>
      </Sheet>

      <SignaturePadDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        title={match({ type, workVariant })
          .with({ type: EventType.SICK }, () => "Krankheit bestätigen")
          .with(
            { type: EventType.WORK, workVariant: "VERTRETUNG" },
            () => "Vertretung bestätigen",
          )
          .with(
            { type: EventType.WORK, workVariant: "INDIRECT" },
            () => "Indirekte Leistung bestätigen",
          )
          .otherwise(() => "Arbeitszeit bestätigen")}
        subtitle={signerSubtitle}
        signerLabel={`${currentUserName} (Mitarbeiter)`}
        onConfirm={submitWithSignature}
        submitting={submitting}
      />
    </>
  );
}
