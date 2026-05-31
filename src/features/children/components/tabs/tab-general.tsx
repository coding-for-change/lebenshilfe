"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { FlagRow } from "@/components/flag-row";
import {
  CostBearerCombobox,
  type CostBearerOption,
} from "@/features/cost-bearers";
import { SchoolSelect, type SchoolOption } from "@/features/schools";
import type { GeneralFormState } from "./use-general-editor";

type Props = {
  form: GeneralFormState;
  update: (patch: Partial<GeneralFormState>) => void;
  onSubmit: () => void;
  formId: string;
  costBearerOptions: CostBearerOption[];
  onCostBearerCreated: (created: CostBearerOption) => void;
  schoolOptions: SchoolOption[];
  onSchoolCreated: (created: SchoolOption) => void;
};

export function TabGeneral({
  form,
  update,
  onSubmit,
  formId,
  costBearerOptions,
  onCostBearerCreated,
  schoolOptions,
  onSchoolCreated,
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
        <SchoolSelect
          id="det-school"
          options={schoolOptions}
          value={form.schoolId}
          onChange={(id) => update({ schoolId: id })}
          onCreated={onSchoolCreated}
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
