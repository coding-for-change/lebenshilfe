"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  CostBearerCombobox,
  type CostBearerOption,
} from "@/features/cost-bearers";
import { SchoolAutocomplete } from "../school-autocomplete";
import { SchoolPreview } from "../school-preview";
import type { SerializedChild } from "../../serialize";
import { useAutosaveGeneral } from "./use-autosave-general";

type Props = {
  child: SerializedChild;
  costBearerOptions: CostBearerOption[];
  onCostBearerCreated: (created: CostBearerOption) => void;
};

export function TabGeneral({
  child,
  costBearerOptions,
  onCostBearerCreated,
}: Props) {
  const { form, update } = useAutosaveGeneral(child);

  return (
    <div className="flex flex-col gap-5">
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
            onChange={(e) => update("firstName", e.target.value)}
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
            onChange={(e) => update("lastName", e.target.value)}
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
          onChange={(next) => update("school", next)}
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
          onChange={(id) => update("kostentraegerId", id)}
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
            onChange={(e) => update("sbIb", e.target.value)}
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
            onChange={(e) => update("bescheid", e.target.value)}
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
          onChange={(v) => update("leosOne", v)}
        />
        <FlagRow
          id="det-schweige"
          label="Schweigepflichtsentbindung"
          description="Liegt unterschrieben vor."
          checked={form.schweigepflichtsentbindung}
          onChange={(v) => update("schweigepflichtsentbindung", v)}
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
          onChange={(e) => update("bemerkung", e.target.value)}
          rows={4}
        />
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
