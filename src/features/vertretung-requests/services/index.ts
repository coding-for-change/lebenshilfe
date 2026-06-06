import { prisma } from "@/lib/prisma";
import { PendingVertretungStatus } from "@/generated/prisma";

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
}) {
  return prisma.pendingVertretungRequest.create({ data });
}

export async function listPendingRequests() {
  return prisma.pendingVertretungRequest.findMany({
    where: { status: PendingVertretungStatus.PENDING },
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

export async function countPendingRequests() {
  return prisma.pendingVertretungRequest.count({
    where: { status: PendingVertretungStatus.PENDING },
  });
}
