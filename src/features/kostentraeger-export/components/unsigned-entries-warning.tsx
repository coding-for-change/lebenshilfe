"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { formatShortDateWithWeekday } from "@/lib/utils";
import type { UnsignedEntry } from "../schemas";

/**
 * Shown instead of the export form when the period contains entries the
 * Schulbegleiter has not signed yet. Those are never billed: the admin either
 * waits for the signatures or exports without them.
 */
export function UnsignedEntriesWarning({
  entries,
  busy,
  onBack,
  onExportWithout,
}: {
  entries: UnsignedEntry[];
  busy: boolean;
  onBack: () => void;
  onExportWithout: () => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <p>
            {entries.length === 1
              ? "1 Eintrag in diesem Zeitraum ist noch nicht unterschrieben und wird deshalb nicht abgerechnet."
              : `${entries.length} Einträge in diesem Zeitraum sind noch nicht unterschrieben und werden deshalb nicht abgerechnet.`}{" "}
            Die Schulbegleitung bestätigt sie mit ihrer Unterschrift in der App
            unter „Änderungen bestätigen“.
          </p>
        </div>
        <ul className="max-h-64 divide-y overflow-y-auto rounded-md border text-sm">
          {entries.map((e, i) => (
            <li
              key={`${e.date}-${e.startTime}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2"
            >
              <span className="font-medium">
                {formatShortDateWithWeekday(`${e.date}T00:00:00`)}
                {e.startTime && e.endTime
                  ? ` · ${e.startTime}–${e.endTime}`
                  : ""}
              </span>
              <span className="text-muted-foreground">
                {e.schulbegleiterName} ·{" "}
                {e.isCorrection
                  ? "von einem Admin korrigiert"
                  : "von einem Admin angelegt"}
                {e.type === "INDIRECT" ? " (indirekte Leistung)" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={busy}
        >
          Zurück
        </Button>
        <Button
          type="button"
          onClick={onExportWithout}
          disabled={busy}
        >
          {busy ? "Exportiert…" : "Ohne diese Einträge exportieren"}
        </Button>
      </DialogFooter>
    </>
  );
}
