import { randomUUID } from "crypto";
import { uploadSignaturePng } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import {
  fuzzyMatchChild,
  MATCH_AUTO_THRESHOLD,
} from "@/features/children/services/fuzzy-match";
import {
  CreateVertretungRequestSchema,
  ResolveVertretungRequestSchema,
  type CreateVertretungRequestInput,
  type ResolveVertretungRequestInput,
} from "./schemas";
import {
  createPendingVertretungRequest,
  findRequestById,
  listPendingRequests,
  rejectRequest,
  resolveRequest,
  countPendingRequests,
} from "./services";
import { PendingVertretungStatus } from "@/generated/prisma";

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const VertretungRequestsFacade = {
  async create(substituteUserId: string, input: CreateVertretungRequestInput) {
    const parsed = CreateVertretungRequestSchema.parse(input);

    const signatureKey = `signatures/vertretung-requests/${randomUUID()}.png`;
    await uploadSignaturePng(signatureKey, parsed.signaturePngBase64);

    const match = await fuzzyMatchChild(parsed.childNameText);
    const autoResolved =
      match !== null && match.confidence >= MATCH_AUTO_THRESHOLD;

    const date = parseDateOnly(parsed.date);

    if (autoResolved && match) {
      // High confidence — create ChildVertretung immediately and store as RESOLVED.
      const weekday = (date.getUTCDay() + 6) % 7;
      const schedules = await prisma.schedule.findMany({
        where: { childId: match.childId, weekday },
        select: { startTime: true, endTime: true },
      });

      const timeBlocks =
        schedules.length > 0
          ? schedules.map((s) => ({
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          : [{ startTime: parsed.startTime, endTime: parsed.endTime }];

      await prisma.childVertretung.createMany({
        data: timeBlocks.map((b) => ({
          childId: match.childId,
          substituteUserId,
          date,
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      });

      return createPendingVertretungRequest({
        substituteUserId,
        childNameText: parsed.childNameText,
        date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        signatureKey,
        matchedChildId: match.childId,
        matchConfidence: match.confidence,
        status: PendingVertretungStatus.RESOLVED,
      });
    }

    return createPendingVertretungRequest({
      substituteUserId,
      childNameText: parsed.childNameText,
      date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      signatureKey,
      matchedChildId: match?.childId ?? null,
      matchConfidence: match?.confidence ?? null,
      status: PendingVertretungStatus.PENDING,
    });
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
    const schedules = await prisma.schedule.findMany({
      where: { childId: parsed.childId, weekday },
      select: { startTime: true, endTime: true },
    });

    const timeBlocks =
      schedules.length > 0
        ? schedules.map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
        : [{ startTime: request.startTime, endTime: request.endTime }];

    await prisma.childVertretung.createMany({
      data: timeBlocks.map((b) => ({
        childId: parsed.childId,
        substituteUserId: request.substituteUserId,
        date,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });

    return resolveRequest(id, parsed.childId, adminUserId);
  },

  async reject(id: string, adminUserId: string) {
    const request = await findRequestById(id);
    if (!request) throw new Error("Antrag nicht gefunden.");
    if (request.status !== PendingVertretungStatus.PENDING) {
      throw new Error("Dieser Antrag wurde bereits bearbeitet.");
    }
    return rejectRequest(id, adminUserId);
  },
};
