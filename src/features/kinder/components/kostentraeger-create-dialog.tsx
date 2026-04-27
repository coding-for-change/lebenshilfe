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
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { createKostentraegerAction } from "@/features/kostentraeger/actions";
import { KostentraegerSchema } from "@/features/kostentraeger";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: { id: string; name: string }) => void;
  initialName?: string;
};

export function KostentraegerCreateDialog({
  open,
  onOpenChange,
  onCreated,
  initialName,
}: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function reset() {
    setName(initialName ?? "");
    setEmail("");
    setAddress("");
    setErrors({});
    setBusy(false);
  }

  async function handleSubmit() {
    const parsed = KostentraegerSchema.safeParse({ name, email, address });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string") e[k] = issue.message;
      }
      setErrors(e);
      return;
    }
    setBusy(true);
    try {
      const result = await createKostentraegerAction(parsed.data);
      toast.success(`Kostenträger "${result.kostentraeger.name}" angelegt.`);
      onCreated({
        id: result.kostentraeger.id,
        name: result.kostentraeger.name,
      });
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
          <DialogTitle>Neuen Kostenträger anlegen</DialogTitle>
          <DialogDescription>
            Stammdaten für die spätere Abrechnung.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="kt-name">
              <FieldContent>
                <span>Name</span>
              </FieldContent>
            </FieldLabel>
            <Input
              id="kt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bezirk Oberbayern"
              aria-invalid={!!errors.name}
            />
            <FieldError>{errors.name}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="kt-email">
              <FieldContent>
                <span>E-Mail</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Optional, für spätere Versendung der Historie.
                </span>
              </FieldContent>
            </FieldLabel>
            <Input
              id="kt-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kostenstelle@bezirk.de"
              aria-invalid={!!errors.email}
            />
            <FieldError>{errors.email}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="kt-address">
              <FieldContent>
                <span>Adresse</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Optional.
                </span>
              </FieldContent>
            </FieldLabel>
            <Textarea
              id="kt-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Straße, PLZ Ort"
              aria-invalid={!!errors.address}
            />
            <FieldError>{errors.address}</FieldError>
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
