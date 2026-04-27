"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createKindAction } from "../actions";
import {
  CreateKindSchema,
  StammdatenStepSchema,
  VerwaltungStepSchema,
  type CreateKindInput,
} from "../schemas";
import { KindWizardProgress } from "./wizard-progress";
import { StepStammdatenKind } from "./steps/step-stammdaten";
import { StepVerwaltungKind } from "./steps/step-verwaltung";
import { StepUebersichtKind } from "./steps/step-uebersicht";
import {
  EMPTY_KIND_FORM,
  KIND_STEP_LABELS,
  type KindWizardErrors,
  type KindWizardFormState,
} from "./wizard-types";
import type { KostentraegerOption } from "./kostentraeger-combobox";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kostentraegerOptions: KostentraegerOption[];
  onKostentraegerCreated: (created: KostentraegerOption) => void;
};

function buildInput(value: KindWizardFormState): CreateKindInput {
  return {
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    leosOne: value.leosOne,
    bescheid: value.bescheid.trim() || null,
    sbIb: value.sbIb.trim() || null,
    schweigepflichtsentbindung: value.schweigepflichtsentbindung,
    bemerkung: value.bemerkung.trim() || null,
    kostentraegerId: value.kostentraegerId,
    schule: {
      placeId: value.schule.placeId,
      name: value.schule.name,
      address: value.schule.address,
      lat: value.schule.lat,
      lng: value.schule.lng,
    },
  };
}

function pickFirstError(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): KindWizardErrors {
  const e: KindWizardErrors = {};
  for (const issue of issues) {
    const root = issue.path[0];
    if (root === "schule") e.schule = issue.message;
    else if (typeof root === "string" && root in EMPTY_KIND_FORM) {
      (e as Record<string, string>)[root] = issue.message;
    }
  }
  return e;
}

export function KinderWizard({
  open,
  onOpenChange,
  kostentraegerOptions,
  onKostentraegerCreated,
}: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<KindWizardFormState>(EMPTY_KIND_FORM);
  const [errors, setErrors] = useState<KindWizardErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setForm(EMPTY_KIND_FORM);
  }, [open]);

  const update = (patch: Partial<KindWizardFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const totalSteps = KIND_STEP_LABELS.length;

  function validateStep(current: number): KindWizardErrors | null {
    if (current === 0) {
      const result = StammdatenStepSchema.safeParse({
        firstName: form.firstName,
        lastName: form.lastName,
        schule: form.schule,
      });
      if (!result.success) return pickFirstError(result.error.issues);
    }
    if (current === 1) {
      const result = VerwaltungStepSchema.safeParse({
        leosOne: form.leosOne,
        bescheid: form.bescheid || null,
        sbIb: form.sbIb || null,
        schweigepflichtsentbindung: form.schweigepflichtsentbindung,
        bemerkung: form.bemerkung || null,
        kostentraegerId: form.kostentraegerId,
      });
      if (!result.success) return pickFirstError(result.error.issues);
    }
    return null;
  }

  function handleNext() {
    const e = validateStep(step);
    if (e) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const input = buildInput(form);
    const parse = CreateKindSchema.safeParse(input);
    if (!parse.success) {
      const e = pickFirstError(parse.error.issues);
      setErrors(e);
      const root = parse.error.issues[0]?.path[0];
      if (root === "firstName" || root === "lastName" || root === "schule") {
        setStep(0);
      } else setStep(1);
      return;
    }
    setBusy(true);
    try {
      await createKindAction(input);
      toast.success(`${input.firstName} ${input.lastName} hinzugefügt.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  const stepBody = useMemo(() => {
    if (step === 0)
      return (
        <StepStammdatenKind
          value={form}
          onChange={update}
          errors={errors}
        />
      );
    if (step === 1)
      return (
        <StepVerwaltungKind
          value={form}
          onChange={update}
          errors={errors}
          kostentraegerOptions={kostentraegerOptions}
          onKostentraegerCreated={onKostentraegerCreated}
        />
      );
    return (
      <StepUebersichtKind
        value={form}
        kostentraegerOptions={kostentraegerOptions}
      />
    );
  }, [step, form, errors, kostentraegerOptions, onKostentraegerCreated]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neues Kind anlegen</DialogTitle>
          <DialogDescription>
            Geführte Anlage in drei Schritten.
          </DialogDescription>
          <div className="pt-2">
            <KindWizardProgress
              steps={totalSteps}
              current={step}
              labels={[...KIND_STEP_LABELS]}
            />
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-1">{stepBody}</div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={step === 0 ? () => onOpenChange(false) : handleBack}
            disabled={busy}
          >
            {step === 0 ? "Abbrechen" : "Zurück"}
          </Button>
          {step < totalSteps - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={busy}
            >
              Weiter
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
            >
              {busy ? "Wird gespeichert…" : "Anlegen"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
