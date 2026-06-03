/**
 * Use case: a Schulbegleiter reports a Vertretung for a child they are NOT
 * assigned to (COD-51).
 *
 * Coordinates two feature facades:
 *  1. ChildrenFacade.matchChildByFreeText — fuzzy-match the free-text child name
 *     against the roster, server-side only (the roster is never shown to the
 *     companion for Datenschutz reasons).
 *  2. VertretungRequestsFacade.createRequest — store the report PENDING, with
 *     the suggestion attached, awaiting admin resolution.
 *
 * The match suggestion is never auto-confirmed: nothing reaches billing until
 * an admin resolves the request.
 */

import { ChildrenFacade } from "@/features/children/facade";
import { VertretungRequestsFacade } from "@/features/vertretung-requests/facade";
import {
  SubmitVertretungRequestSchema,
  type SubmitVertretungRequestInput,
} from "@/features/vertretung-requests/schemas";

export async function submitVertretungRequest(
  userId: string,
  input: SubmitVertretungRequestInput,
) {
  const parsed = SubmitVertretungRequestSchema.parse(input);

  const match = await ChildrenFacade.matchChildByFreeText(parsed.childNameText);

  return VertretungRequestsFacade.createRequest({
    reportedByUserId: userId,
    childNameText: parsed.childNameText,
    date: parsed.date,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    note: parsed.note,
    signaturePngBase64: parsed.signaturePngBase64,
    suggestedChildId: match.suggestedChildId,
    matchScore: match.matchScore,
  });
}
