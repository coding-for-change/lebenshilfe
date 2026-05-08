"use client";

import { useMemo, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SignaturePadDialog } from "./signature-pad-dialog";
import { submitMonthlyReportAction } from "../actions";
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  formatDuration,
  timeToMinutes,
  weekdayIndex,
} from "@/lib/dates";
import type { Event } from "@/generated/prisma";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  events: Array<
    Pick<Event, "id" | "date" | "type" | "startTime" | "endTime" | "childId">
  >;
};

type Stage = "intro" | "sign" | "done";

export function HandoverDialog({
  open,
  onOpenChange,
  year,
  month,
  events,
}: Props) {
  const [stage, setStage] = useState<Stage>("intro");
  const [supervisorName, setSupervisorName] = useState("");
  const [sigOpen, setSigOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const daysInMonth = new Date(year, month, 0).getDate();

  const byDay = useMemo(() => {
    const map = new Map<number, typeof events>();
    for (const ev of events) {
      const d = ev.date.getUTCDate();
      const arr = map.get(d) ?? [];
      arr.push(ev);
      map.set(d, arr);
    }
    return map;
  }, [events]);

  const totals = useMemo(() => {
    let workMinutes = 0;
    let sickDays = 0;
    for (const ev of events) {
      if (ev.type === "SICK") sickDays++;
      else if (ev.startTime && ev.endTime) {
        workMinutes += timeToMinutes(ev.endTime) - timeToMinutes(ev.startTime);
      }
    }
    return {
      hours: `${Math.floor(workMinutes / 60)}h${
        workMinutes % 60 ? ` ${workMinutes % 60}m` : ""
      }`,
      sickDays,
      count: events.length,
    };
  }, [events]);

  const reset = () => {
    setStage("intro");
    setSupervisorName("");
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      await submitMonthlyReportAction({
        year,
        month,
        supervisorName: supervisorName.trim(),
        signaturePngBase64: pngBase64,
      });
      setSigOpen(false);
      setStage("done");
      toast.success("Monat freigegeben.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Freigabe fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              {stage === "done"
                ? "Monat freigegeben"
                : `Freigabe — ${MONTHS_LONG[month - 1]} ${year}`}
            </DialogTitle>
          </DialogHeader>

          {stage === "intro" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm">
                  Bitte geben Sie Ihr Telefon nun an Ihre/n Vorgesetzte/n, damit
                  diese/r den Monat prüfen und unterschreiben kann.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat
                  label="Stunden"
                  value={totals.hours}
                />
                <Stat
                  label="Krank"
                  value={String(totals.sickDays)}
                />
                <Stat
                  label="Einträge"
                  value={String(totals.count)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supervisor">Name Vorgesetzte/r</Label>
                <Input
                  id="supervisor"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="z.B. Frau Meier"
                />
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/40">
                  Tage im {MONTHS_LONG[month - 1]}
                </div>
                <ul className="max-h-64 overflow-auto divide-y divide-border">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const dayEvents = byDay.get(day) ?? [];
                      const date = new Date(Date.UTC(year, month - 1, day));
                      const wd = WEEKDAYS_SHORT[weekdayIndex(date)];
                      const sick = dayEvents.find((e) => e.type === "SICK");
                      const workEvents = dayEvents.filter(
                        (e) => e.type === "WORK" && e.startTime && e.endTime,
                      );
                      const workMins = workEvents.reduce(
                        (sum, e) =>
                          sum +
                          timeToMinutes(e.endTime!) -
                          timeToMinutes(e.startTime!),
                        0,
                      );
                      const earliestStart = workEvents.reduce<string | null>(
                        (acc, e) =>
                          !acc ||
                          timeToMinutes(e.startTime!) < timeToMinutes(acc)
                            ? e.startTime!
                            : acc,
                        null,
                      );
                      const latestEnd = workEvents.reduce<string | null>(
                        (acc, e) =>
                          !acc || timeToMinutes(e.endTime!) > timeToMinutes(acc)
                            ? e.endTime!
                            : acc,
                        null,
                      );
                      const hoursLabel =
                        workMins > 0
                          ? formatDuration(
                              "00:00",
                              `${String(Math.floor(workMins / 60)).padStart(
                                2,
                                "0",
                              )}:${String(workMins % 60).padStart(2, "0")}`,
                            )
                          : null;
                      return (
                        <li
                          key={day}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <span className="font-mono tabular-nums text-muted-foreground">
                            {wd} {String(day).padStart(2, "0")}.
                          </span>
                          {sick ? (
                            <Badge className="bg-rose-500/15 text-rose-700 border-rose-200">
                              Krank
                            </Badge>
                          ) : hoursLabel ? (
                            <span className="flex items-baseline gap-2 font-mono tabular-nums">
                              <span className="text-muted-foreground">
                                {earliestStart}–{latestEnd}
                              </span>
                              <span>{hoursLabel}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </li>
                      );
                    },
                  )}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  disabled={!supervisorName.trim()}
                  onClick={() => setSigOpen(true)}
                >
                  Weiter zur Unterschrift
                </Button>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
                <Check className="size-8" />
              </div>
              <p className="text-lg font-semibold">
                {MONTHS_LONG[month - 1]} {year} freigegeben
              </p>
              <p className="text-sm text-muted-foreground">
                {totals.count} Einträge wurden von {supervisorName}{" "}
                unterschrieben.
              </p>
              <Button onClick={() => handleOpenChange(false)}>Fertig</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SignaturePadDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        title={`${MONTHS_LONG[month - 1]} ${year}`}
        subtitle={`${totals.count} Einträge · ${totals.hours} Arbeit · ${totals.sickDays} Krankentage`}
        signerLabel={`${supervisorName || "Vorgesetzte/r"} (Vorgesetzte/r)`}
        onConfirm={submit}
        submitting={submitting}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
