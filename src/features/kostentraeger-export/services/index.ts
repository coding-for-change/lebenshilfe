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
  /** Bill a quarter hour before the daily direct service. */
  vorviertelstunde: boolean;
  /** Bill a quarter hour after the daily direct service. */
  nachviertelstunde: boolean;
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
      vorviertelstunde: true,
      nachviertelstunde: true,
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
    vorviertelstunde: child.vorviertelstunde,
    nachviertelstunde: child.nachviertelstunde,
  };
}

export type ExportEvent = Prisma.EventGetPayload<{
  select: {
    id: true;
    type: true;
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
 * All WORK and INDIRECT events for a child within `[startInclusive,
 * endExclusive)`, excluding soft-deleted entries.
 */
export async function listEventsForChildInRange(
  childId: string,
  startInclusive: Date,
  endExclusive: Date,
): Promise<ExportEvent[]> {
  return prisma.event.findMany({
    where: {
      childId,
      type: { in: [EventType.WORK, EventType.INDIRECT] },
      date: { gte: startInclusive, lt: endExclusive },
      deleted: false,
    },
    select: {
      id: true,
      type: true,
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
