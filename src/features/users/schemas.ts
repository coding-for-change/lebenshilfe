import { z } from "zod";
import { Role } from "@/generated/prisma";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(Role),
});

export const InviteAdminUserSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt.").max(200, "Name ist zu lang."),
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
  role: z.enum(Role).refine((r) => r === Role.ADMIN || r === Role.OWNER, {
    message: "Rolle muss ADMIN oder OWNER sein.",
  }),
});

export type InviteAdminUserInput = z.infer<typeof InviteAdminUserSchema>;
