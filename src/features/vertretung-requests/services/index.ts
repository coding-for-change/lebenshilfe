import { prisma } from "@/lib/prisma";
import {
  EventType,
  PendingRequestKind,
  PendingVertretungStatus,
} from "@/generated/prisma";

export async function createPendingVertretungRequest(data: {
  substituteUserId: string;
  childNameText: string;
  date: Date;
  startTime: string;
  endTime: string;
  signatureKey: string;
  matchedChildId: string | null;
  matchConfidence: number | null;
  status: PendingVertretungStatus;
  kind?: PendingRequestKind;
  note?: string | null;
}) {
  return prisma.pendingVertretungRequest.create({ data });
}

export async function listPendingRequests(
  kind: PendingRequestKind = PendingRequestKind.VERTRETUNG,
) {
  return prisma.pendingVertretungRequest.findMany({
    where: { status: PendingVertretungStatus.PENDING, kind },
    include: {
      substituteUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "asc" },
  });
}

export async function findRequestById(id: string) {
  return prisma.pendingVertretungRequest.findUnique({ where: { id } });
}

export async function resolveRequest(
  id: string,
  resolvedChildId: string,
  resolvedByUserId: string,
) {
  return prisma.pendingVertretungRequest.update({
    where: { id },
    data: {
      status: PendingVertretungStatus.RESOLVED,
      resolvedChildId,
      resolvedByUserId,
      resolvedAt: new Date(),
    },
  });
}

export async function rejectRequest(id: string, resolvedByUserId: string) {
  return prisma.pendingVertretungRequest.update({
    where: { id },
    data: {
      status: PendingVertretungStatus.REJECTED,
      resolvedByUserId,
      resolvedAt: new Date(),
    },
  });
}

export async function countPendingRequests(
  kind: PendingRequestKind = PendingRequestKind.VERTRETUNG,
) {
  return prisma.pendingVertretungRequest.count({
    where: { status: PendingVertretungStatus.PENDING, kind },
  });
}

export async function insertIndirectWorkEvent(args: {
  childId: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  signatureKey: string;
  note: string;
}) {
  return prisma.event.create({
    data: {
      childId: args.childId,
      userId: args.userId,
      type: EventType.INDIRECT,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      signatureKey: args.signatureKey,
      note: args.note,
      deleted: false,
    },
  });
}

export async function listRequestsForUser(
  substituteUserId: string,
  from: Date,
  to: Date,
) {
  return prisma.pendingVertretungRequest.findMany({
    where: {
      substituteUserId,
      kind: PendingRequestKind.VERTRETUNG,
      status: {
        in: [PendingVertretungStatus.PENDING, PendingVertretungStatus.RESOLVED],
      },
      date: { gte: from, lt: to },
    },
    orderBy: { date: "asc" },
  });
}

export async function listIndirectRequestsForUser(
  substituteUserId: string,
  from: Date,
  to: Date,
) {
  return prisma.pendingVertretungRequest.findMany({
    where: {
      substituteUserId,
      kind: PendingRequestKind.INDIRECT,
      status: PendingVertretungStatus.PENDING,
      date: { gte: from, lt: to },
    },
    orderBy: { date: "asc" },
  });
}

export async function deleteOwnRequest(id: string, substituteUserId: string) {
  const request = await prisma.pendingVertretungRequest.findUnique({
    where: { id },
  });
  if (!request) throw new Error("Antrag nicht gefunden.");
  if (request.substituteUserId !== substituteUserId) {
    throw new Error("Keine Berechtigung.");
  }
  if (request.status !== PendingVertretungStatus.PENDING) {
    throw new Error("Nur offene Anträge können gelöscht werden.");
  }
  await prisma.pendingVertretungRequest.delete({ where: { id } });
}

export async function deletePendingVertretungRequestById(id: string) {
  return prisma.pendingVertretungRequest.delete({ where: { id } });
}

export async function findExistingVertretungForSubstitute(args: {
  childId: string;
  date: Date;
  substituteUserId: string;
}) {
  return prisma.childVertretung.findFirst({
    where: {
      childId: args.childId,
      date: args.date,
      substituteUserId: args.substituteUserId,
    },
    select: { id: true },
  });
}

export async function getScheduleTimeBlocks(childId: string, weekday: number) {
  return prisma.schedule.findMany({
    where: { childId, weekday },
    select: { startTime: true, endTime: true },
  });
}

export async function insertChildVertretungBlocks(args: {
  childId: string;
  substituteUserId: string;
  date: Date;
  blocks: { startTime: string; endTime: string }[];
}) {
  return prisma.childVertretung.createMany({
    data: args.blocks.map((b) => ({
      childId: args.childId,
      substituteUserId: args.substituteUserId,
      date: args.date,
      startTime: b.startTime,
      endTime: b.endTime,
    })),
  });
}

export async function deleteChildVertretungForSubstitute(args: {
  childId: string;
  substituteUserId: string;
  date: Date;
}) {
  return prisma.childVertretung.deleteMany({
    where: {
      childId: args.childId,
      substituteUserId: args.substituteUserId,
      date: args.date,
    },
  });
}

export async function insertVertretungWorkEvent(args: {
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
      type: EventType.WORK,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      signatureKey: args.signatureKey,
      deleted: false,
    },
  });
}

export async function deleteWorkEventsForSubstituteOnDate(args: {
  userId: string;
  childId: string;
  date: Date;
}) {
  return prisma.event.deleteMany({
    where: {
      userId: args.userId,
      childId: args.childId,
      date: args.date,
      type: EventType.WORK,
    },
  });
}
