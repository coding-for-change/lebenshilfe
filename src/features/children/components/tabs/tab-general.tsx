"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { FlagRow } from "@/components/flag-row";
import {
  CostBearerCombobox,
  type CostBearerOption,
} from "@/features/cost-bearers";
import { SchoolAutocomplete } from "../school-autocomplete";
import { SchoolPreview } from "../school-preview";
import type { GeneralFormState } from "./use-general-editor";

type Props = {
  form: GeneralFormState;
  update: (patch: Partial<GeneralFormState>) => void;
  onSubmit: () => void;
  formId: string;
  costBearerOptions: CostBearerOption[];
  onCostBearerCreated: (created: CostBearerOption) => void;
};

export function TabGeneral({
  form,
  update,
  onSubmit,
  formId,
  costBearerOptions,
  onCostBearerCreated,
}: Props) {
  return (
    <form
      id={formId}
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="det-first">
            <FieldContent>
              <span>Vorname</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-first"
            value={form.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="det-last">
            <FieldContent>
              <span>Nachname</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-last"
            value={form.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="det-school">
          <FieldContent>
            <span>Schule</span>
          </FieldContent>
        </FieldLabel>
        <SchoolAutocomplete
          id="det-school"
          value={form.school}
          onChange={(next) => update({ school: next })}
        />
        <SchoolPreview
          placeId={form.school.placeId}
          address={form.school.address}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="det-kostentraeger">
          <FieldContent>
            <span>Kostenträger</span>
          </FieldContent>
        </FieldLabel>
        <CostBearerCombobox
          id="det-kostentraeger"
          options={costBearerOptions}
          value={form.kostentraegerId}
          onChange={(id) => update({ kostentraegerId: id })}
          onCreated={onCostBearerCreated}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="det-sbib">
            <FieldContent>
              <span>SB / IB</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-sbib"
            value={form.sbIb}
            onChange={(e) => update({ sbIb: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="det-bescheid">
            <FieldContent>
              <span>Bescheid</span>
            </FieldContent>
          </FieldLabel>
          <Textarea
            id="det-bescheid"
            value={form.bescheid}
            onChange={(e) => update({ bescheid: e.target.value })}
            rows={2}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="det-approved-direct">
            <FieldContent>
              <span>Genehmigte direkte Leistung</span>
              <span className="text-xs font-normal text-muted-foreground">
                Std. pro Monat (laut Bescheid).
              </span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-approved-direct"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={form.approvedDirectHours}
            onChange={(e) => update({ approvedDirectHours: e.target.value })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="det-approved-indirect">
            <FieldContent>
              <span>Genehmigte indirekte Leistung</span>
              <span className="text-xs font-normal text-muted-foreground">
                Std. pro Monat (laut Bescheid).
              </span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-approved-indirect"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={form.approvedIndirectHours}
            onChange={(e) => update({ approvedIndirectHours: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <FlagRow
          id="det-leos"
          label="Leos One"
          description="In das Kostenkalkulationstool aufnehmen."
          checked={form.leosOne}
          onChange={(v) => update({ leosOne: v })}
        />
        <FlagRow
          id="det-schweige"
          label="Schweigepflichtsentbindung"
          description="Liegt unterschrieben vor."
          checked={form.schweigepflichtsentbindung}
          onChange={(v) => update({ schweigepflichtsentbindung: v })}
        />
      </div>

      <Field>
        <FieldLabel htmlFor="det-bemerkung">
          <FieldContent>
            <span>Bemerkung</span>
          </FieldContent>
        </FieldLabel>
        <Textarea
          id="det-bemerkung"
          value={form.bemerkung}
          onChange={(e) => update({ bemerkung: e.target.value })}
          rows={4}
        />
      </Field>
    </form>
  );
}
