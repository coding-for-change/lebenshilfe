/**
 * Use case: Create an INDIRECT timesheet event from a free-text child name.
 *
 * Mirrors the Vertretung-style free-text UX: the SB types the child's name
 * and the server resolves it via exact match against the Child table. If no
 * exact match is found the request is rejected — there is no admin queue for
 * indirect entries (decision: 2026-06-17).
 *
 * The resolved childId is then handed to the existing createTimesheetEvent
 * use case which performs the cross-feature validation and insert.
 */

import { exactMatchChild } from "@/lib/child-matching";
import {
  CreateIndirectByNameSchema,
  type CreateIndirectByNameInput,
} from "@/features/timesheet/schemas";
import { createTimesheetEvent } from "./create-timesheet-event";

export async function createIndirectEventByName(
  userId: string,
  input: CreateIndirectByNameInput,
) {
  const parsed = CreateIndirectByNameSchema.parse(input);

  const match = await exactMatchChild(parsed.childNameText);
  if (!match) {
    throw new Error(
      `Kein Kind mit dem Namen „${parsed.childNameText.trim()}" gefunden.`,
    );
  }

  return createTimesheetEvent(userId, {
    type: "INDIRECT",
    date: parsed.date,
    childIds: [match.childId],
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    note: parsed.note,
    signaturePngBase64: parsed.signaturePngBase64,
  });
}
