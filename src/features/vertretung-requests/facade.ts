import { randomUUID } from "crypto";
import { uploadSignaturePng } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { exactMatchChild } from "@/features/children/services/fuzzy-match";
import {
  CreateVertretungRequestSchema,
  ResolveVertretungRequestSchema,
  type CreateVertretungRequestInput,
  type ResolveVertretungRequestInput,
} from "./schemas";
import {
  createPendingVertretungRequest,
  deleteOwnRequest,
  findRequestById,
  listPendingRequests,
  listRequestsForUser,
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

    const match = await exactMatchChild(parsed.childNameText);
    const date = parseDateOnly(parsed.date);

    if (match) {
      // Exact name match — create ChildVertretung immediately and store as RESOLVED.
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

      await prisma.childVertretung.deleteMany({
        where: { childId: match.childId, date, substituteUserId },
      });
      await prisma.childVertretung.createMany({
        data: timeBlocks.map((b) => ({
          childId: match.childId,
          substituteUserId,
          date,
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      });

      await prisma.event.create({
        data: {
          childId: match.childId,
          userId: substituteUserId,
          type: "WORK",
          date,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          signatureKey,
          deleted: false,
        },
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

    await prisma.childVertretung.deleteMany({
      where: {
        childId: parsed.childId,
        date,
        substituteUserId: request.substituteUserId,
      },
    });
    await prisma.childVertretung.createMany({
      data: timeBlocks.map((b) => ({
        childId: parsed.childId,
        substituteUserId: request.substituteUserId,
        date,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });

    // Create a signed work Event so the Einsatz appears in the child's calendar.
    // The SB already signed the request — reuse the same signatureKey.
    await prisma.event.create({
      data: {
        childId: parsed.childId,
        userId: request.substituteUserId,
        type: "WORK",
        date,
        startTime: request.startTime,
        endTime: request.endTime,
        signatureKey: request.signatureKey,
        deleted: false,
      },
    });

    return resolveRequest(id, parsed.childId, adminUserId);
  },

  async listForUser(userId: string, from: Date, to: Date) {
    return listRequestsForUser(userId, from, to);
  },

  async deleteOwn(id: string, userId: string) {
    return deleteOwnRequest(id, userId);
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
