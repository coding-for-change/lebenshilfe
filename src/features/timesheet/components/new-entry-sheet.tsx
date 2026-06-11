"use client";

import { useEffect, useMemo, useState } from "react";
import { match } from "ts-pattern";
import { Briefcase, FileText, Stethoscope, UserPlus } from "lucide-react";
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
  ChildSearchCombobox,
  type ChildOption as SearchChildOption,
} from "./child-search-combobox";
import { createEventAction } from "../actions";
import { createVertretungRequestAction } from "@/features/vertretung-requests/actions";
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

type EventLike = Pick<Event, "id" | "type" | "date" | "childId">;
type WorkVariant = "OWN" | "SUBSTITUTE" | "INDIRECT";

function isWeekend(iso: string) {
  const d = parseIsoDate(iso);
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

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
  /** Vertretung days for the current user — listed in the Vertretung tab. */
  substituteOn?: VertretungDay[];
  /** Existing events — used to hide Vertretungen that already have an Eintrag. */
  events?: EventLike[];
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
  events = [],
}: Props) {
  const [type, setType] = useState<EventType | "VERTRETUNG">(EventType.WORK);
  const [workVariant, setWorkVariant] = useState<WorkVariant>("OWN");
  const [date, setDate] = useState(formatIsoDateUtc(defaultDate));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [vertretungChildName, setVertretungChildName] = useState("");
  const [otherChild, setOtherChild] = useState<SearchChildOption | null>(null);

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
      setStartTime("08:00");
      setEndTime("17:00");
      setNote("");
      setVertretungChildName("");
      setOtherChild(null);
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

  const dateIsWeekend = isWeekend(date);

  const canProceed = useMemo(() => {
    if (type === "VERTRETUNG") {
      return vertretungChildName.trim().length >= 2 && Boolean(duration);
    }
    if (type === EventType.SICK) return true;
    if (workVariant === "OWN") {
      if (dateIsWeekend) return false;
      return childIds.length >= 1 && Boolean(duration);
    }
    if (workVariant === "SUBSTITUTE") {
      if (dateIsWeekend) return false;
      return Boolean(otherChild) && Boolean(duration);
    }
    // INDIRECT
    return Boolean(otherChild) && note.trim().length >= 3 && Boolean(duration);
  }, [
    type,
    workVariant,
    vertretungChildName,
    dateIsWeekend,
    childIds.length,
    duration,
    otherChild,
    note,
  ]);

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
  }, [date, schedules, dayAssignedChildren, childIds, lastEntry]);

  const submitWithSignature = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      if (type === "VERTRETUNG") {
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
      } else if (workVariant === "OWN") {
        await createEventAction({
          type: EventType.WORK,
          workVariant: "OWN",
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
      } else if (workVariant === "SUBSTITUTE") {
        await createEventAction({
          type: EventType.WORK,
          workVariant: "SUBSTITUTE",
          date,
          childIds: otherChild ? [otherChild.id] : [],
          startTime,
          endTime,
          note: note.trim() || undefined,
          signaturePngBase64: pngBase64,
        });
        toast.success("Einspringen gespeichert");
      } else {
        await createEventAction({
          type: EventType.INDIRECT,
          date,
          childIds: otherChild ? [otherChild.id] : [],
          startTime,
          endTime,
          note: note.trim(),
          signaturePngBase64: pngBase64,
        });
        toast.success("Indirekte Leistung gespeichert");
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
    type === "VERTRETUNG"
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

            <div className="grid grid-cols-3 gap-2">
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
              <Button
                type="button"
                variant={type === "VERTRETUNG" ? "default" : "outline"}
                onClick={() => setType("VERTRETUNG")}
                className={cn(
                  "h-12",
                  type === "VERTRETUNG" &&
                    "bg-amber-600 hover:bg-amber-700 text-white",
                )}
              >
                <UserPlus className="size-4" /> Vertretung
              </Button>
            </div>

            {type === "VERTRETUNG" && (
              <>
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

                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-start">Start</Label>
                    <Input
                      id="v-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-14 text-xl font-mono tabular-nums"
                    />
                  </div>
                  <span className="pb-3 text-muted-foreground">→</span>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-end">Ende</Label>
                    <Input
                      id="v-end"
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
                              setVertretungChildName(v.childName);
                              setStartTime(b.startTime);
                              setEndTime(b.endTime);
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
                              <span className="font-medium">{v.childName}</span>
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

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Bei exakter Übereinstimmung wird der Eintrag sofort
                  gespeichert — sonst leiten wir den Antrag an einen Admin
                  weiter.
                </div>
              </>
            )}

            {type === EventType.WORK && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant={workVariant === "OWN" ? "default" : "outline"}
                    onClick={() => setWorkVariant("OWN")}
                    className="h-10 text-xs sm:text-sm"
                  >
                    <Briefcase className="size-3.5" /> Eigenes Kind
                  </Button>
                  <Button
                    type="button"
                    variant={
                      workVariant === "SUBSTITUTE" ? "default" : "outline"
                    }
                    onClick={() => setWorkVariant("SUBSTITUTE")}
                    className="h-10 text-xs sm:text-sm"
                  >
                    <UserPlus className="size-3.5" /> Einspringen
                  </Button>
                  <Button
                    type="button"
                    variant={workVariant === "INDIRECT" ? "default" : "outline"}
                    onClick={() => setWorkVariant("INDIRECT")}
                    className="h-10 text-xs sm:text-sm"
                  >
                    <FileText className="size-3.5" /> Indirekt
                  </Button>
                </div>

                {workVariant === "OWN" &&
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

                {workVariant === "SUBSTITUTE" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="other-child">Kind (Einspringen)</Label>
                    <ChildSearchCombobox
                      id="other-child"
                      value={otherChild}
                      onChange={setOtherChild}
                      placeholder="Kind suchen…"
                    />
                    <p className="text-xs text-muted-foreground">
                      Suche nach dem Kind, für das du einspringst.
                    </p>
                  </div>
                )}

                {workVariant === "INDIRECT" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="other-child">Kind</Label>
                    <ChildSearchCombobox
                      id="other-child"
                      value={otherChild}
                      onChange={setOtherChild}
                      placeholder="Kind suchen…"
                    />
                    <p className="text-xs text-muted-foreground">
                      Eine indirekte Leistung muss einem Kind zugeordnet werden.
                    </p>
                  </div>
                )}

                {(workVariant === "OWN" || workVariant === "SUBSTITUTE") &&
                  dateIsWeekend && (
                    <p className="rounded-lg border border-amber-400/50 bg-amber-50/50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      Diese Tätigkeit ist nur an Werktagen möglich. Für
                      Wochenend-Tätigkeiten bitte &bdquo;Indirekt&ldquo; wählen.
                    </p>
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

                {workVariant === "OWN" && quickSlots.length > 0 && (
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

            {type !== "VERTRETUNG" &&
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
          </form>
        </SheetContent>
      </Sheet>

      <SignaturePadDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        title={
          type === "VERTRETUNG"
            ? "Vertretung bestätigen"
            : match({ type, workVariant })
                .with({ type: EventType.SICK }, () => "Krankheit bestätigen")
                .with(
                  { type: EventType.INDIRECT },
                  () => "Indirekte Leistung bestätigen",
                )
                .with(
                  { workVariant: "INDIRECT" },
                  () => "Indirekte Leistung bestätigen",
                )
                .with(
                  { workVariant: "SUBSTITUTE" },
                  () => "Einspringen bestätigen",
                )
                .otherwise(() => "Arbeitszeit bestätigen")
        }
        subtitle={signerSubtitle}
        signerLabel={`${currentUserName} (Mitarbeiter)`}
        onConfirm={submitWithSignature}
        submitting={submitting}
      />
    </>
  );
}
