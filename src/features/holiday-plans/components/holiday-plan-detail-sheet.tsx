"use client";

import { useState } from "react";
import { DetailSheet } from "@/components/detail-sheet";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { useDetailEditor } from "@/components/use-detail-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateHolidayPlanAction } from "../actions";
import type { UpdateHolidayPlanInput } from "../schemas";
import type { SerializedHolidayPlan } from "../serialize";
import { HolidayEntryEditor } from "./holiday-entry-editor";

const FORM_ID = "holiday-plan-detail-form";

type GeneralForm = { name: string };

function fromPlan(p: SerializedHolidayPlan): GeneralForm {
  return { name: p.name };
}

function diff(
  base: GeneralForm,
  next: GeneralForm,
): UpdateHolidayPlanInput | null {
  if (next.name !== base.name) return { name: next.name };
  return null;
}

type Props = {
  plan: SerializedHolidayPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HolidayPlanDetailSheet({ plan, open, onOpenChange }: Props) {
  const editor = useDetailEditor({
    entity: plan,
    entityKey: plan?.id,
    toForm: fromPlan,
    diff,
    persist: async (patch) => {
      if (!plan) return;
      await updateHolidayPlanAction(plan.id, patch);
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
        title={plan?.name ?? ""}
        description={
          plan
            ? `${plan.schoolCount} ${
                plan.schoolCount === 1 ? "Schule" : "Schulen"
              } · ${plan.holidays.length} ${
                plan.holidays.length === 1 ? "Zeitraum" : "Zeiträume"
              }`
            : null
        }
        footer={
          plan ? (
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
        {plan && editor.form ? (
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
                <FieldLabel htmlFor="plan-det-name">
                  <FieldContent>
                    <span>Name</span>
                  </FieldContent>
                </FieldLabel>
                <Input
                  id="plan-det-name"
                  value={editor.form.name}
                  onChange={(e) => editor.update({ name: e.target.value })}
                />
              </Field>
            </form>

            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium">Ferienzeiträume</h4>
              <p className="text-xs text-muted-foreground">
                Gelten für alle Schulen mit diesem Plan. Änderungen werden
                sofort gespeichert.
              </p>
              <HolidayEntryEditor
                key={plan.id}
                planId={plan.id}
                entries={plan.holidays}
              />
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
