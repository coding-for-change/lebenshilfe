"use client";

import { useState } from "react";
import { DetailSheet } from "@/components/detail-sheet";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDetailEditor } from "@/components/use-detail-editor";
import { updateWorkshopAction } from "../actions";
import type { UpdateWorkshopInput } from "../schemas";

const FORM_ID = "workshop-detail-form";

type WorkshopValue = {
  id: string;
  name: string;
  description: string | null;
};

type FormState = {
  name: string;
  description: string;
};

function fromWorkshop(w: WorkshopValue): FormState {
  return {
    name: w.name,
    description: w.description ?? "",
  };
}

function diff(base: FormState, next: FormState): UpdateWorkshopInput | null {
  const patch: UpdateWorkshopInput = {};
  if (next.name.trim() !== base.name.trim()) patch.name = next.name.trim();
  const baseDesc = base.description.trim() || null;
  const nextDesc = next.description.trim() || null;
  if (baseDesc !== nextDesc) patch.description = nextDesc;
  return Object.keys(patch).length > 0 ? patch : null;
}

type Props = {
  workshop: WorkshopValue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkshopDetailSheet({ workshop, open, onOpenChange }: Props) {
  const editor = useDetailEditor({
    entity: workshop,
    entityKey: workshop?.id,
    toForm: fromWorkshop,
    diff,
    persist: async (patch) => {
      if (!workshop) return;
      await updateWorkshopAction(workshop.id, patch);
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
        title={workshop?.name ?? ""}
        description="Name und Kurzbeschreibung des Workshops."
        footer={
          workshop ? (
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
        {workshop && editor.form ? (
          <WorkshopFields
            key={workshop.id}
            form={editor.form}
            update={editor.update}
            onSubmit={editor.save}
          />
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

function WorkshopFields({
  form,
  update,
  onSubmit,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      id={FORM_ID}
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field>
        <FieldLabel htmlFor="workshop-det-name">
          <FieldContent>
            <span>Name</span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="workshop-det-name"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="z.B. Erste Hilfe Schulung"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="workshop-det-description">
          <FieldContent>
            <span>Beschreibung</span>
            <span className="text-xs font-normal text-muted-foreground">
              Optional.
            </span>
          </FieldContent>
        </FieldLabel>
        <Textarea
          id="workshop-det-description"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={4}
          placeholder="Kurzbeschreibung…"
        />
      </Field>
    </form>
  );
}
