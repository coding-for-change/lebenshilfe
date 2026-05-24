"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { FlagRow } from "@/components/flag-row";
import type { WizardErrors, WizardFormState } from "../wizard-types";

type Props = {
  value: WizardFormState;
  onChange: (next: Partial<WizardFormState>) => void;
  errors: WizardErrors;
};

export function StepContract({ value, onChange, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="sb-hours">
            <FieldContent>
              <span>Stunden</span>
              <span className="text-xs font-normal text-muted-foreground">
                Vertraglich vereinbart pro Woche.
              </span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="sb-hours"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            pattern="[0-9]+([.,][0-9]+)?"
            value={value.weeklyHours}
            onChange={(e) => {
              const next = e.target.value.replace(/[^0-9.,]/g, "");
              onChange({ weeklyHours: next });
            }}
            placeholder="z.B. 20"
            aria-invalid={!!errors.weeklyHours}
          />
          <FieldError>{errors.weeklyHours}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="sb-introday">
            <FieldContent>
              <span>Einführungstag</span>
              <span className="text-xs font-normal text-muted-foreground">
                Datum der Einführung.
              </span>
            </FieldContent>
          </FieldLabel>
          <DatePicker
            id="sb-introday"
            value={value.introductionDay}
            onChange={(next) => onChange({ introductionDay: next })}
            ariaInvalid={!!errors.introductionDay}
          />
          <FieldError>{errors.introductionDay}</FieldError>
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <FlagRow
          id="sb-leos"
          label="Leos One"
          description="Zugang zum Leos-One-System."
          checked={value.leosOne}
          onChange={(v) => onChange({ leosOne: v })}
        />
        <FlagRow
          id="sb-outlook"
          label="Outlook"
          description="Outlook-Konto eingerichtet."
          checked={value.outlook}
          onChange={(v) => onChange({ outlook: v })}
        />
        <FlagRow
          id="sb-zvneu"
          label="ZV neu nach Bescheid"
          description="Notiz wird sichtbar, sobald aktiviert."
          checked={value.zvNeuNachBescheid}
          onChange={(v) =>
            onChange({
              zvNeuNachBescheid: v,
              zvNeuNote: v ? value.zvNeuNote : "",
            })
          }
        />
        {value.zvNeuNachBescheid ? (
          <Field>
            <FieldLabel htmlFor="sb-zvnote">
              <FieldContent>
                <span>Notiz</span>
              </FieldContent>
            </FieldLabel>
            <Textarea
              id="sb-zvnote"
              value={value.zvNeuNote}
              onChange={(e) => onChange({ zvNeuNote: e.target.value })}
              rows={3}
              placeholder="Hinweise zum Bescheid…"
              aria-invalid={!!errors.zvNeuNote}
            />
            <FieldError>{errors.zvNeuNote}</FieldError>
          </Field>
        ) : null}
      </div>
    </div>
  );
}
