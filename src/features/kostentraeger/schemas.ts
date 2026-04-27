import { z } from "zod";

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const KostentraegerSchema = z.object({
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

export type KostentraegerInput = z.infer<typeof KostentraegerSchema>;

export const CreateKostentraegerSchema = KostentraegerSchema;
export const UpdateKostentraegerSchema = KostentraegerSchema;
