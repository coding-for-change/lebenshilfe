import { z } from "zod";

export const PoolFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200),
  schoolId: z.string().min(1, "Schule fehlt."),
  kostentraegerId: z.string().min(1, "Kostenträger fehlt."),
});

export type PoolFieldsInput = z.infer<typeof PoolFieldsSchema>;

export const CreatePoolSchema = PoolFieldsSchema;
export const UpdatePoolSchema = PoolFieldsSchema.partial();

export type CreatePoolInput = z.infer<typeof CreatePoolSchema>;
export type UpdatePoolInput = z.infer<typeof UpdatePoolSchema>;

export const SetPoolChildrenSchema = z.object({
  poolId: z.string().min(1),
  childIds: z.array(z.string().min(1)),
});

export const SetPoolAssistantsSchema = z.object({
  poolId: z.string().min(1),
  profileIds: z.array(z.string().min(1)),
});

export type SetPoolChildrenInput = z.infer<typeof SetPoolChildrenSchema>;
export type SetPoolAssistantsInput = z.infer<typeof SetPoolAssistantsSchema>;
