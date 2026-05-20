import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";

export type ExportChild = {
  id: string;
  firstName: string;
  lastName: string;
};

/** Minimal child record needed for the Einsatznachweis header. */
export async function findChildForExport(
  childId: string,
): Promise<ExportChild | null> {
  return prisma.child.findUnique({
    where: { id: childId },
    select: { id: true, firstName: true, lastName: true },
  });
}

export type ExportWorkEvent = Prisma.EventGetPayload<{
  select: {
    id: true;
    date: true;
    startTime: true;
    endTime: true;
    note: true;
    userId: true;
    user: { select: { id: true; name: true } };
  };
}>;

/**
 * All direct-service (WORK) events for a child within `[startInclusive,
 * endExclusive)`, joined with the Schulbegleiter who logged them.
 */
export async function listWorkEventsForChildInRange(
  childId: string,
  startInclusive: Date,
  endExclusive: Date,
): Promise<ExportWorkEvent[]> {
  return prisma.event.findMany({
    where: {
      childId,
      type: EventType.WORK,
      date: { gte: startInclusive, lt: endExclusive },
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      note: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}
