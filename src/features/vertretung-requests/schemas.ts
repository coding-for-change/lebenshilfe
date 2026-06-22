import { z } from "zod";

export const CreateVertretungRequestSchema = z.object({
  childNameText: z.string().min(2, "Name muss mindestens 2 Zeichen haben."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Startzeit."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Endzeit."),
  signaturePngBase64: z.string().min(1, "Unterschrift fehlt."),
});

export type CreateVertretungRequestInput = z.infer<
  typeof CreateVertretungRequestSchema
>;

export const ResolveVertretungRequestSchema = z.object({
  childId: z.string().min(1, "Kind muss ausgewählt werden."),
});

export type ResolveVertretungRequestInput = z.infer<
  typeof ResolveVertretungRequestSchema
>;
