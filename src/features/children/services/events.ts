import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";
import type { WorkEventInput, UpdateWorkEventInput } from "../schemas";

export type ChildWorkEvent = Prisma.EventGetPayload<{
  include: { user: true };
}>;

export async function listWorkEventsForChild(
  childId: string,
): Promise<ChildWorkEvent[]> {
  return prisma.event.findMany({
    where: {
      childId,
      type: { in: [EventType.WORK, EventType.INDIRECT] },
    },
    include: { user: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function createWorkEventAsAdmin(input: WorkEventInput) {
  return prisma.event.create({
    data: {
      childId: input.childId,
      userId: input.userId,
      type: EventType.WORK,
      date: new Date(`${input.date}T00:00:00.000Z`),
      startTime: input.startTime,
      endTime: input.endTime,
      note: input.note ?? null,
    },
  });
}

export async function updateWorkEventAsAdmin(
  id: string,
  input: UpdateWorkEventInput,
) {
  const existing = await prisma.event.findUniqueOrThrow({ where: { id } });
  // we care about what the original event looks like, not what admins moved around.
  if (existing.signatureKey) {
    await prisma.event.update({
      where: { id },
      data: { deleted: true },
    });

    return prisma.event.create({
      data: {
        childId: existing.childId,
        userId: input.userId ?? existing.userId,
        type: existing.type,
        date: input.date
          ? new Date(`${input.date}T00:00:00.000Z`)
          : existing.date,
        startTime:
          input.startTime !== undefined ? input.startTime : existing.startTime,
        endTime: input.endTime !== undefined ? input.endTime : existing.endTime,
        note: input.note !== undefined ? input.note : existing.note,
        signatureKey: null,
        deleted: false,
      },
    });
  } else {
    return prisma.event.update({
      where: { id },
      data: {
        userId: input.userId ?? undefined,
        date: input.date ? new Date(`${input.date}T00:00:00.000Z`) : undefined,
        startTime: input.startTime !== undefined ? input.startTime : undefined,
        endTime: input.endTime !== undefined ? input.endTime : undefined,
        note: input.note !== undefined ? input.note : undefined,
      },
    });
  }
}

export async function deleteWorkEventAsAdmin(id: string) {
  const existing = await prisma.event.findUniqueOrThrow({ where: { id } });
  if (existing.signatureKey) {
    return prisma.event.update({
      where: { id },
      data: { deleted: true },
    });
  } else {
    return prisma.event.delete({
      where: { id },
    });
  }
}

export async function restoreWorkEventAsAdmin(id: string) {
  return prisma.event.update({
    where: { id },
    data: { deleted: false },
  });
}

export async function listWorkEventsForChildInRange(
  childId: string,
  from: Date,
  to: Date,
): Promise<ChildWorkEvent[]> {
  return prisma.event.findMany({
    where: { childId, type: EventType.WORK, date: { gte: from, lte: to } },
    include: { user: true },
    orderBy: { date: "asc" },
  });
}
