import { z } from "zod";

export const WorkshopSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200),
  description: z
    .string()
    .trim()
    .max(2000, "Beschreibung ist zu lang.")
    .optional()
    .nullable(),
});

export type WorkshopInput = z.infer<typeof WorkshopSchema>;

export const UpdateWorkshopSchema = WorkshopSchema.partial();
export type UpdateWorkshopInput = z.infer<typeof UpdateWorkshopSchema>;
