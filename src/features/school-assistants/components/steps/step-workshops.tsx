"use client";

import { WorkshopAttendanceList } from "../workshop-attendance-list";
import type {
  WizardErrors,
  WizardFormState,
  WorkshopOption,
} from "../wizard-types";

type Props = {
  value: WizardFormState;
  onChange: (next: Partial<WizardFormState>) => void;
  errors: WizardErrors;
  workshops: WorkshopOption[];
};

export function StepWorkshops({ value, onChange, errors, workshops }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {workshops.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Wähle die besuchten Workshops und gib jeweils das Datum an.
        </p>
      ) : null}
      <WorkshopAttendanceList
        rows={value.workshops}
        workshops={workshops}
        onChange={(rows) => onChange({ workshops: rows })}
        errors={errors.workshops}
      />
    </div>
  );
}
