import { prisma } from "@/lib/prisma";
import { uploadSignaturePng } from "@/lib/storage";
import { VertretungRequestStatus, type Prisma } from "@/generated/prisma";

export type PendingVertretungRequest = Prisma.VertretungRequestGetPayload<{
  include: { reportedByUser: true; suggestedChild: true };
}>;

export async function uploadVertretungSignature(
  key: string,
  pngBase64: string,
) {
  return uploadSignaturePng(key, pngBase64);
}

export async function createVertretungRequestRow(data: {
  reportedByUserId: string;
  childNameText: string;
  date: Date;
  startTime: string;
  endTime: string;
  note: string | null;
  signatureKey: string;
  suggestedChildId: string | null;
  matchScore: number | null;
}) {
  return prisma.vertretungRequest.create({ data });
}

export async function listPendingVertretungRequests(): Promise<
  PendingVertretungRequest[]
> {
  return prisma.vertretungRequest.findMany({
    where: { status: VertretungRequestStatus.PENDING },
    include: { reportedByUser: true, suggestedChild: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getVertretungRequestById(id: string) {
  return prisma.vertretungRequest.findUnique({ where: { id } });
}

export async function markVertretungRequestConfirmed(
  id: string,
  data: {
    resolvedChildId: string;
    resolvedByUserId: string;
    resolvedEventId: string;
  },
) {
  return prisma.vertretungRequest.update({
    where: { id },
    data: {
      status: VertretungRequestStatus.CONFIRMED,
      resolvedChildId: data.resolvedChildId,
      resolvedByUserId: data.resolvedByUserId,
      resolvedEventId: data.resolvedEventId,
      resolvedAt: new Date(),
    },
  });
}

export async function markVertretungRequestRejected(
  id: string,
  data: { resolvedByUserId: string; reason: string | null },
) {
  return prisma.vertretungRequest.update({
    where: { id },
    data: {
      status: VertretungRequestStatus.REJECTED,
      resolvedByUserId: data.resolvedByUserId,
      rejectionReason: data.reason,
      resolvedAt: new Date(),
    },
  });
}
