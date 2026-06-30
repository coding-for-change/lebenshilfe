import { prisma } from "@/lib/prisma";
import { EventType } from "@/generated/prisma";

export async function findSickEventsInRange(from: Date, to: Date) {
  return prisma.event.findMany({
    where: {
      type: EventType.SICK,
      deleted: false,
      date: { gte: from, lte: to },
    },
    select: {
      id: true,
      userId: true,
      date: true,
      user: { select: { id: true, name: true } },
    },
  });
}

export async function findAssignmentsByUserIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  return prisma.childAssignment.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      weekday: true,
      child: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function findVertretungenInRange(from: Date, to: Date) {
  return prisma.childVertretung.findMany({
    where: { date: { gte: from, lte: to } },
    select: {
      childId: true,
      date: true,
      substituteUserId: true,
      child: { select: { firstName: true, lastName: true } },
      substituteUser: { select: { name: true } },
    },
  });
}

export async function findChildAbsencesInRange(from: Date, to: Date) {
  return prisma.childAbsence.findMany({
    where: { date: { gte: from, lte: to } },
    select: {
      childId: true,
      date: true,
      note: true,
      child: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function findWorkEventsForChildrenOnDates(
  pairs: { childId: string; date: Date }[],
) {
  if (pairs.length === 0) return [];
  return prisma.event.findMany({
    where: {
      type: EventType.WORK,
      deleted: false,
      OR: pairs.map((p) => ({ childId: p.childId, date: p.date })),
    },
    select: {
      id: true,
      childId: true,
      date: true,
      startTime: true,
      endTime: true,
      userId: true,
      user: { select: { name: true } },
    },
  });
}

/**
 * Schedule blocks across all children with the child's school holiday plan
 * attached. Used to detect uncovered weekday slots (after subtracting holiday
 * dates and existing assignments / Vertretungen).
 */
export async function findAllSchedulesWithHolidayPlan() {
  return prisma.schedule.findMany({
    select: {
      childId: true,
      weekday: true,
      startTime: true,
      endTime: true,
      child: {
        select: {
          firstName: true,
          lastName: true,
          school: {
            select: {
              holidayPlan: {
                select: {
                  holidays: { select: { startDate: true, endDate: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

/** All child→user assignments (weekday-based). Used for unassigned-block detection. */
export async function findAllAssignments() {
  return prisma.childAssignment.findMany({
    select: { childId: true, weekday: true, userId: true },
  });
}

/**
 * All WORK events touching a child in the range. Returned with startTime/endTime
 * so the facade can sum daily minutes per (child, date) and compare against
 * Schedule minutes.
 */
export async function findChildWorkEventsInRange(from: Date, to: Date) {
  return prisma.event.findMany({
    where: {
      type: EventType.WORK,
      deleted: false,
      date: { gte: from, lte: to },
      childId: { not: null },
    },
    select: {
      childId: true,
      date: true,
      startTime: true,
      endTime: true,
    },
  });
}

/**
 * All children currently missing the Schweigepflichtsentbindung. Static — not
 * date-bound.
 */
export async function findChildrenMissingSchweigepflicht() {
  return prisma.child.findMany({
    where: { schweigepflichtsentbindung: false },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
