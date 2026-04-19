import { z } from "zod";
import { Role } from "@/generated/prisma";

export const RoleSchema = z.nativeEnum(Role);

export const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: RoleSchema.default(Role.SCHOOL_ASSISTANT),
});
