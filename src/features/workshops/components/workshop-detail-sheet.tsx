"use client";

import { DetailSheet } from "@/components/detail-sheet";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/components/use-autosave";
import { updateWorkshopAction } from "../actions";
import type { UpdateWorkshopInput } from "../schemas";

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
  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={workshop?.name ?? ""}
      description="Name und Kurzbeschreibung des Workshops."
    >
      {workshop ? (
        <DetailBody
          key={workshop.id}
          workshop={workshop}
        />
      ) : null}
    </DetailSheet>
  );
}

function DetailBody({ workshop }: { workshop: WorkshopValue }) {
  const { form, update } = useAutosave({
    entity: workshop,
    entityKey: workshop.id,
    toForm: fromWorkshop,
    diff,
    persist: async (patch) => {
      await updateWorkshopAction(workshop.id, patch);
    },
  });

  return (
    <div className="flex flex-col gap-5">
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
    </div>
  );
}
