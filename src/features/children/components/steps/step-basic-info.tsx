"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { SchoolSelect, type SchoolOption } from "@/features/schools";
import type { ChildWizardErrors, ChildWizardFormState } from "../../schemas";

type Props = {
  value: ChildWizardFormState;
  onChange: (next: Partial<ChildWizardFormState>) => void;
  errors: ChildWizardErrors;
  schoolOptions: SchoolOption[];
  onSchoolCreated: (created: SchoolOption) => void;
};

export function StepBasicInfoChild({
  value,
  onChange,
  errors,
  schoolOptions,
  onSchoolCreated,
}: Props) {
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
              Aus den angelegten Schulen wählen oder neu anlegen.
            </span>
          </FieldContent>
        </FieldLabel>
        <SchoolSelect
          id="kind-school"
          options={schoolOptions}
          value={value.schoolId}
          onChange={(id) => onChange({ schoolId: id })}
          onCreated={onSchoolCreated}
          ariaInvalid={!!errors.schoolId}
        />
        <FieldError>{errors.schoolId}</FieldError>
      </Field>
    </div>
  );
}
