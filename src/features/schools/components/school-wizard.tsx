"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { WizardDialog } from "@/components/wizard-dialog";
import {
  HolidayPlanSelect,
  type HolidayPlanOption,
} from "@/features/holiday-plans";
import { createSchoolAction } from "../actions";
import { CreateSchoolSchema, SCHOOL_STEP_LABELS } from "../schemas";
import { SchoolAutocomplete, type SchoolValue } from "./school-autocomplete";
import { SchoolPreview } from "./school-preview";

type FormState = {
  school: SchoolValue;
  name: string;
  holidayPlanId: string | null;
};

const EMPTY_SCHOOL: SchoolValue = {
  placeId: null,
  name: null,
  address: null,
  lat: null,
  lng: null,
};

const EMPTY_FORM: FormState = {
  school: EMPTY_SCHOOL,
  name: "",
  holidayPlanId: null,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holidayPlanOptions: HolidayPlanOption[];
  onHolidayPlanCreated: (created: HolidayPlanOption) => void;
  onCreated?: (created: { id: string; name: string }) => void;
};

export function SchoolWizard({
  open,
  onOpenChange,
  holidayPlanOptions,
  onHolidayPlanCreated,
  onCreated,
}: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [nameError, setNameError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setNameError(undefined);
    setForm(EMPTY_FORM);
  }, [open]);

  const totalSteps = SCHOOL_STEP_LABELS.length;
  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  function handleNext() {
    if (step === 0 && !form.name.trim()) {
      setNameError("Schulname fehlt.");
      return;
    }
    setNameError(undefined);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    setNameError(undefined);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const input = {
      name: form.name.trim(),
      address: form.school.address,
      placeId: form.school.placeId,
      lat: form.school.lat,
      lng: form.school.lng,
      holidayPlanId: form.holidayPlanId,
    };
    const parsed = CreateSchoolSchema.safeParse(input);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Eingabe ungültig.");
      setStep(0);
      return;
    }
    setBusy(true);
    try {
      const result = await createSchoolAction(parsed.data);
      toast.success(`Schule "${result.school.name}" angelegt.`);
      onCreated?.(result.school);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  const body = useMemo(() => {
    if (step === 0) {
      return (
        <StammdatenStep
          form={form}
          update={update}
          nameError={nameError}
          holidayPlanOptions={holidayPlanOptions}
          onHolidayPlanCreated={onHolidayPlanCreated}
        />
      );
    }
    return (
      <OverviewStep
        form={form}
        holidayPlanOptions={holidayPlanOptions}
      />
    );
  }, [step, form, nameError, holidayPlanOptions, onHolidayPlanCreated]);

  return (
    <WizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neue Schule anlegen"
      description="Stammdaten und Ferienplan in zwei Schritten."
      steps={totalSteps}
      current={step}
      labels={SCHOOL_STEP_LABELS}
      busy={busy}
      onSubmit={() => {
        if (step < totalSteps - 1) handleNext();
        else void handleSubmit();
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
            <Button
              type="submit"
              loading={busy}
              disabled={busy}
            >
              {busy ? "Wird gespeichert…" : "Anlegen"}
            </Button>
          )}
        </>
      }
    >
      {body}
    </WizardDialog>
  );
}

function StammdatenStep({
  form,
  update,
  nameError,
  holidayPlanOptions,
  onHolidayPlanCreated,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  nameError?: string;
  holidayPlanOptions: HolidayPlanOption[];
  onHolidayPlanCreated: (created: HolidayPlanOption) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="school-search">
          <FieldContent>
            <span>Schule suchen</span>
            <span className="text-xs font-normal text-muted-foreground">
              Per Google Maps. Übernimmt Name, Adresse und Koordinaten.
            </span>
          </FieldContent>
        </FieldLabel>
        <SchoolAutocomplete
          id="school-search"
          value={form.school}
          onChange={(next) =>
            update({
              school: next,
              name: form.name.trim() ? form.name : (next.name ?? ""),
            })
          }
        />
        <SchoolPreview
          placeId={form.school.placeId}
          address={form.school.address}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="school-name">
          <FieldContent>
            <span>Name</span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="school-name"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="z.B. Europaschule München"
          aria-invalid={!!nameError}
        />
        <FieldError>{nameError}</FieldError>
      </Field>

      {form.school.address ? (
        <Field>
          <FieldLabel htmlFor="school-address">
            <FieldContent>
              <span>Adresse</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="school-address"
            value={form.school.address}
            onChange={(e) =>
              update({ school: { ...form.school, address: e.target.value } })
            }
          />
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor="school-plan">
          <FieldContent>
            <span>Ferienplan</span>
            <span className="text-xs font-normal text-muted-foreground">
              Optional. Bestehenden Plan wählen oder neu anlegen.
            </span>
          </FieldContent>
        </FieldLabel>
        <HolidayPlanSelect
          id="school-plan"
          options={holidayPlanOptions}
          value={form.holidayPlanId}
          onChange={(id) => update({ holidayPlanId: id })}
          onCreated={onHolidayPlanCreated}
        />
      </Field>
    </div>
  );
}

function OverviewStep({
  form,
  holidayPlanOptions,
}: {
  form: FormState;
  holidayPlanOptions: HolidayPlanOption[];
}) {
  const plan = holidayPlanOptions.find((o) => o.id === form.holidayPlanId);
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 text-sm font-medium">Stammdaten</h4>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-[max-content_1fr] sm:gap-x-4">
          <dt className="text-xs text-muted-foreground">Name</dt>
          <dd>{form.name.trim() || "—"}</dd>
          <dt className="text-xs text-muted-foreground">Adresse</dt>
          <dd>{form.school.address ?? "—"}</dd>
          <dt className="text-xs text-muted-foreground">Ferienplan</dt>
          <dd>{plan?.name ?? "—"}</dd>
        </dl>
      </div>
    </div>
  );
}
