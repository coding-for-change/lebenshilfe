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

export const SchuleSchema = z
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

export type SchuleInput = z.infer<typeof SchuleSchema>;

const kindFieldsSchema = z.object({
  leosOne: z.boolean().default(false),
  bescheid: optionalText(5000),
  sbIb: optionalText(200),
  schweigepflichtsentbindung: z.boolean().default(false),
  bemerkung: optionalText(5000),
  kostentraegerId: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  schule: SchuleSchema.optional(),
});

const stammdatenSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname fehlt.").max(100),
  lastName: z.string().trim().min(1, "Nachname fehlt.").max(100),
});

export const StammdatenStepSchema = stammdatenSchema.merge(
  z.object({ schule: SchuleSchema.optional() }),
);

export const VerwaltungStepSchema = kindFieldsSchema.pick({
  leosOne: true,
  bescheid: true,
  sbIb: true,
  schweigepflichtsentbindung: true,
  bemerkung: true,
  kostentraegerId: true,
});

export const CreateKindSchema = stammdatenSchema.merge(kindFieldsSchema);
export type CreateKindInput = z.infer<typeof CreateKindSchema>;

export const UpdateKindSchema = stammdatenSchema
  .partial()
  .merge(kindFieldsSchema.partial());
export type UpdateKindInput = z.infer<typeof UpdateKindSchema>;

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
