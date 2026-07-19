import { randomUUID } from "crypto";
import { uploadSignaturePng } from "@/lib/storage";
import { exactMatchChild } from "@/lib/child-matching";
import {
  CreateIndirectPendingRequestSchema,
  CreateVertretungRequestSchema,
  ResolveIndirectRequestSchema,
  ResolveVertretungRequestSchema,
  VertretungPrefillLookupSchema,
  type CreateIndirectPendingRequestInput,
  type CreateVertretungRequestInput,
  type ResolveIndirectRequestInput,
  type ResolveVertretungRequestInput,
  type VertretungPrefillLookupInput,
  type VertretungPrefillResult,
} from "./schemas";
import { parseIsoDate, timeToMinutes } from "@/lib/dates";
import {
  countPendingRequests,
  createPendingVertretungRequest,
  deleteChildVertretungForSubstitute,
  deleteOwnRequest,
  deletePendingVertretungRequestById,
  deleteWorkEventsForSubstituteOnDate,
  findExistingVertretungForSubstitute,
  findRequestById,
  getScheduleTimeBlocks,
  insertChildVertretungBlocks,
  insertIndirectWorkEvent,
  insertVertretungWorkEvent,
  listIndirectRequestsForUser,
  listPendingRequests,
  listRequestsForUser,
  rejectRequest,
  resolveRequest,
} from "./services";
import {
  PendingRequestKind,
  PendingVertretungStatus,
} from "@/generated/prisma";

export const VertretungRequestsFacade = {
  async create(substituteUserId: string, input: CreateVertretungRequestInput) {
    const parsed = CreateVertretungRequestSchema.parse(input);

    const signatureKey = `signatures/vertretung-requests/${randomUUID()}.png`;
    await uploadSignaturePng(signatureKey, parsed.signaturePngBase64);

    const match = await exactMatchChild(parsed.childNameText);
    const date = parseIsoDate(parsed.date);

    if (match) {
      // If a Vertretung already exists for this SB+child+date, leave it alone —
      // it was either set up by the admin or by a prior SB submission. Just
      // create the work Event and skip the request entirely. This preserves
      // the admin's assignment intact (no overwriting, no delete button).
      const existingVertretung = await findExistingVertretungForSubstitute({
        childId: match.childId,
        date,
        substituteUserId,
      });
      if (existingVertretung) {
        await insertVertretungWorkEvent({
          childId: match.childId,
          userId: substituteUserId,
          date,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          signatureKey,
        });
        return null;
      }

      // Exact name match, no prior assignment — create ChildVertretung + Event
      // and store the request as RESOLVED so the SB can later undo from the
      // dashboard if it was a mistake.
      const weekday = (date.getUTCDay() + 6) % 7;
      const schedules = await getScheduleTimeBlocks(match.childId, weekday);

      const timeBlocks =
        schedules.length > 0
          ? schedules.map((s) => ({
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          : [{ startTime: parsed.startTime, endTime: parsed.endTime }];

      await insertChildVertretungBlocks({
        childId: match.childId,
        substituteUserId,
        date,
        blocks: timeBlocks,
      });

      await insertVertretungWorkEvent({
        childId: match.childId,
        userId: substituteUserId,
        date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        signatureKey,
      });

      return createPendingVertretungRequest({
        substituteUserId,
        childNameText: parsed.childNameText,
        date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        signatureKey,
        matchedChildId: match.childId,
        matchConfidence: null,
        status: PendingVertretungStatus.RESOLVED,
      });
    }

    // No exact match — goes to admin queue.
    return createPendingVertretungRequest({
      substituteUserId,
      childNameText: parsed.childNameText,
      date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      signatureKey,
      matchedChildId: null,
      matchConfidence: null,
      status: PendingVertretungStatus.PENDING,
    });
  },

  // Reuses the same exact-match rule that auto-assigns on submit, so prefill and
  // submission never diverge. `matched: false` leaks nothing about the roster.
  async lookupPrefill(
    input: VertretungPrefillLookupInput,
  ): Promise<VertretungPrefillResult> {
    const parsed = VertretungPrefillLookupSchema.parse(input);
    const name = parsed.name.trim();
    if (name.length < 2) return { matched: false };

    const match = await exactMatchChild(name);
    if (!match) return { matched: false };

    const date = parseIsoDate(parsed.date);
    const weekday = (date.getUTCDay() + 6) % 7;
    const blocks = await getScheduleTimeBlocks(match.childId, weekday);

    let startTime: string | null = null;
    let endTime: string | null = null;
    if (blocks.length > 0) {
      startTime = blocks.reduce(
        (acc, b) =>
          timeToMinutes(b.startTime) < timeToMinutes(acc) ? b.startTime : acc,
        blocks[0].startTime,
      );
      endTime = blocks.reduce(
        (acc, b) =>
          timeToMinutes(b.endTime) > timeToMinutes(acc) ? b.endTime : acc,
        blocks[0].endTime,
      );
    }

    return {
      matched: true,
      startTime,
      endTime,
      vorviertelstunde: match.vorviertelstunde,
      nachviertelstunde: match.nachviertelstunde,
    };
  },

  async listPending() {
    return listPendingRequests();
  },

  async countPending() {
    return countPendingRequests();
  },

  async resolve(
    id: string,
    adminUserId: string,
    input: ResolveVertretungRequestInput,
  ) {
    const parsed = ResolveVertretungRequestSchema.parse(input);

    const request = await findRequestById(id);
    if (!request) throw new Error("Antrag nicht gefunden.");
    if (request.status !== PendingVertretungStatus.PENDING) {
      throw new Error("Dieser Antrag wurde bereits bearbeitet.");
    }

    const date = request.date;
    const weekday = (date.getUTCDay() + 6) % 7;
    const schedules = await getScheduleTimeBlocks(parsed.childId, weekday);

    const timeBlocks =
      schedules.length > 0
        ? schedules.map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
        : [{ startTime: request.startTime, endTime: request.endTime }];

    await deleteChildVertretungForSubstitute({
      childId: parsed.childId,
      substituteUserId: request.substituteUserId,
      date,
    });
    await insertChildVertretungBlocks({
      childId: parsed.childId,
      substituteUserId: request.substituteUserId,
      date,
      blocks: timeBlocks,
    });

    // Create a signed work Event so the Einsatz appears in the child's calendar.
    // The SB already signed the request — reuse the same signatureKey.
    await insertVertretungWorkEvent({
      childId: parsed.childId,
      userId: request.substituteUserId,
      date,
      startTime: request.startTime,
      endTime: request.endTime,
      signatureKey: request.signatureKey,
    });

    return resolveRequest(id, parsed.childId, adminUserId);
  },

  async listForUser(userId: string, from: Date, to: Date) {
    return listRequestsForUser(userId, from, to);
  },

  async listIndirectForUser(userId: string, from: Date, to: Date) {
    return listIndirectRequestsForUser(userId, from, to);
  },

  async deleteOwn(id: string, userId: string) {
    return deleteOwnRequest(id, userId);
  },

  /**
   * Fully undoes a Vertretung the SB created via free-text (auto-matched or
   * admin-resolved): removes the linked work Event, the ChildVertretung
   * block(s), and the PendingVertretungRequest record itself.
   */
  async deleteOwnVertretung(requestId: string, userId: string) {
    const request = await findRequestById(requestId);
    if (!request) throw new Error("Antrag nicht gefunden.");
    if (request.substituteUserId !== userId) {
      throw new Error("Keine Berechtigung.");
    }

    const childId = request.resolvedChildId ?? request.matchedChildId;
    if (childId) {
      await deleteWorkEventsForSubstituteOnDate({
        userId,
        childId,
        date: request.date,
      });
      await deleteChildVertretungForSubstitute({
        childId,
        substituteUserId: userId,
        date: request.date,
      });
    }

    await deletePendingVertretungRequestById(requestId);
  },

  async reject(id: string, adminUserId: string) {
    const request = await findRequestById(id);
    if (!request) throw new Error("Antrag nicht gefunden.");
    if (request.status !== PendingVertretungStatus.PENDING) {
      throw new Error("Dieser Antrag wurde bereits bearbeitet.");
    }
    return rejectRequest(id, adminUserId);
  },

  /**
   * INDIRECT-Antrag, dessen Name nicht eindeutig einem Kind zugeordnet werden
   * konnte: Signatur hochladen, Anfrage in die Admin-Queue stellen (PENDING).
   * Caller (Use Case) hat den exactMatchChild-Check schon gemacht.
   */
  async createIndirectPending(
    substituteUserId: string,
    input: CreateIndirectPendingRequestInput,
  ) {
    const parsed = CreateIndirectPendingRequestSchema.parse(input);

    const signatureKey = `signatures/indirect-requests/${randomUUID()}.png`;
    await uploadSignaturePng(signatureKey, parsed.signaturePngBase64);

    const date = parseIsoDate(parsed.date);
    return createPendingVertretungRequest({
      kind: PendingRequestKind.INDIRECT,
      substituteUserId,
      childNameText: parsed.childNameText,
      date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      signatureKey,
      note: parsed.note,
      matchedChildId: null,
      matchConfidence: null,
      status: PendingVertretungStatus.PENDING,
    });
  },

  async listPendingIndirect() {
    return listPendingRequests(PendingRequestKind.INDIRECT);
  },

  async countPendingIndirect() {
    return countPendingRequests(PendingRequestKind.INDIRECT);
  },

  /**
   * Admin ordnet einen unentschiedenen INDIRECT-Antrag einem Kind zu. Erzeugt
   * ein INDIRECT-Event (mit ursprünglicher Signatur, Zeiten, Notiz) und
   * markiert die Anfrage als RESOLVED.
   */
  async resolveIndirect(
    id: string,
    adminUserId: string,
    input: ResolveIndirectRequestInput,
  ) {
    const parsed = ResolveIndirectRequestSchema.parse(input);

    const request = await findRequestById(id);
    if (!request) throw new Error("Antrag nicht gefunden.");
    if (request.kind !== PendingRequestKind.INDIRECT) {
      throw new Error("Antrag ist keine indirekte Leistung.");
    }
    if (request.status !== PendingVertretungStatus.PENDING) {
      throw new Error("Dieser Antrag wurde bereits bearbeitet.");
    }
    if (!request.note) {
      throw new Error("Antrag enthält keine Notiz.");
    }

    await insertIndirectWorkEvent({
      childId: parsed.childId,
      userId: request.substituteUserId,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      signatureKey: request.signatureKey,
      note: request.note,
    });

    return resolveRequest(id, parsed.childId, adminUserId);
  },
};
