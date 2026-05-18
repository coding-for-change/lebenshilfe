"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WizardDialog } from "@/components/wizard-dialog";
import { createChildAction } from "../actions";
import {
  CreateChildSchema,
  EMPTY_CHILD_FORM,
  CHILD_STEP_LABELS,
  type CreateChildInput,
  type ChildWizardErrors,
  type ChildWizardFormState,
} from "../schemas";
import { StepBasicInfoChild } from "./steps/step-basic-info";
import { StepAdministrationChild } from "./steps/step-administration";
import { StepOverviewChild } from "./steps/step-overview";
import { pickFirstError, validateWizardStep } from "./wizard-validation";
import type { CostBearerOption } from "@/features/cost-bearers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costBearerOptions: CostBearerOption[];
  onCostBearerCreated: (created: CostBearerOption) => void;
  // Optional: invoked when the user submits via "Anlegen & Zuweisen". Parent
  // is expected to open the detail sheet on the calendar tab so the new
  // child's assignments can be added immediately.
  onSavedOpenCalendar?: (childId: string) => void;
};

type SubmitMode = "close" | "open-calendar" | "create-another";

function buildInput(value: ChildWizardFormState): CreateChildInput {
  return {
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    leosOne: value.leosOne,
    bescheid: value.bescheid.trim() || null,
    sbIb: value.sbIb.trim() || null,
    schweigepflichtsentbindung: value.schweigepflichtsentbindung,
    bemerkung: value.bemerkung.trim() || null,
    kostentraegerId: value.kostentraegerId,
    school: {
      placeId: value.school.placeId,
      name: value.school.name,
      address: value.school.address,
      lat: value.school.lat,
      lng: value.school.lng,
    },
  };
}

export function ChildWizard({
  open,
  onOpenChange,
  costBearerOptions,
  onCostBearerCreated,
  onSavedOpenCalendar,
}: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ChildWizardFormState>(EMPTY_CHILD_FORM);
  const [errors, setErrors] = useState<ChildWizardErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setForm(EMPTY_CHILD_FORM);
  }, [open]);

  const update = (patch: Partial<ChildWizardFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const totalSteps = CHILD_STEP_LABELS.length;

  function handleNext() {
    const e = validateWizardStep(step, form);
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

  async function handleSubmit(mode: SubmitMode) {
    const input = buildInput(form);
    const parse = CreateChildSchema.safeParse(input);
    if (!parse.success) {
      const e = pickFirstError(parse.error.issues);
      setErrors(e);
      const root = parse.error.issues[0]?.path[0];
      if (root === "firstName" || root === "lastName" || root === "school") {
        setStep(0);
      } else setStep(1);
      return;
    }
    setBusy(true);
    try {
      const result = await createChildAction(input);
      toast.success(`${input.firstName} ${input.lastName} hinzugefügt.`);
      if (mode === "open-calendar") {
        onOpenChange(false);
        onSavedOpenCalendar?.(result.child.id);
      } else if (mode === "create-another") {
        // Reset wizard for the next child; keep the dialog open.
        setStep(0);
        setErrors({});
        setForm(EMPTY_CHILD_FORM);
      } else {
        onOpenChange(false);
      }
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
        <StepBasicInfoChild
          value={form}
          onChange={update}
          errors={errors}
        />
      );
    if (step === 1)
      return (
        <StepAdministrationChild
          value={form}
          onChange={update}
          errors={errors}
          costBearerOptions={costBearerOptions}
          onCostBearerCreated={onCostBearerCreated}
        />
      );
    return (
      <StepOverviewChild
        value={form}
        costBearerOptions={costBearerOptions}
      />
    );
  }, [step, form, errors, costBearerOptions, onCostBearerCreated]);

  return (
    <WizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neues Kind anlegen"
      description="Geführte Anlage in drei Schritten."
      steps={totalSteps}
      current={step}
      labels={CHILD_STEP_LABELS}
      busy={busy}
      onSubmit={() => {
        if (step < totalSteps - 1) handleNext();
        else void handleSubmit("close");
      }}
      footer={
        <>
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ButtonGroup>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={busy}
                >
                  {busy ? "Wird gespeichert…" : "Anlegen"}
                </Button>
                <ButtonGroupSeparator className="bg-primary-foreground/20" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      disabled={busy}
                      aria-label="Weitere Optionen"
                      className="px-2"
                    >
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        void handleSubmit("create-another");
                      }}
                    >
                      <Plus />
                      Speichern & neues erstellen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSubmit("open-calendar")}
                disabled={busy}
              >
                Anlegen & Zuweisen
              </Button>
            </div>
          )}
        </>
      }
    >
      {stepBody}
    </WizardDialog>
  );
}
