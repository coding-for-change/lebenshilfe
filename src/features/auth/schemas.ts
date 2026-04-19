import { z } from "zod";

export const MagicLinkRequestSchema = z.object({
  email: z.email({ message: "Bitte gib eine gültige E-Mail-Adresse ein." }),
});
