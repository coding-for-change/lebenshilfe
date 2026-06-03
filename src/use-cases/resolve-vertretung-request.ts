/**
 * Use case: an admin resolves a pending Vertretung-Request by assigning the
 * correct child (COD-51).
 *
 * On confirmation it materialises, in the children domain:
 *  1. A billable WORK Event carrying the companion's original signature
 *     (createSignedWorkEvent) — so the entry counts toward billing only now,
 *     after admin confirmation.
 *  2. A ChildVertretung substitution record with the reported times
 *     (createSubstitutionRecord) — the same record an admin would create
 *     manually, keeping the children calendar consistent.
 * It then marks the request CONFIRMED.
 *
 * Coordinates ChildrenFacade and VertretungRequestsFacade, so it lives as a
 * cross-feature use case rather than inside either facade.
 */

import { ChildrenFacade } from "@/features/children/facade";
import { VertretungRequestsFacade } from "@/features/vertretung-requests/facade";
import {
  ResolveVertretungRequestSchema,
  type ResolveVertretungRequestInput,
} from "@/features/vertretung-requests/schemas";

export async function resolveVertretungRequest(
  adminId: string,
  input: ResolveVertretungRequestInput,
) {
  const parsed = ResolveVertretungRequestSchema.parse(input);

  const request = await VertretungRequestsFacade.getRequest(parsed.requestId);
  if (!request) {
    throw new Error("Vertretungsmeldung nicht gefunden.");
  }
  if (request.status !== "PENDING") {
    throw new Error("Diese Meldung wurde bereits bearbeitet.");
  }

  const dateStr = request.date.toISOString().slice(0, 10);

  // 1. Billable WORK event, signed by the reporting Schulbegleiter.
  const event = await ChildrenFacade.createSignedWorkEvent({
    childId: parsed.childId,
    userId: request.reportedByUserId,
    date: dateStr,
    startTime: request.startTime,
    endTime: request.endTime,
    note: request.note ?? undefined,
    signatureKey: request.signatureKey,
  });

  // 2. Substitution record with the times the companion actually reported.
  await ChildrenFacade.createSubstitutionRecord({
    childId: parsed.childId,
    substituteUserId: request.reportedByUserId,
    date: dateStr,
    startTime: request.startTime,
    endTime: request.endTime,
  });

  // 3. Mark the request resolved.
  await VertretungRequestsFacade.markConfirmed(parsed.requestId, {
    resolvedChildId: parsed.childId,
    resolvedByUserId: adminId,
    resolvedEventId: event.id,
  });

  return event;
}
