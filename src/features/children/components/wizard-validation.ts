import {
  EMPTY_CHILD_FORM,
  BasicInfoStepSchema,
  AdministrationStepSchema,
  type ChildWizardErrors,
  type ChildWizardFormState,
} from "../schemas";

type ZodIssueLike = { path: ReadonlyArray<PropertyKey>; message: string };

export function pickFirstError(
  issues: ReadonlyArray<ZodIssueLike>,
): ChildWizardErrors {
  const e: ChildWizardErrors = {};
  for (const issue of issues) {
    const root = issue.path[0];
    if (typeof root === "string" && root in EMPTY_CHILD_FORM) {
      (e as Record<string, string>)[root] = issue.message;
    }
  }
  return e;
}

export function validateWizardStep(
  current: number,
  form: ChildWizardFormState,
): ChildWizardErrors | null {
  if (current === 0) {
    const result = BasicInfoStepSchema.safeParse({
      firstName: form.firstName,
      lastName: form.lastName,
    });
    if (!result.success) return pickFirstError(result.error.issues);
  }
  if (current === 1) {
    const result = AdministrationStepSchema.safeParse({
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
