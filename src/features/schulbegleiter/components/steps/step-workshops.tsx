"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import type {
  WizardErrors,
  WizardFormState,
  WizardWorkshopRow,
  WorkshopOption,
} from "../wizard-types";

type Props = {
  value: WizardFormState;
  onChange: (next: Partial<WizardFormState>) => void;
  errors: WizardErrors;
  workshops: WorkshopOption[];
};

export function StepWorkshops({ value, onChange, errors, workshops }: Props) {
  if (workshops.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Noch keine Workshops angelegt. Lege zuerst unter „Workshops“ Einträge
        an, um sie hier auswählen zu können.
      </div>
    );
  }

  function update(workshopId: string, patch: Partial<WizardWorkshopRow>) {
    const next = value.workshops.map((row) =>
      row.workshopId === workshopId ? { ...row, ...patch } : row,
    );
    onChange({ workshops: next });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Wähle die besuchten Workshops und gib jeweils das Datum an.
      </p>
      <div className="flex flex-col divide-y rounded-lg border">
        {workshops.map((w) => {
          const row =
            value.workshops.find((r) => r.workshopId === w.id) ??
            ({
              workshopId: w.id,
              selected: false,
              attendedOn: "",
            } satisfies WizardWorkshopRow);
          const error = errors.workshops?.[w.id];
          return (
            <div
              key={w.id}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <label className="flex flex-1 cursor-pointer items-start gap-3">
                <Checkbox
                  checked={row.selected}
                  onCheckedChange={(v) =>
                    update(w.id, {
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
                  <DatePicker
                    value={row.attendedOn}
                    onChange={(next) => update(w.id, { attendedOn: next })}
                    placeholder="Teilnahmedatum"
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
    </div>
  );
}
