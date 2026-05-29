import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";

export type ChildWorkEvent = Prisma.EventGetPayload<{
  include: { user: true };
}>;

export async function listWorkEventsForChild(
  childId: string,
): Promise<ChildWorkEvent[]> {
  return prisma.event.findMany({
    where: { childId, type: EventType.WORK },
    include: { user: true },
    orderBy: { date: "desc" },
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
