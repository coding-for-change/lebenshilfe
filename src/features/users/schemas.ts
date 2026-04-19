import { z } from "zod";
import { Role } from "@/generated/prisma";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(Role),
});
