"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Stethoscope } from "lucide-react";
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
import { EventType } from "@/generated/prisma";
import { SignaturePadDialog } from "./signature-pad-dialog";
import { createEventAction } from "../actions";
import { formatDateIso, formatDuration, timeToMinutes } from "./date-utils";
import type { ChildOption } from "./children-filter";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  assignedChildren: ChildOption[];
  currentUserName: string;
};

const QUICK_CHIPS: Array<[string, string]> = [
  ["08:00", "17:00"],
  ["07:00", "15:30"],
  ["09:00", "18:00"],
  ["13:00", "21:00"],
];

export function NewEntrySheet({
  open,
  onOpenChange,
  defaultDate,
  assignedChildren,
  currentUserName,
}: Props) {
  const [type, setType] = useState<EventType>(EventType.WORK);
  const [date, setDate] = useState(formatDateIso(defaultDate));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [childIds, setChildIds] = useState<string[]>(
    assignedChildren.length === 1 ? [assignedChildren[0].id] : [],
  );
  const [sigOpen, setSigOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(formatDateIso(defaultDate));
      setType(EventType.WORK);
      setStartTime("08:00");
      setEndTime("17:00");
      setNote("");
      setChildIds(
        assignedChildren.length === 1 ? [assignedChildren[0].id] : [],
      );
    }
  }, [open, defaultDate, assignedChildren]);

  const duration = useMemo(() => {
    if (!startTime || !endTime) return null;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return null;
    return formatDuration(startTime, endTime);
  }, [startTime, endTime]);

  const canProceed =
    type === EventType.SICK
      ? true
      : childIds.length >= 1 && Boolean(duration);

  const toggleChild = (id: string) => {
    setChildIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
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
      toast.error(
        e instanceof Error ? e.message : "Speichern fehlgeschlagen.",
      );
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl sm:max-w-lg sm:mx-auto"
        >
          <SheetHeader>
            <SheetTitle>Neuer Eintrag</SheetTitle>
            <SheetDescription>
              Ein Eintrag wird nach der Unterschrift gespeichert.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                max={formatDateIso(new Date())}
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
                {assignedChildren.length === 0 ? (
                  <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Noch keinem Kind zugewiesen — bitte an die Administration
                    wenden.
                  </p>
                ) : assignedChildren.length === 1 ? (
                  <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Kind: </span>
                    {assignedChildren[0].firstName}{" "}
                    {assignedChildren[0].lastName}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Kinder</Label>
                    <div className="space-y-1 rounded-lg border border-border p-2">
                      {assignedChildren.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleChild(c.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <Checkbox checked={childIds.includes(c.id)} />
                          <span>
                            {c.firstName} {c.lastName}
                          </span>
                        </button>
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

                <div className="grid grid-cols-4 gap-1.5">
                  {QUICK_CHIPS.map(([s, e]) => (
                    <button
                      key={`${s}-${e}`}
                      type="button"
                      onClick={() => {
                        setStartTime(s);
                        setEndTime(e);
                      }}
                      className="rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs font-mono hover:bg-accent"
                    >
                      {s.slice(0, 5)}–{e.slice(0, 5)}
                    </button>
                  ))}
                </div>
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
                type="button"
                disabled={!canProceed}
                onClick={() => setSigOpen(true)}
              >
                Speichern & signieren
              </Button>
            </div>
          </div>
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
