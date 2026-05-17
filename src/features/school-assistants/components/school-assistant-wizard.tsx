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
import { createSchoolAssistantAction } from "../actions";
import {
  CreateSchulbegleiterSchema,
  BasicInfoStepSchema,
  VertragStepSchema,
  type CreateSchoolAssistantInput,
} from "../schemas";
import { WizardProgress } from "./wizard-progress";
import { StepBasicInfo } from "./steps/step-basic-info";
import { StepContract } from "./steps/step-contract";
import { StepWorkshops } from "./steps/step-workshops";
import { StepOverview } from "./steps/step-overview";
import {
  STEP_LABELS,
  type WizardErrors,
  type WizardFormState,
  type WorkshopOption,
} from "./wizard-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshops: WorkshopOption[];
};

const EMPTY_FORM = (workshops: WorkshopOption[]): WizardFormState => ({
  name: "",
  email: "",
  leosOne: false,
  outlook: false,
  weeklyHours: "",
  zvNeuNachBescheid: false,
  zvNeuNote: "",
  introductionDay: "",
  workshops: workshops.map((w) => ({
    workshopId: w.id,
    selected: false,
    attendedOn: "",
  })),
});

function buildSubmitInput(value: WizardFormState): CreateSchoolAssistantInput {
  const weeklyHours =
    value.weeklyHours.trim() === ""
      ? null
      : Number.parseFloat(value.weeklyHours.replace(",", "."));

  return {
    name: value.name.trim(),
    email: value.email.trim(),
    leosOne: value.leosOne,
    outlook: value.outlook,
    weeklyHours: Number.isFinite(weeklyHours as number)
      ? (weeklyHours as number)
      : null,
    zvNeuNachBescheid: value.zvNeuNachBescheid,
    zvNeuNote: value.zvNeuNachBescheid ? value.zvNeuNote.trim() || null : null,
    introductionDay: value.introductionDay || null,
    workshops: value.workshops
      .filter((w) => w.selected)
      .map((w) => ({ workshopId: w.workshopId, attendedOn: w.attendedOn })),
  };
}

export function SchoolAssistantWizard({
  open,
  onOpenChange,
  workshops,
}: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormState>(() =>
    EMPTY_FORM(workshops),
  );
  const [errors, setErrors] = useState<WizardErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setForm(EMPTY_FORM(workshops));
  }, [open, workshops]);

  const update = (patch: Partial<WizardFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const totalSteps = STEP_LABELS.length;

  const validateStep = (current: number): WizardErrors | null => {
    if (current === 0) {
      const result = BasicInfoStepSchema.safeParse({
        name: form.name,
        email: form.email,
      });
      if (!result.success) {
        const e: WizardErrors = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0];
          if (typeof path === "string" && path !== "workshops") {
            (e as Record<string, string>)[path] = issue.message;
          }
        }
        return e;
      }
    }

    if (current === 1) {
      const submit = buildSubmitInput(form);
      const result = VertragStepSchema.safeParse({
        leosOne: submit.leosOne,
        outlook: submit.outlook,
        weeklyHours: submit.weeklyHours ?? undefined,
        zvNeuNachBescheid: submit.zvNeuNachBescheid,
        zvNeuNote: submit.zvNeuNote ?? undefined,
        introductionDay: submit.introductionDay ?? undefined,
      });
      if (!result.success) {
        const e: WizardErrors = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0];
          if (typeof path === "string" && path !== "workshops") {
            (e as Record<string, string>)[path] = issue.message;
          }
        }
        return e;
      }
    }

    if (current === 2) {
      const e: WizardErrors = { workshops: {} };
      for (const row of form.workshops) {
        if (row.selected && !row.attendedOn) {
          e.workshops![row.workshopId] = "Datum erforderlich.";
        }
      }
      if (Object.keys(e.workshops!).length > 0) return e;
    }

    return null;
  };

  function handleNext() {
    const stepErrors = validateStep(step);
    if (stepErrors) {
      setErrors(stepErrors);
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
    const stepErrors = validateStep(2);
    if (stepErrors) {
      setErrors(stepErrors);
      setStep(2);
      return;
    }

    const submitInput = buildSubmitInput(form);
    const fullParse = CreateSchulbegleiterSchema.safeParse(submitInput);
    if (!fullParse.success) {
      const e: WizardErrors = {};
      for (const issue of fullParse.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && path !== "workshops") {
          (e as Record<string, string>)[path] = issue.message;
        }
      }
      setErrors(e);
      const firstPath = fullParse.error.issues[0]?.path[0];
      if (firstPath === "name" || firstPath === "email") setStep(0);
      else setStep(1);
      return;
    }

    setBusy(true);
    try {
      await createSchoolAssistantAction(submitInput);
      toast.success("Einladung gesendet.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  const stepBody = useMemo(() => {
    if (step === 0)
      return (
        <StepBasicInfo
          value={form}
          onChange={update}
          errors={errors}
        />
      );
    if (step === 1)
      return (
        <StepContract
          value={form}
          onChange={update}
          errors={errors}
        />
      );
    if (step === 2)
      return (
        <StepWorkshops
          value={form}
          onChange={update}
          errors={errors}
          workshops={workshops}
        />
      );
    return (
      <StepOverview
        value={form}
        workshops={workshops}
      />
    );
  }, [step, form, errors, workshops]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuen Schulbegleiter anlegen</DialogTitle>
          <DialogDescription>
            Geführte Anlage in vier Schritten — am Ende wird die Einladung
            verschickt.
          </DialogDescription>
          <div className="pt-2">
            <WizardProgress
              steps={totalSteps}
              current={step}
              labels={[...STEP_LABELS]}
            />
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            if (step < totalSteps - 1) handleNext();
            else void handleSubmit();
          }}
          className="contents"
        >
          <div className="-mx-1 max-h-[60vh] overflow-y-auto px-3 py-1">
            {stepBody}
          </div>

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
                type="submit"
                disabled={busy}
              >
                Weiter
              </Button>
            ) : (
              <Button
                type="submit"
                loading={busy}
                disabled={busy}
              >
                {busy ? "Wird gespeichert…" : "Einladung senden"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
