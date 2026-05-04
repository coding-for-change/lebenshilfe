"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { SchoolAutocomplete } from "../school-autocomplete";
import { SchoolPreview } from "../school-preview";
import type { ChildWizardErrors, ChildWizardFormState } from "../../schemas";

type Props = {
  value: ChildWizardFormState;
  onChange: (next: Partial<ChildWizardFormState>) => void;
  errors: ChildWizardErrors;
};

export function StepBasicInfoChild({ value, onChange, errors }: Props) {
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
        <FieldLabel htmlFor="kind-school">
          <FieldContent>
            <span>Schule</span>
            <span className="text-xs font-normal text-muted-foreground">
              Suche per Google Maps. Standort-Vorschau erscheint unten.
            </span>
          </FieldContent>
        </FieldLabel>
        <SchoolAutocomplete
          id="kind-school"
          value={value.school}
          onChange={(next) => onChange({ school: next })}
          ariaInvalid={!!errors.school}
        />
        <FieldError>{errors.school}</FieldError>
        <SchoolPreview
          placeId={value.school.placeId}
          address={value.school.address}
        />
      </Field>
    </div>
  );
}
