import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

export const WorkshopSelectionSchema = z.object({
  workshopId: z.string().min(1),
  attendedOn: dateStringSchema,
});

export type WorkshopSelectionInput = z.infer<typeof WorkshopSelectionSchema>;

const profileFieldsSchema = z.object({
  leosOne: z.boolean().default(false),
  outlook: z.boolean().default(false),
  weeklyHours: z
    .number()
    .min(0, "Stunden dürfen nicht negativ sein.")
    .max(168, "Maximal 168 Stunden pro Woche.")
    .nullable()
    .optional(),
  zvNeuNachBescheid: z.boolean().default(false),
  zvNeuNote: z.string().max(2000, "Notiz ist zu lang.").nullable().optional(),
  introductionDay: dateStringSchema.nullable().optional(),
  workshops: z.array(WorkshopSelectionSchema).default([]),
});

const stammdatenSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200),
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
});

const sharedRefinement = (
  val: { zvNeuNachBescheid: boolean; zvNeuNote?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (val.zvNeuNachBescheid && !val.zvNeuNote?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["zvNeuNote"],
      message: "Notiz erforderlich, wenn ZV neu nach Bescheid aktiv ist.",
    });
  }
};

export const CreateSchulbegleiterSchema = stammdatenSchema
  .merge(profileFieldsSchema)
  .superRefine(sharedRefinement);

export type CreateSchoolAssistantInput = z.infer<
  typeof CreateSchulbegleiterSchema
>;

// Email is intentionally omitted — it's the stable identity for the linked
// invitation/account.
export const UpdateSchulbegleiterSchema = z
  .object({ name: stammdatenSchema.shape.name.optional() })
  .merge(profileFieldsSchema.partial());

export type UpdateSchoolAssistantInput = z.infer<
  typeof UpdateSchulbegleiterSchema
>;

export const BasicInfoStepSchema = stammdatenSchema;
export const VertragStepSchema = profileFieldsSchema
  .pick({
    leosOne: true,
    outlook: true,
    weeklyHours: true,
    zvNeuNachBescheid: true,
    zvNeuNote: true,
    introductionDay: true,
  })
  .superRefine(sharedRefinement);
export const WorkshopsStepSchema = profileFieldsSchema.pick({
  workshops: true,
});
