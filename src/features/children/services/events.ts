import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";

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
    orderBy: { date: "desc" },
  });
}
