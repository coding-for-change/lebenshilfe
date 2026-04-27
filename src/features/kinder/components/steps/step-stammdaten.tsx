"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { SchuleAutocomplete } from "../schule-autocomplete";
import { SchulePreview } from "../schule-preview";
import type { KindWizardErrors, KindWizardFormState } from "../wizard-types";

type Props = {
  value: KindWizardFormState;
  onChange: (next: Partial<KindWizardFormState>) => void;
  errors: KindWizardErrors;
};

export function StepStammdatenKind({ value, onChange, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="kind-first">
            <FieldContent>
              <span>Vorname</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="kind-first"
            value={value.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Max"
            aria-invalid={!!errors.firstName}
          />
          <FieldError>{errors.firstName}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind-last">
            <FieldContent>
              <span>Nachname</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="kind-last"
            value={value.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Mustermann"
            aria-invalid={!!errors.lastName}
          />
          <FieldError>{errors.lastName}</FieldError>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="kind-schule">
          <FieldContent>
            <span>Schule</span>
            <span className="text-xs font-normal text-muted-foreground">
              Suche per Google Maps. Standort-Vorschau erscheint unten.
            </span>
          </FieldContent>
        </FieldLabel>
        <SchuleAutocomplete
          id="kind-schule"
          value={value.schule}
          onChange={(next) => onChange({ schule: next })}
          ariaInvalid={!!errors.schule}
        />
        <FieldError>{errors.schule}</FieldError>
        <SchulePreview
          placeId={value.schule.placeId}
          address={value.schule.address}
        />
      </Field>
    </div>
  );
}
