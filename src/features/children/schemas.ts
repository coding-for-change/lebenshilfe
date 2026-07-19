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

const optionalHours = () =>
  z
    .number()
    .min(0, "Stunden dürfen nicht negativ sein.")
    .max(9999, "Stundenzahl ist zu groß.")
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
  approvedDirectHours: optionalHours(),
  approvedIndirectHours: optionalHours(),
  vorviertelstunde: z.boolean(),
  nachviertelstunde: z.boolean(),
  ausflugSchullandheim: z.boolean(),
  schweigepflichtsentbindung: z.boolean(),
  bemerkung: optionalText(5000),
  // No trailing `.transform()`: a transform placed after `.optional()` runs
  // on the `undefined` of an absent field and would coerce it to `null`,
  // clearing the Kostenträger on every partial update. `childFieldsFromCreate`
  // already maps a missing value to `null` for the create path.
  kostentraegerId: z.string().min(1).nullable().optional(),
  schoolId: z.string().min(1).nullable().optional(),
});

// Create accepts omitted booleans by falling back to defaults.
const kindFieldsCreateSchema = kindFieldsSchema.extend({
  leosOne: z.boolean().default(false),
  vorviertelstunde: z.boolean().default(false),
  nachviertelstunde: z.boolean().default(false),
  ausflugSchullandheim: z.boolean().default(false),
  schweigepflichtsentbindung: z.boolean().default(false),
});

const stammdatenSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname fehlt.").max(100),
  lastName: z.string().trim().min(1, "Nachname fehlt.").max(100),
});

export const BasicInfoStepSchema = stammdatenSchema;

export const AdministrationStepSchema = kindFieldsCreateSchema.pick({
  leosOne: true,
  bescheid: true,
  sbIb: true,
  approvedDirectHours: true,
  approvedIndirectHours: true,
  vorviertelstunde: true,
  nachviertelstunde: true,
  ausflugSchullandheim: true,
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
  profileId: z.string().min(1),
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
  substituteProfileId: z.string().min(1),
  date: dateString,
  // startTime / endTime are NOT provided by the caller — they are copied
  // directly from the ChildAssignment rows for that child+weekday.
});
export type VertretungInput = z.infer<typeof VertretungSchema>;

export const UpdateVertretungSchema = z.object({
  // Only the substitute can be changed; times always mirror the Zuweisung.
  substituteProfileId: z.string().min(1),
});
export type UpdateVertretungInput = z.infer<typeof UpdateVertretungSchema>;

// Kinder-Wizard UI state types — kept here per AGENTS.md ("Zod schemas and TS types").

export type ChildWizardFormState = {
  firstName: string;
  lastName: string;
  schoolId: string | null;
  leosOne: boolean;
  bescheid: string;
  sbIb: string;
  approvedDirectHours: string;
  approvedIndirectHours: string;
  vorviertelstunde: boolean;
  nachviertelstunde: boolean;
  ausflugSchullandheim: boolean;
  schweigepflichtsentbindung: boolean;
  bemerkung: string;
  kostentraegerId: string | null;
};

export type ChildWizardErrors = Partial<
  Record<keyof ChildWizardFormState, string>
>;

export const CHILD_STEP_LABELS = [
  "Stammdaten",
  "Verwaltung",
  "Übersicht",
] as const;

export const EMPTY_CHILD_FORM: ChildWizardFormState = {
  firstName: "",
  lastName: "",
  schoolId: null,
  leosOne: false,
  bescheid: "",
  sbIb: "",
  approvedDirectHours: "",
  approvedIndirectHours: "",
  vorviertelstunde: false,
  nachviertelstunde: false,
  ausflugSchullandheim: false,
  schweigepflichtsentbindung: false,
  bemerkung: "",
  kostentraegerId: null,
};

/** Parses a raw hours input string to a number, or null when empty/invalid. */
export function parseHoursInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

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

/**
 * Scopes the per-child Historie to a single month, or a whole year when
 * `month` is null ("Alle"). Keeps the history query — and its per-event
 * signature downloads — bounded instead of loading every event at once.
 */
export const HistoryQuerySchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12).nullable(),
  // Date sort direction for the listed entries. "desc" = newest first.
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;
