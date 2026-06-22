"use client";

import { useState } from "react";
import { DetailSheet } from "@/components/detail-sheet";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { useDetailEditor } from "@/components/use-detail-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import {
  HolidayPlanSelect,
  type HolidayPlanOption,
  type SerializedHolidayPlan,
} from "@/features/holiday-plans";
import { updateSchoolAction } from "../actions";
import type { UpdateSchoolInput } from "../schemas";
import type { SerializedSchool } from "../serialize";
import { SchoolAutocomplete, type SchoolValue } from "./school-autocomplete";
import { SchoolPreview } from "./school-preview";

const FORM_ID = "school-detail-form";

type GeneralForm = {
  name: string;
  school: SchoolValue;
  holidayPlanId: string | null;
};

function fromSchool(s: SerializedSchool): GeneralForm {
  return {
    name: s.name,
    school: {
      placeId: s.placeId,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
    },
    holidayPlanId: s.holidayPlan?.id ?? null,
  };
}

function diff(base: GeneralForm, next: GeneralForm): UpdateSchoolInput | null {
  const patch: UpdateSchoolInput = {};
  if (next.name !== base.name) patch.name = next.name;
  if (next.school.address !== base.school.address) {
    patch.address = next.school.address;
  }
  if (next.school.placeId !== base.school.placeId) {
    patch.placeId = next.school.placeId;
  }
  if (next.school.lat !== base.school.lat) patch.lat = next.school.lat;
  if (next.school.lng !== base.school.lng) patch.lng = next.school.lng;
  if (next.holidayPlanId !== base.holidayPlanId) {
    patch.holidayPlanId = next.holidayPlanId;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

type Props = {
  school: SerializedSchool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holidayPlanOptions: HolidayPlanOption[];
  holidayPlans: SerializedHolidayPlan[];
  onHolidayPlanCreated: (created: HolidayPlanOption) => void;
};

export function SchoolDetailSheet({
  school,
  open,
  onOpenChange,
  holidayPlanOptions,
  holidayPlans,
  onHolidayPlanCreated,
}: Props) {
  const editor = useDetailEditor({
    entity: school,
    entityKey: school?.id,
    toForm: fromSchool,
    diff,
    persist: async (patch) => {
      if (!school) return;
      await updateSchoolAction(school.id, patch);
    },
  });
  const [askSave, setAskSave] = useState(false);

  function requestClose() {
    if (editor.dirty) setAskSave(true);
    else onOpenChange(false);
  }

  return (
    <>
      <DetailSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
        title={school?.name ?? ""}
        description={
          school
            ? `${school.address ?? "Keine Adresse"} · ${school.childrenCount} ${
                school.childrenCount === 1 ? "Kind" : "Kinder"
              }`
            : null
        }
        footer={
          school ? (
            <Button
              type="submit"
              form={FORM_ID}
              disabled={!editor.dirty || editor.saving}
            >
              {editor.saving ? "Speichern…" : "Speichern"}
            </Button>
          ) : null
        }
      >
        {school && editor.form ? (
          <div className="flex flex-col gap-6">
            <form
              id={FORM_ID}
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                editor.save();
              }}
            >
              <Field>
                <FieldLabel htmlFor="school-det-name">
                  <FieldContent>
                    <span>Name</span>
                  </FieldContent>
                </FieldLabel>
                <Input
                  id="school-det-name"
                  value={editor.form.name}
                  onChange={(e) => editor.update({ name: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="school-det-address">
                  <FieldContent>
                    <span>Adresse / Standort</span>
                  </FieldContent>
                </FieldLabel>
                <SchoolAutocomplete
                  id="school-det-address"
                  value={editor.form.school}
                  onChange={(next) => editor.update({ school: next })}
                />
                <SchoolPreview
                  placeId={editor.form.school.placeId}
                  address={editor.form.school.address}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="school-det-plan">
                  <FieldContent>
                    <span>Ferienplan</span>
                  </FieldContent>
                </FieldLabel>
                <HolidayPlanSelect
                  id="school-det-plan"
                  options={holidayPlanOptions}
                  value={editor.form.holidayPlanId}
                  onChange={(id) => editor.update({ holidayPlanId: id })}
                  onCreated={onHolidayPlanCreated}
                />
              </Field>
            </form>

            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium">Ferien laut Plan</h4>
              {(() => {
                // Follow the live dropdown selection, not the saved value, so
                // the preview updates immediately when the plan is changed.
                const selectedPlan =
                  holidayPlans.find(
                    (p) => p.id === editor.form?.holidayPlanId,
                  ) ?? null;
                if (!selectedPlan) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Kein Ferienplan zugewiesen.
                    </p>
                  );
                }
                if (selectedPlan.holidays.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Der Plan „{selectedPlan.name}“ enthält noch keine Ferien.
                    </p>
                  );
                }
                return (
                  <ul className="flex flex-col gap-1 text-sm">
                    {selectedPlan.holidays.map((h) => (
                      <li
                        key={h.id}
                        className="flex justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <span>{h.name ?? "Ferien"}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatDate(h.startDate)} – {formatDate(h.endDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                Ferienzeiträume werden im Bereich „Ferien“ je Plan gepflegt.
              </p>
            </div>
          </div>
        ) : null}
      </DetailSheet>

      <UnsavedChangesDialog
        open={askSave}
        onOpenChange={setAskSave}
        onSave={async () => {
          if (await editor.save()) {
            setAskSave(false);
            onOpenChange(false);
          }
        }}
        onDiscard={() => {
          setAskSave(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
