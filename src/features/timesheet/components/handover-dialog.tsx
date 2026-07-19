"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  timeToMinutes,
  weekdayIndex,
} from "@/lib/dates";
import type { Event } from "@/generated/prisma";
import type { VertretungDay } from "./timesheet-shell";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  events: Array<
    Pick<
      Event,
      "id" | "date" | "type" | "startTime" | "endTime" | "childId"
    > & {
      child: { firstName: string; lastName: string } | null;
    }
  >;
  /** Days this user steps in as substitute — used to flag Vertretung entries. */
  substituteOn?: VertretungDay[];
};

type Stage = "intro" | "sign" | "done";

export function HandoverDialog({
  open,
  onOpenChange,
  year,
  month,
  events,
  substituteOn = [],
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

  // Vertretung is stored as a plain WORK Event; it is recognised by a matching
  // Vertretung block (same child + day) among the days this user substitutes.
  const vertretungKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const v of substituteOn) keys.add(`${v.childId}|${v.date}`);
    return keys;
  }, [substituteOn]);

  const isVertretung = useCallback(
    (ev: Pick<Event, "type" | "date" | "childId">) =>
      ev.type === "WORK" &&
      ev.childId != null &&
      vertretungKeys.has(`${ev.childId}|${ev.date.toISOString().slice(0, 10)}`),
    [vertretungKeys],
  );

  const totals = useMemo(() => {
    let directMin = 0;
    let indirectMin = 0;
    let vertretungMin = 0;
    let sickDays = 0;
    for (const ev of events) {
      if (ev.type === "SICK") {
        sickDays++;
        continue;
      }
      if (!ev.startTime || !ev.endTime) continue;
      const mins = timeToMinutes(ev.endTime) - timeToMinutes(ev.startTime);
      if (ev.type === "INDIRECT") indirectMin += mins;
      else if (isVertretung(ev)) vertretungMin += mins;
      else directMin += mins;
    }
    return {
      direct: fmtHm(directMin),
      indirect: fmtHm(indirectMin),
      vertretung: fmtHm(vertretungMin),
      hours: fmtHm(directMin + indirectMin + vertretungMin),
      sickDays,
      count: events.length,
    };
  }, [events, isVertretung]);

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
            <DialogDescription className="sr-only">
              {stage === "done"
                ? `Der Monat ${MONTHS_LONG[month - 1]} ${year} wurde freigegeben.`
                : `Übersicht und Freigabe der Einträge im ${MONTHS_LONG[month - 1]} ${year}.`}
            </DialogDescription>
          </DialogHeader>

          {stage === "intro" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm">
                  Bitte geben Sie Ihr Telefon nun an Ihre Lehrkraft, damit diese
                  den Monat prüfen und unterschreiben kann.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <Stat
                  label="Direkt"
                  value={totals.direct}
                />
                <Stat
                  label="Indirekt"
                  value={totals.indirect}
                />
                <Stat
                  label="Vertretung"
                  value={totals.vertretung}
                />
                <Stat
                  label="Krank"
                  value={
                    totals.sickDays === 1 ? "1 Tag" : `${totals.sickDays} Tage`
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supervisor">Name Lehrkraft</Label>
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
                        (e) =>
                          (e.type === "WORK" || e.type === "INDIRECT") &&
                          e.startTime &&
                          e.endTime,
                      );
                      return (
                        <li
                          key={day}
                          className="flex items-start justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <span className="pt-0.5 font-mono tabular-nums text-muted-foreground">
                            {wd} {String(day).padStart(2, "0")}.
                          </span>
                          {sick ? (
                            <Badge className="bg-rose-500/15 text-rose-700 border-rose-200">
                              Krank
                            </Badge>
                          ) : workEvents.length > 0 ? (
                            <div className="flex flex-col items-end gap-1">
                              {workEvents.map((e) => (
                                <span
                                  key={e.id}
                                  className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right"
                                >
                                  {e.child && (
                                    <span className="font-medium">
                                      {e.child.firstName} {e.child.lastName}
                                    </span>
                                  )}
                                  <span className="font-mono tabular-nums text-muted-foreground">
                                    {e.startTime}–{e.endTime}
                                  </span>
                                  {e.type === "INDIRECT" ? (
                                    <Badge className="bg-violet-500/15 text-violet-700 border-violet-200">
                                      Indirekt
                                    </Badge>
                                  ) : isVertretung(e) ? (
                                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">
                                      Vertretung
                                    </Badge>
                                  ) : null}
                                </span>
                              ))}
                            </div>
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
        signerLabel={`${supervisorName || "Lehrkraft"} (Lehrkraft)`}
        onConfirm={submit}
        submitting={submitting}
      />
    </>
  );
}

function fmtHm(mins: number) {
  return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
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
