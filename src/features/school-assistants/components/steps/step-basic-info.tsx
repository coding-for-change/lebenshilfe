"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { WizardErrors, WizardFormState } from "../wizard-types";

type Props = {
  value: WizardFormState;
  onChange: (next: Partial<WizardFormState>) => void;
  errors: WizardErrors;
  emailDisabled?: boolean;
};

export function StepBasicInfo({
  value,
  onChange,
  errors,
  emailDisabled,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="sb-name">
          <FieldContent>
            <span>Name</span>
            <span className="text-xs font-normal text-muted-foreground">
              Vor- und Nachname
            </span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="sb-name"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Max Mustermann"
          aria-invalid={!!errors.name}
        />
        <FieldError>{errors.name}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="sb-email">
          <FieldContent>
            <span>E-Mail</span>
            <span className="text-xs font-normal text-muted-foreground">
              An diese Adresse wird die Einladung gesendet.
            </span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="sb-email"
          type="email"
          value={value.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="name@beispiel.de"
          disabled={emailDisabled}
          aria-invalid={!!errors.email}
        />
        <FieldError>{errors.email}</FieldError>
      </Field>
    </div>
  );
}
