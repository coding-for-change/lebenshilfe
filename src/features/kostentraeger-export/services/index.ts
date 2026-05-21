import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";

export type ExportChild = {
  id: string;
  firstName: string;
  lastName: string;
  /** Approved direct service hours per month (from the Bescheid). */
  approvedDirectHours: number | null;
  /** Approved indirect service hours per month (from the Bescheid). */
  approvedIndirectHours: number | null;
};

/** Minimal child record needed for the Einsatznachweis header and totals. */
export async function findChildForExport(
  childId: string,
): Promise<ExportChild | null> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      approvedDirectHours: true,
      approvedIndirectHours: true,
    },
  });
  if (!child) return null;
  return {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    approvedDirectHours:
      child.approvedDirectHours == null
        ? null
        : Number(child.approvedDirectHours),
    approvedIndirectHours:
      child.approvedIndirectHours == null
        ? null
        : Number(child.approvedIndirectHours),
  };
}

export type ExportWorkEvent = Prisma.EventGetPayload<{
  select: {
    id: true;
    date: true;
    startTime: true;
    endTime: true;
    note: true;
    signatureKey: true;
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
      signatureKey: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}
