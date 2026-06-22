import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Eingabe ist zu lang.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const entryRange = z
  .object({
    name: optionalString(200),
    startDate: dateString,
    endDate: dateString,
  })
  .superRefine((val, ctx) => {
    if (val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Enddatum darf nicht vor dem Startdatum liegen.",
      });
    }
  });

export const HolidayPlanFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200),
});

// Create accepts an optional initial set of holiday ranges.
export const CreateHolidayPlanSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200),
  entries: z.array(entryRange).optional(),
});
export type CreateHolidayPlanInput = z.infer<typeof CreateHolidayPlanSchema>;

export const UpdateHolidayPlanSchema = HolidayPlanFieldsSchema.partial();
export type UpdateHolidayPlanInput = z.infer<typeof UpdateHolidayPlanSchema>;

export const HolidayEntrySchema = z
  .object({
    planId: z.string().min(1),
    name: optionalString(200),
    startDate: dateString,
    endDate: dateString,
  })
  .superRefine((val, ctx) => {
    if (val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Enddatum darf nicht vor dem Startdatum liegen.",
      });
    }
  });
export type HolidayEntryInput = z.infer<typeof HolidayEntrySchema>;

export const UpdateHolidayEntrySchema = entryRange;
export type UpdateHolidayEntryInput = z.infer<typeof UpdateHolidayEntrySchema>;
