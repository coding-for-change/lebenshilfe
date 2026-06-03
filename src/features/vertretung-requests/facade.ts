import { randomUUID } from "node:crypto";
import {
  createVertretungRequestRow,
  getVertretungRequestById,
  listPendingVertretungRequests,
  markVertretungRequestConfirmed,
  markVertretungRequestRejected,
  uploadVertretungSignature,
} from "./services";
import {
  serializeVertretungRequest,
  type SerializedVertretungRequest,
} from "./serialize";
import type { CreateVertretungRequestData } from "./schemas";

/**
 * Feature brain for Schulbegleiter-reported substitutions (COD-51). Owns the
 * VertretungRequest table only — fuzzy matching against the roster and the
 * materialisation of the confirmed Event/ChildVertretung are coordinated by
 * use-cases (cross-feature). Stays free of auth/HTTP per AGENTS.md.
 */
export const VertretungRequestsFacade = {
  /**
   * Persist a companion's free-text report together with the server-derived
   * match suggestion. The companion's signature is uploaded here; the row
   * starts PENDING and is invisible to billing until an admin confirms it.
   */
  async createRequest(data: CreateVertretungRequestData) {
    const signatureKey = `signatures/vertretung/${data.reportedByUserId}/${randomUUID()}.png`;
    await uploadVertretungSignature(signatureKey, data.signaturePngBase64);

    return createVertretungRequestRow({
      reportedByUserId: data.reportedByUserId,
      childNameText: data.childNameText,
      date: new Date(`${data.date}T00:00:00.000Z`),
      startTime: data.startTime,
      endTime: data.endTime,
      note: data.note ?? null,
      signatureKey,
      suggestedChildId: data.suggestedChildId,
      matchScore: data.matchScore,
    });
  },

  async listPending(): Promise<SerializedVertretungRequest[]> {
    const rows = await listPendingVertretungRequests();
    return rows.map(serializeVertretungRequest);
  },

  /** Raw row — used by the resolve use-case to materialise the Event. */
  async getRequest(id: string) {
    return getVertretungRequestById(id);
  },

  async markConfirmed(
    id: string,
    data: {
      resolvedChildId: string;
      resolvedByUserId: string;
      resolvedEventId: string;
    },
  ) {
    return markVertretungRequestConfirmed(id, data);
  },

  async markRejected(
    id: string,
    data: { resolvedByUserId: string; reason: string | null },
  ) {
    return markVertretungRequestRejected(id, data);
  },
};
