import { z } from "zod";

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const CostBearerSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ungültige E-Mail-Adresse.")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  address: optionalString(2000),
});

export type CostBearerInput = z.infer<typeof CostBearerSchema>;

export const CreateKostentraegerSchema = CostBearerSchema;
export const UpdateKostentraegerSchema = CostBearerSchema;
