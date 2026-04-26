"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createWorkshopAction, updateWorkshopAction } from "../actions";
import { WorkshopSchema } from "../schemas";

type WorkshopValue = {
  id?: string;
  name: string;
  description: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: WorkshopValue | null;
};

export function WorkshopFormDialog({ open, onOpenChange, initial }: Props) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {},
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setErrors({});
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = WorkshopSchema.safeParse({
      name,
      description: description || null,
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "name" || path === "description") {
          next[path] = issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (isEdit && initial?.id) {
        await updateWorkshopAction(initial.id, parsed.data);
        toast.success("Workshop aktualisiert.");
      } else {
        await createWorkshopAction(parsed.data);
        toast.success("Workshop angelegt.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Workshop bearbeiten" : "Neuen Workshop anlegen"}
          </DialogTitle>
          <DialogDescription>
            Name und Kurzbeschreibung des Workshops.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <Field>
            <FieldLabel htmlFor="workshop-name">
              <FieldContent>
                <span>Name</span>
              </FieldContent>
            </FieldLabel>
            <Input
              id="workshop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Erste Hilfe Schulung"
              disabled={busy}
              aria-invalid={!!errors.name}
            />
            <FieldError>{errors.name}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="workshop-description">
              <FieldContent>
                <span>Beschreibung</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Optional.
                </span>
              </FieldContent>
            </FieldLabel>
            <Textarea
              id="workshop-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Kurzbeschreibung…"
              disabled={busy}
              aria-invalid={!!errors.description}
            />
            <FieldError>{errors.description}</FieldError>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={busy}
            >
              {busy ? "Wird gespeichert…" : isEdit ? "Speichern" : "Anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
