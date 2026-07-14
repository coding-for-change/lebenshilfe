/**
 * Use case: Create an INDIRECT timesheet event from a free-text child name.
 *
 * Mirrors the Vertretung-style free-text UX: the SB types the child's name
 * and the server resolves it via exact match against the Child table.
 *  - Exakter Match → INDIRECT-Event wird direkt erstellt (createTimesheetEvent).
 *  - Kein Match → Antrag landet als PENDING in der Admin-Queue
 *    (PendingVertretungRequest mit kind=INDIRECT). Admin ordnet das Kind
 *    nachträglich zu, das Event wird beim Resolve erzeugt.
 *
 * Diese „Queue statt Fehler" Strategie ersetzt die ursprüngliche Entscheidung
 * vom 2026-06-17 (damals: Fehler anzeigen), weil die SB sonst bei einer
 * Schreibweisen-Variation des Kindesnamens den Eintrag nicht speichern konnte.
 */

import { exactMatchChild } from "@/lib/child-matching";
import {
  CreateIndirectByNameSchema,
  type CreateIndirectByNameInput,
} from "@/features/timesheet/schemas";
import { VertretungRequestsFacade } from "@/features/vertretung-requests";
import { createTimesheetEvent } from "./create-timesheet-event";

export type CreateIndirectByNameResult =
  | { status: "CREATED" }
  | { status: "QUEUED"; requestId: string };

export async function createIndirectEventByName(
  userId: string,
  input: CreateIndirectByNameInput,
): Promise<CreateIndirectByNameResult> {
  const parsed = CreateIndirectByNameSchema.parse(input);

  const match = await exactMatchChild(parsed.childNameText);

  if (match) {
    await createTimesheetEvent(userId, {
      type: "INDIRECT",
      date: parsed.date,
      childIds: [match.childId],
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      note: parsed.note,
      signaturePngBase64: parsed.signaturePngBase64,
    });
    return { status: "CREATED" };
  }

  const queued = await VertretungRequestsFacade.createIndirectPending(userId, {
    childNameText: parsed.childNameText,
    date: parsed.date,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    note: parsed.note,
    signaturePngBase64: parsed.signaturePngBase64,
  });
  return { status: "QUEUED", requestId: queued.id };
}
