import { z } from "zod";

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Eingabe ist zu lang.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

// Canonical school fields. `name` is required; address + Google Places metadata
// and the holiday plan are optional. Kept WITHOUT `.default()` so `.partial()`
// (update) can't inject values for untouched columns.
export const SchoolFieldsSchema = z.object({
  name: z.string().trim().min(1, "Schulname fehlt.").max(200),
  address: optionalString(2000),
  placeId: z.string().trim().max(300).nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  holidayPlanId: z.string().min(1).nullable().optional(),
});
export type SchoolInput = z.infer<typeof SchoolFieldsSchema>;

export const CreateSchoolSchema = SchoolFieldsSchema;

export const UpdateSchoolSchema = SchoolFieldsSchema.partial();
export type UpdateSchoolInput = z.infer<typeof UpdateSchoolSchema>;

// Batch (or single) holiday-plan assignment from the schools table.
export const AssignHolidayPlanSchema = z.object({
  schoolIds: z.array(z.string().min(1)).min(1, "Keine Schule ausgewählt."),
  holidayPlanId: z.string().min(1).nullable(),
});
export type AssignHolidayPlanInput = z.infer<typeof AssignHolidayPlanSchema>;

// UI value shape produced by the school autocomplete (Google Places).
export type SchoolValue = {
  placeId: string | null;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export const EMPTY_SCHOOL_VALUE: SchoolValue = {
  placeId: null,
  name: null,
  address: null,
  lat: null,
  lng: null,
};

export const SCHOOL_STEP_LABELS = ["Stammdaten", "Übersicht"] as const;
