"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import type { WizardWorkshopRow, WorkshopOption } from "./wizard-types";

type Props = {
  rows: WizardWorkshopRow[];
  workshops: WorkshopOption[];
  onChange: (rows: WizardWorkshopRow[]) => void;
  errors?: Record<string, string>;
  emptyMessage?: string;
};

const DEFAULT_EMPTY =
  "Noch keine Workshops angelegt. Lege zuerst unter „Workshops“ Einträge an, um sie hier auswählen zu können.";

export function WorkshopAttendanceList({
  rows,
  workshops,
  onChange,
  errors,
  emptyMessage = DEFAULT_EMPTY,
}: Props) {
  const byId = useMemo(
    () => new Map(rows.map((r) => [r.workshopId, r])),
    [rows],
  );

  if (workshops.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  function patch(workshopId: string, updates: Partial<WizardWorkshopRow>) {
    onChange(
      rows.map((row) =>
        row.workshopId === workshopId ? { ...row, ...updates } : row,
      ),
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-lg border">
      {workshops.map((w) => {
        const row =
          byId.get(w.id) ??
          ({
            workshopId: w.id,
            selected: false,
            attendedOn: "",
          } satisfies WizardWorkshopRow);
        const error = errors?.[w.id];
        return (
          <div
            key={w.id}
            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <label className="flex flex-1 cursor-pointer items-start gap-3">
              <Checkbox
                checked={row.selected}
                onCheckedChange={(v) =>
                  patch(w.id, {
                    selected: v === true,
                    attendedOn: v === true ? row.attendedOn : "",
                  })
                }
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{w.name}</span>
                {w.description ? (
                  <span className="text-xs text-muted-foreground">
                    {w.description}
                  </span>
                ) : null}
              </div>
            </label>
            {row.selected ? (
              <div className="flex flex-col gap-1 sm:w-56">
                <label
                  htmlFor={`ws-date-${w.id}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Teilnahmedatum
                </label>
                <DatePicker
                  id={`ws-date-${w.id}`}
                  value={row.attendedOn}
                  onChange={(next) => patch(w.id, { attendedOn: next })}
                  ariaInvalid={!!error}
                />
                {error ? (
                  <span className="text-xs text-destructive">{error}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
