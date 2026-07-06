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
import { SchoolSelect, type SchoolOption } from "@/features/schools";
import {
  CostBearerCombobox,
  type CostBearerOption,
} from "@/features/cost-bearers";
import {
  createPoolAction,
  setPoolAssistantsAction,
  setPoolChildrenAction,
} from "../actions";
import { CreatePoolSchema } from "../schemas";
import { MemberTable } from "./member-table";
import { SchoolMismatchWarning } from "./school-mismatch-warning";
import type { PoolAssistantOption, PoolChildOption } from "./types";

const STEP_LABELS = ["Stammdaten", "Kinder", "Schulbegleiter", "Übersicht"];

type FormState = {
  name: string;
  schoolId: string | null;
  kostentraegerId: string | null;
  childIds: string[];
  assistantIds: string[];
};

const EMPTY: FormState = {
  name: "",
  schoolId: null,
  kostentraegerId: null,
  childIds: [],
  assistantIds: [],
};

type Errors = { name?: string; schoolId?: string; kostentraegerId?: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolOptions: SchoolOption[];
  costBearerOptions: CostBearerOption[];
  childOptions: PoolChildOption[];
  assistantOptions: PoolAssistantOption[];
  onSchoolCreated: (created: SchoolOption) => void;
  onCostBearerCreated: (created: CostBearerOption) => void;
};

export function PoolWizard({
  open,
  onOpenChange,
  schoolOptions,
  costBearerOptions,
  childOptions,
  assistantOptions,
  onSchoolCreated,
  onCostBearerCreated,
}: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setForm(EMPTY);
  }, [open]);

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const addMember = (key: "childIds" | "assistantIds", id: string) =>
    setForm((prev) =>
      prev[key].includes(id) ? prev : { ...prev, [key]: [...prev[key], id] },
    );
  const removeMember = (key: "childIds" | "assistantIds", id: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((x) => x !== id),
    }));

  const totalSteps = STEP_LABELS.length;

  const mismatchedNames = useMemo(() => {
    if (!form.schoolId) return [];
    return childOptions
      .filter(
        (c) =>
          form.childIds.includes(c.id) &&
          c.schoolId != null &&
          c.schoolId !== form.schoolId,
      )
      .map((c) => `${c.firstName} ${c.lastName}`);
  }, [childOptions, form.childIds, form.schoolId]);

  function validateStammdaten(): boolean {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Name fehlt.";
    if (!form.schoolId) next.schoolId = "Schule fehlt.";
    if (!form.kostentraegerId) next.kostentraegerId = "Kostenträger fehlt.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStammdaten()) return;
    setErrors({});
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  async function handleSubmit() {
    const parsed = CreatePoolSchema.safeParse({
      name: form.name.trim(),
      schoolId: form.schoolId,
      kostentraegerId: form.kostentraegerId,
    });
    if (!parsed.success) {
      validateStammdaten();
      setStep(0);
      return;
    }
    setBusy(true);
    try {
      const { pool } = await createPoolAction(parsed.data);
      if (form.childIds.length > 0) {
        await setPoolChildrenAction({
          poolId: pool.id,
          childIds: form.childIds,
        });
      }
      if (form.assistantIds.length > 0) {
        await setPoolAssistantsAction({
          poolId: pool.id,
          profileIds: form.assistantIds,
        });
      }
      toast.success(`Pool „${parsed.data.name}" angelegt.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  const childMembers = useMemo(
    () =>
      childOptions.map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
        warn:
          form.schoolId != null &&
          c.schoolId != null &&
          c.schoolId !== form.schoolId,
        hint:
          form.schoolId != null &&
          c.schoolId != null &&
          c.schoolId !== form.schoolId
            ? "Andere Schule"
            : undefined,
      })),
    [childOptions, form.schoolId],
  );

  const assistantMembers = useMemo(
    () =>
      assistantOptions.map((a) => ({
        id: a.id,
        label: a.name,
        hint: a.email,
      })),
    [assistantOptions],
  );

  const body = (() => {
    if (step === 0)
      return (
        <div className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="pool-name">
              <FieldContent>
                <span>Name</span>
              </FieldContent>
            </FieldLabel>
            <Input
              id="pool-name"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="z. B. Grundschule Nord – Pool A"
              aria-invalid={!!errors.name}
            />
            <FieldError>{errors.name}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="pool-school">
              <FieldContent>
                <span>Schule</span>
              </FieldContent>
            </FieldLabel>
            <SchoolSelect
              id="pool-school"
              options={schoolOptions}
              value={form.schoolId}
              onChange={(id) => update({ schoolId: id })}
              onCreated={onSchoolCreated}
              ariaInvalid={!!errors.schoolId}
            />
            <FieldError>{errors.schoolId}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="pool-kostentraeger">
              <FieldContent>
                <span>Kostenträger</span>
              </FieldContent>
            </FieldLabel>
            <CostBearerCombobox
              id="pool-kostentraeger"
              options={costBearerOptions}
              value={form.kostentraegerId}
              onChange={(id) => update({ kostentraegerId: id })}
              onCreated={onCostBearerCreated}
              ariaInvalid={!!errors.kostentraegerId}
            />
            <FieldError>{errors.kostentraegerId}</FieldError>
          </Field>
        </div>
      );
    if (step === 1)
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Kinder zuweisen (optional – kann übersprungen werden).
          </p>
          <SchoolMismatchWarning names={mismatchedNames} />
          <MemberTable
            title="Kinder"
            options={childMembers}
            selectedIds={form.childIds}
            onAdd={(id) => addMember("childIds", id)}
            onRemove={(id) => removeMember("childIds", id)}
            addLabel="Kind"
            emptyText="Noch keine Kinder zugewiesen."
            searchPlaceholder="Kind suchen…"
          />
        </div>
      );
    if (step === 2)
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Schulbegleiter zuweisen (optional – kann übersprungen werden).
          </p>
          <MemberTable
            title="Schulbegleiter"
            options={assistantMembers}
            selectedIds={form.assistantIds}
            onAdd={(id) => addMember("assistantIds", id)}
            onRemove={(id) => removeMember("assistantIds", id)}
            addLabel="Schulbegleiter"
            emptyText="Noch keine Schulbegleiter zugewiesen."
            searchPlaceholder="Schulbegleiter suchen…"
          />
        </div>
      );
    return (
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{form.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Schule</dt>
          <dd className="font-medium">
            {schoolOptions.find((s) => s.id === form.schoolId)?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kostenträger</dt>
          <dd className="font-medium">
            {costBearerOptions.find((k) => k.id === form.kostentraegerId)
              ?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kinder / Schulbegleiter</dt>
          <dd className="font-medium">
            {form.childIds.length} / {form.assistantIds.length}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <SchoolMismatchWarning names={mismatchedNames} />
        </div>
      </dl>
    );
  })();

  const optionalStep = step === 1 || step === 2;

  return (
    <WizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neuen Pool anlegen"
      description="Geführte Anlage in vier Schritten."
      steps={totalSteps}
      current={step}
      labels={STEP_LABELS}
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
            onClick={
              step === 0
                ? () => onOpenChange(false)
                : () => setStep((s) => Math.max(s - 1, 0))
            }
            disabled={busy}
          >
            {step === 0 ? "Abbrechen" : "Zurück"}
          </Button>
          <div className="flex items-center gap-2">
            {optionalStep ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
                disabled={busy}
              >
                Überspringen
              </Button>
            ) : null}
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
          </div>
        </>
      }
    >
      {body}
    </WizardDialog>
  );
}
