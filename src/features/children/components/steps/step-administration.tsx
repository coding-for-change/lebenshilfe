"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  CostBearerCombobox,
  type CostBearerOption,
} from "@/features/cost-bearers";
import type { ChildWizardErrors, ChildWizardFormState } from "../../schemas";

type Props = {
  value: ChildWizardFormState;
  onChange: (next: Partial<ChildWizardFormState>) => void;
  errors: ChildWizardErrors;
  costBearerOptions: CostBearerOption[];
  onCostBearerCreated: (created: CostBearerOption) => void;
};

export function StepAdministrationChild({
  value,
  onChange,
  errors,
  costBearerOptions,
  onCostBearerCreated,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="child-cost-bearer">
          <FieldContent>
            <span>Kostenträger</span>
            <span className="text-xs font-normal text-muted-foreground">
              Suchen oder neuen anlegen.
            </span>
          </FieldContent>
        </FieldLabel>
        <CostBearerCombobox
          id="child-cost-bearer"
          options={costBearerOptions}
          value={value.kostentraegerId}
          onChange={(id) => onChange({ kostentraegerId: id })}
          onCreated={onCostBearerCreated}
          ariaInvalid={!!errors.kostentraegerId}
        />
        <FieldError>{errors.kostentraegerId}</FieldError>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="kind-sbib">
            <FieldContent>
              <span>SB / IB</span>
              <span className="text-xs font-normal text-muted-foreground">
                Freitext.
              </span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="kind-sbib"
            value={value.sbIb}
            onChange={(e) => onChange({ sbIb: e.target.value })}
            aria-invalid={!!errors.sbIb}
          />
          <FieldError>{errors.sbIb}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind-bescheid">
            <FieldContent>
              <span>Bescheid</span>
              <span className="text-xs font-normal text-muted-foreground">
                Freitext, Notizen zum Bescheid.
              </span>
            </FieldContent>
          </FieldLabel>
          <Textarea
            id="kind-bescheid"
            value={value.bescheid}
            onChange={(e) => onChange({ bescheid: e.target.value })}
            rows={2}
            aria-invalid={!!errors.bescheid}
          />
          <FieldError>{errors.bescheid}</FieldError>
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <FlagRow
          id="kind-leos"
          label="Leos One"
          description="In das Kostenkalkulationstool aufnehmen."
          checked={value.leosOne}
          onChange={(v) => onChange({ leosOne: v })}
        />
        <FlagRow
          id="kind-schweige"
          label="Schweigepflichtsentbindung"
          description="Liegt unterschrieben vor."
          checked={value.schweigepflichtsentbindung}
          onChange={(v) => onChange({ schweigepflichtsentbindung: v })}
        />
      </div>

      <Field>
        <FieldLabel htmlFor="kind-bemerkung">
          <FieldContent>
            <span>Bemerkung</span>
            <span className="text-xs font-normal text-muted-foreground">
              Zusätzliche Informationen.
            </span>
          </FieldContent>
        </FieldLabel>
        <Textarea
          id="kind-bemerkung"
          value={value.bemerkung}
          onChange={(e) => onChange({ bemerkung: e.target.value })}
          rows={3}
          aria-invalid={!!errors.bemerkung}
        />
        <FieldError>{errors.bemerkung}</FieldError>
      </Field>
    </div>
  );
}

function FlagRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </label>
  );
}
