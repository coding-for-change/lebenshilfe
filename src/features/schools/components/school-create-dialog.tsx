"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { createSchoolAction } from "../actions";
import { CreateSchoolSchema } from "../schemas";
import { SchoolAutocomplete, type SchoolValue } from "./school-autocomplete";
import { SchoolPreview } from "./school-preview";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: { id: string; name: string }) => void;
  initialName?: string;
};

const EMPTY: SchoolValue = {
  placeId: null,
  name: null,
  address: null,
  lat: null,
  lng: null,
};

export function SchoolCreateDialog({
  open,
  onOpenChange,
  onCreated,
  initialName,
}: Props) {
  const [school, setSchool] = useState<SchoolValue>(EMPTY);
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  function reset() {
    setSchool(EMPTY);
    setName(initialName ?? "");
    setError(undefined);
    setBusy(false);
  }

  async function handleSubmit() {
    const parsed = CreateSchoolSchema.safeParse({
      name: name.trim(),
      address: school.address,
      placeId: school.placeId,
      lat: school.lat,
      lng: school.lng,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Eingabe ungültig.");
      return;
    }
    setBusy(true);
    try {
      const result = await createSchoolAction(parsed.data);
      toast.success(`Schule "${result.school.name}" angelegt.`);
      onCreated(result.school);
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Schule anlegen</DialogTitle>
          <DialogDescription>
            Suche per Google Maps oder Name manuell eintragen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="school-create-search">
              <FieldContent>
                <span>Schule suchen</span>
              </FieldContent>
            </FieldLabel>
            <SchoolAutocomplete
              id="school-create-search"
              value={school}
              onChange={(next) => {
                setSchool(next);
                if (!name.trim() && next.name) setName(next.name);
              }}
            />
            <SchoolPreview
              placeId={school.placeId}
              address={school.address}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="school-create-name">
              <FieldContent>
                <span>Name</span>
              </FieldContent>
            </FieldLabel>
            <Input
              id="school-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Europaschule München"
              aria-invalid={!!error}
            />
            <FieldError>{error}</FieldError>
          </Field>
        </div>

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
            type="button"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Speichert…" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
