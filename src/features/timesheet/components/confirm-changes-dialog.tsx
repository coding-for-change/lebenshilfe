"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateLong, formatDuration } from "@/lib/dates";
import { SignaturePadDialog } from "./signature-pad-dialog";
import { confirmWorkEventsAction } from "../actions";

export type PendingConfirmEvent = {
  id: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  child: { firstName: string; lastName: string } | null;
};

type Props = {
  open: boolean;
  /** Called when the user defers (Später, Esc, click-away). */
  onLater: () => void;
  /** Called after the entries were successfully signed. */
  onConfirmed: () => void;
  events: PendingConfirmEvent[];
  signerLabel: string;
};

export function ConfirmChangesDialog({
  open,
  onLater,
  onConfirmed,
  events,
  signerLabel,
}: Props) {
  const [signOpen, setSignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSign = async (pngBase64: string) => {
    setSubmitting(true);
    try {
      await confirmWorkEventsAction({
        eventIds: events.map((e) => e.id),
        signaturePngBase64: pngBase64,
      });
      toast.success("Änderungen bestätigt.");
      setSignOpen(false);
      onConfirmed();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bestätigung fehlgeschlagen.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onLater();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Änderungen bestätigen
            </DialogTitle>
            <DialogDescription>
              {events.length === 1
                ? "Ein Eintrag wurde von der Verwaltung erstellt oder geändert. Bitte prüfen und signieren Sie ihn, um ihn zu bestätigen."
                : `${events.length} Einträge wurden von der Verwaltung erstellt oder geändert. Bitte prüfen und signieren Sie sie, um sie zu bestätigen.`}
            </DialogDescription>
          </DialogHeader>

          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {events.map((ev) => {
              const dur =
                ev.startTime && ev.endTime
                  ? formatDuration(ev.startTime, ev.endTime)
                  : "";
              return (
                <li
                  key={ev.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {ev.child
                        ? `${ev.child.firstName} ${ev.child.lastName}`
                        : "Arbeit"}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {ev.startTime}–{ev.endTime}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDateLong(ev.date)}</span>
                    {dur && (
                      <Badge
                        variant="secondary"
                        className="font-mono"
                      >
                        {dur}
                      </Badge>
                    )}
                  </div>
                  {ev.note && (
                    <p className="mt-1 text-muted-foreground">{ev.note}</p>
                  )}
                </li>
              );
            })}
          </ul>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onLater}
              disabled={submitting}
            >
              Später
            </Button>
            <Button
              type="button"
              onClick={() => setSignOpen(true)}
              disabled={submitting}
            >
              Signieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignaturePadDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        title="Änderungen signieren"
        subtitle="Mit Ihrer Unterschrift bestätigen Sie die aufgeführten Einträge."
        signerLabel={signerLabel}
        onConfirm={handleSign}
        submitting={submitting}
      />
    </>
  );
}
