import { randomUUID } from "crypto";
import { uploadSignaturePng } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { exactMatchChild } from "@/lib/child-matching";
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

function createWorkEvent(args: {
  childId: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  signatureKey: string;
}) {
  return prisma.event.create({
    data: {
      childId: args.childId,
      userId: args.userId,
      type: "WORK",
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      signatureKey: args.signatureKey,
      deleted: false,
    },
  });
}

export const VertretungRequestsFacade = {
  async create(substituteUserId: string, input: CreateVertretungRequestInput) {
    const parsed = CreateVertretungRequestSchema.parse(input);

    const signatureKey = `signatures/vertretung-requests/${randomUUID()}.png`;
    await uploadSignaturePng(signatureKey, parsed.signaturePngBase64);

    const match = await exactMatchChild(parsed.childNameText);
    const date = parseDateOnly(parsed.date);

    if (match) {
      // If a Vertretung already exists for this SB+child+date, leave it alone —
      // it was either set up by the admin or by a prior SB submission. Just
      // create the work Event and skip the request entirely. This preserves
      // the admin's assignment intact (no overwriting, no delete button).
      const existingVertretung = await prisma.childVertretung.findFirst({
        where: { childId: match.childId, date, substituteUserId },
        select: { id: true },
      });
      if (existingVertretung) {
        await createWorkEvent({
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

      await createWorkEvent({
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
    await createWorkEvent({
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

  async deleteOwn(id: string, userId: string) {
    return deleteOwnRequest(id, userId);
  },

  /**
   * Fully undoes a Vertretung the SB created via free-text (auto-matched or
   * admin-resolved): removes the linked work Event, the ChildVertretung
   * block(s), and the PendingVertretungRequest record itself.
   */
  async deleteOwnVertretung(requestId: string, userId: string) {
    const request = await prisma.pendingVertretungRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error("Antrag nicht gefunden.");
    if (request.substituteUserId !== userId) {
      throw new Error("Keine Berechtigung.");
    }

    const childId = request.resolvedChildId ?? request.matchedChildId;
    if (childId) {
      await prisma.event.deleteMany({
        where: {
          userId,
          childId,
          date: request.date,
          type: "WORK",
        },
      });
      await prisma.childVertretung.deleteMany({
        where: {
          substituteUserId: userId,
          childId,
          date: request.date,
        },
      });
    }

    await prisma.pendingVertretungRequest.delete({ where: { id: requestId } });
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
