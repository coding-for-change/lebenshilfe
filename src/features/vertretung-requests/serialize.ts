import type { PendingVertretungRequest } from "./services";

/** UI-safe shape of a pending Vertretung-Request for the admin queue. */
export type SerializedVertretungRequest = {
  id: string;
  childNameText: string;
  reportedByUserId: string;
  reportedByUserName: string;
  date: string; // yyyy-mm-dd
  startTime: string;
  endTime: string;
  note: string | null;
  suggestedChildId: string | null;
  suggestedChildName: string | null;
  matchScore: number | null;
  createdAt: string; // ISO
};

export function serializeVertretungRequest(
  row: PendingVertretungRequest,
): SerializedVertretungRequest {
  return {
    id: row.id,
    childNameText: row.childNameText,
    reportedByUserId: row.reportedByUserId,
    reportedByUserName: row.reportedByUser.name,
    date: row.date.toISOString().slice(0, 10),
    startTime: row.startTime,
    endTime: row.endTime,
    note: row.note,
    suggestedChildId: row.suggestedChildId,
    suggestedChildName: row.suggestedChild
      ? `${row.suggestedChild.firstName} ${row.suggestedChild.lastName}`
      : null,
    matchScore: row.matchScore,
    createdAt: row.createdAt.toISOString(),
  };
}
