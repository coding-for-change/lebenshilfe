import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Ungültige Uhrzeit (HH:MM).");

const optionalText = (max: number) =>
  z
    .string()
    .max(max, "Eingabe ist zu lang.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const SchoolSchema = z
  .object({
    placeId: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    const anySet = !!(
      val.placeId ||
      val.name ||
      val.address ||
      val.lat ||
      val.lng
    );
    if (anySet) {
      if (!val.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Schulname fehlt.",
        });
      }
      if (!val.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Schuladresse fehlt.",
        });
      }
    }
  });

export type SchoolInput = z.infer<typeof SchoolSchema>;

// Canonical child fields — WITHOUT `.default()`. Defaults survive `.partial()`
// in Zod, so keeping them here would let a partial update overwrite untouched
// boolean columns. Defaults live only on the create-specific schema below.
const kindFieldsSchema = z.object({
  leosOne: z.boolean(),
  bescheid: optionalText(5000),
  sbIb: optionalText(200),
  schweigepflichtsentbindung: z.boolean(),
  bemerkung: optionalText(5000),
  // No trailing `.transform()`: a transform placed after `.optional()` runs
  // on the `undefined` of an absent field and would coerce it to `null`,
  // clearing the Kostenträger on every partial update. `childFieldsFromCreate`
  // already maps a missing value to `null` for the create path.
  kostentraegerId: z.string().min(1).nullable().optional(),
  school: SchoolSchema.optional(),
});

// Create accepts omitted booleans by falling back to defaults.
const kindFieldsCreateSchema = kindFieldsSchema.extend({
  leosOne: z.boolean().default(false),
  schweigepflichtsentbindung: z.boolean().default(false),
});

const stammdatenSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname fehlt.").max(100),
  lastName: z.string().trim().min(1, "Nachname fehlt.").max(100),
});

export const BasicInfoStepSchema = stammdatenSchema.merge(
  z.object({ school: SchoolSchema.optional() }),
);

export const AdministrationStepSchema = kindFieldsCreateSchema.pick({
  leosOne: true,
  bescheid: true,
  sbIb: true,
  schweigepflichtsentbindung: true,
  bemerkung: true,
  kostentraegerId: true,
});

export const CreateChildSchema = stammdatenSchema.merge(kindFieldsCreateSchema);
export type CreateChildInput = z.infer<typeof CreateChildSchema>;

export const UpdateChildSchema = stammdatenSchema
  .partial()
  .merge(kindFieldsSchema.partial());
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;

export const AssignmentSchema = z.object({
  childId: z.string().min(1),
  userId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
  tandem: z.boolean().default(false),
});
export type AssignmentInput = z.infer<typeof AssignmentSchema>;

export const ScheduleSchema = z.object({
  childId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
});
export type ScheduleInput = z.infer<typeof ScheduleSchema>;

export const AbsenceSchema = z.object({
  childId: z.string().min(1),
  date: dateString,
  note: optionalText(2000),
});
export type AbsenceInput = z.infer<typeof AbsenceSchema>;

export const VertretungSchema = z.object({
  childId: z.string().min(1),
  substituteUserId: z.string().min(1),
  date: dateString,
  // startTime / endTime are NOT provided by the caller — they are copied
  // directly from the ChildAssignment rows for that child+weekday.
});
export type VertretungInput = z.infer<typeof VertretungSchema>;

export const UpdateVertretungSchema = z.object({
  // Only the substitute can be changed; times always mirror the Zuweisung.
  substituteUserId: z.string().min(1),
});
export type UpdateVertretungInput = z.infer<typeof UpdateVertretungSchema>;

// Result of fuzzy-matching a free-text child name against the roster. Used by
// the Vertretung-Request flow (COD-51). `suggestedChildId` is only set when the
// best candidate clears the confidence threshold and is unambiguous; the full
// `candidates` list is for the admin queue only and never reaches a companion.
export type ChildMatchCandidate = {
  childId: string;
  firstName: string;
  lastName: string;
  score: number;
};

export type ChildMatchResult = {
  suggestedChildId: string | null;
  matchScore: number | null;
  candidates: ChildMatchCandidate[];
};

// A WORK event created on behalf of a Schulbegleiter that carries their
// existing signature (captured when they reported the Vertretung). Distinct
// from WorkEventSchema, whose admin-created events start unsigned.
export const SignedWorkEventSchema = z.object({
  childId: z.string().min(1),
  userId: z.string().min(1),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  note: optionalText(2000),
  signatureKey: z.string().min(1),
});
export type SignedWorkEventInput = z.infer<typeof SignedWorkEventSchema>;

// A substitution record materialised from a confirmed Vertretung-Request. Unlike
// VertretungSchema (admin-planned, times copied from the Stundenplan), the times
// here are the ones the companion actually reported.
export const SubstitutionRecordSchema = z.object({
  childId: z.string().min(1),
  substituteUserId: z.string().min(1),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
});
export type SubstitutionRecordInput = z.infer<typeof SubstitutionRecordSchema>;

// Kinder-Wizard UI state types — kept here per AGENTS.md ("Zod schemas and TS types").

export type SchoolValue = {
  placeId: string | null;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export type ChildWizardFormState = {
  firstName: string;
  lastName: string;
  school: SchoolValue;
  leosOne: boolean;
  bescheid: string;
  sbIb: string;
  schweigepflichtsentbindung: boolean;
  bemerkung: string;
  kostentraegerId: string | null;
};

type ScalarFields = Exclude<keyof ChildWizardFormState, "school">;

export type ChildWizardErrors = Partial<
  Record<ScalarFields | "school", string>
>;

export const CHILD_STEP_LABELS = [
  "Stammdaten",
  "Verwaltung",
  "Übersicht",
] as const;

export const EMPTY_CHILD_FORM: ChildWizardFormState = {
  firstName: "",
  lastName: "",
  school: {
    placeId: null,
    name: null,
    address: null,
    lat: null,
    lng: null,
  },
  leosOne: false,
  bescheid: "",
  sbIb: "",
  schweigepflichtsentbindung: false,
  bemerkung: "",
  kostentraegerId: null,
};

export const WorkEventSchema = z.object({
  childId: z.string().min(1),
  userId: z.string().min(1),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  note: optionalText(2000),
});
export type WorkEventInput = z.infer<typeof WorkEventSchema>;

export const UpdateWorkEventSchema = z.object({
  userId: z.string().min(1).optional(),
  date: dateString.optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  note: optionalText(2000),
});
export type UpdateWorkEventInput = z.infer<typeof UpdateWorkEventSchema>;
