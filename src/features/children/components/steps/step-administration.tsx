"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { FlagRow } from "@/components/flag-row";
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="kind-approved-direct">
            <FieldContent>
              <span>Genehmigte direkte Leistung</span>
              <span className="text-xs font-normal text-muted-foreground">
                Std. pro Monat (laut Bescheid).
              </span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="kind-approved-direct"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={value.approvedDirectHours}
            onChange={(e) => onChange({ approvedDirectHours: e.target.value })}
            aria-invalid={!!errors.approvedDirectHours}
          />
          <FieldError>{errors.approvedDirectHours}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind-approved-indirect">
            <FieldContent>
              <span>Genehmigte indirekte Leistung</span>
              <span className="text-xs font-normal text-muted-foreground">
                Std. pro Monat (laut Bescheid).
              </span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="kind-approved-indirect"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={value.approvedIndirectHours}
            onChange={(e) =>
              onChange({ approvedIndirectHours: e.target.value })
            }
            aria-invalid={!!errors.approvedIndirectHours}
          />
          <FieldError>{errors.approvedIndirectHours}</FieldError>
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
        <FlagRow
          id="kind-vorviertelstunde"
          label="Vorviertelstunde"
          description="+15 Min. vor der direkten Leistung im Export."
          checked={value.vorviertelstunde}
          onChange={(v) => onChange({ vorviertelstunde: v })}
        />
        <FlagRow
          id="kind-nachviertelstunde"
          label="Nachviertelstunde"
          description="+15 Min. nach der direkten Leistung im Export."
          checked={value.nachviertelstunde}
          onChange={(v) => onChange({ nachviertelstunde: v })}
        />
        <FlagRow
          id="kind-ausflug"
          label="Ausflüge & Schullandheim"
          description="Nur Kennzeichnung, keine Auswirkung auf die Stunden."
          checked={value.ausflugSchullandheim}
          onChange={(v) => onChange({ ausflugSchullandheim: v })}
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
