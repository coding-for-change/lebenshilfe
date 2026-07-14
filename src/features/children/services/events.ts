import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";
import type { WorkEventInput, UpdateWorkEventInput } from "../schemas";

export type ChildWorkEvent = Prisma.EventGetPayload<{
  include: { user: true };
}>;

export async function listWorkEventsForChild(
  childId: string,
  range?: { from: Date; to: Date },
  order: Prisma.SortOrder = "desc",
): Promise<ChildWorkEvent[]> {
  return prisma.event.findMany({
    where: {
      childId,
      type: { in: [EventType.WORK, EventType.INDIRECT] },
      // `range` bounds the query to one month (or one year for "Alle") so the
      // history view never loads a child's entire event history at once.
      ...(range ? { date: { gte: range.from, lt: range.to } } : {}),
    },
    include: { user: true },
    orderBy: [{ date: order }, { createdAt: order }],
  });
}

/**
 * Earliest and latest work/indirect event dates for a child, or null when the
 * child has none. Drives the history period picker's year range and its
 * default selection (most recent month with data) without loading every row.
 */
export async function getEventDateBoundsForChild(
  childId: string,
): Promise<{ earliest: Date; latest: Date } | null> {
  const { _min, _max } = await prisma.event.aggregate({
    where: {
      childId,
      type: { in: [EventType.WORK, EventType.INDIRECT] },
    },
    _min: { date: true },
    _max: { date: true },
  });
  if (!_min.date || !_max.date) return null;
  return { earliest: _min.date, latest: _max.date };
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
        replacesEventId: existing.id,
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
    await prisma.event.update({ where: { id }, data: { deleted: true } });
  } else {
    await prisma.event.delete({ where: { id } });
  }
}

export async function restoreWorkEventAsAdmin(id: string) {
  // Undoing an edit: remove any unsigned replacement that was created when
  // this row was soft-deleted, otherwise both versions would appear in the
  // calendar.
  return prisma.$transaction(async (tx) => {
    await tx.event.deleteMany({
      where: { replacesEventId: id, signatureKey: null },
    });
    return tx.event.update({
      where: { id },
      data: { deleted: false },
    });
  });
}

export async function listWorkEventsForChildInRange(
  childId: string,
  from: Date,
  to: Date,
): Promise<ChildWorkEvent[]> {
  return prisma.event.findMany({
    where: {
      childId,
      type: EventType.WORK,
      date: { gte: from, lte: to },
      deleted: false,
    },
    include: { user: true },
    orderBy: { date: "asc" },
  });
}
