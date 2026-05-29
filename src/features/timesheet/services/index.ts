import { prisma } from "@/lib/prisma";
import { uploadSignaturePng } from "@/lib/storage";
import { EventType, Prisma } from "@/generated/prisma";
import {
  WEEKDAYS,
  emptyAssignmentsByWeekday,
  type AssignmentsByWeekday,
} from "../weekday";

export async function getAssignedChildren(userId: string) {
  // A Schulbegleiter can have multiple ChildAssignment rows for the same
  // child (one per weekday after the cod-14 schema change), so we dedupe
  // by child id before returning.
  const rows = await prisma.childAssignment.findMany({
    where: { userId },
    include: { child: true },
    orderBy: { child: { firstName: "asc" } },
  });
  const seen = new Set<string>();
  const unique: (typeof rows)[number]["child"][] = [];
  for (const r of rows) {
    if (seen.has(r.child.id)) continue;
    seen.add(r.child.id);
    unique.push(r.child);
  }
  return unique;
}

// Returns the per-weekday list of children this Schulbegleiter is assigned
// to. The DB stores `weekday` as Mon=0..Sun=6; we map each row into the
// corresponding key on AssignmentsByWeekday and dedupe ids per day.
export async function getAssignmentsByWeekday(
  userId: string,
): Promise<AssignmentsByWeekday> {
  const rows = await prisma.childAssignment.findMany({
    where: { userId },
    select: { childId: true, weekday: true },
  });
  const result = emptyAssignmentsByWeekday();
  const seen: Record<string, Set<string>> = {};
  for (const r of rows) {
    const key = WEEKDAYS[r.weekday];
    if (!key) continue;
    const set = (seen[key] ??= new Set());
    if (set.has(r.childId)) continue;
    set.add(r.childId);
    result[key].push(r.childId);
  }
  return result;
}

// Authorization guard: ensures every child the caller wants to log work for
// is actually assigned to their account. Prevents a client from submitting
// timesheet entries against a child they do not own.
export async function assertChildrenAssignedToUser(
  userId: string,
  childIds: string[],
  date: Date,
) {
  if (childIds.length === 0) return;
  const day = date.getDay() - 1; //0 indexed
  const count = await prisma.childAssignment.count({
    where: { userId, childId: { in: childIds }, weekday: day },
  });
  if (count !== childIds.length) {
    throw new Error("Ein Kind ist diesem Konto nicht zugewiesen.");
  }
}

export async function getSchedulesForChildren(childIds: string[]) {
  if (childIds.length === 0) return [];
  return prisma.schedule.findMany({
    where: { childId: { in: childIds } },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function getEventsForUserInRange(
  userId: string,
  start: Date,
  endExclusive: Date,
) {
  return prisma.event.findMany({
    where: { userId, date: { gte: start, lt: endExclusive } },
    include: {
      child: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getEventsForUserInMonth(
  userId: string,
  year: number,
  month: number,
) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return getEventsForUserInRange(userId, start, end);
}

export async function insertWorkEvents(args: {
  userId: string;
  childIds: string[];
  date: Date;
  startTime: string;
  endTime: string;
  note?: string | null;
  signatureKey: string;
  isSubstitute?: boolean;
}) {
  return prisma.event.createMany({
    data: args.childIds.map((childId) => ({
      userId: args.userId,
      childId,
      type: EventType.WORK,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      note: args.note ?? null,
      signatureKey: args.signatureKey,
      isSubstitute: args.isSubstitute ?? false,
    })),
  });
}

export async function insertSickEvent(args: {
  userId: string;
  date: Date;
  note?: string | null;
  signatureKey: string;
}) {
  return prisma.event.create({
    data: {
      userId: args.userId,
      childId: null,
      type: EventType.SICK,
      date: args.date,
      startTime: null,
      endTime: null,
      note: args.note ?? null,
      signatureKey: args.signatureKey,
    },
  });
}

export async function insertIndirectEvent(args: {
  userId: string;
  childId: string;
  date: Date;
  startTime: string;
  endTime: string;
  note: string;
  signatureKey: string;
}) {
  return prisma.event.create({
    data: {
      userId: args.userId,
      childId: args.childId,
      type: EventType.INDIRECT,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      note: args.note,
      signatureKey: args.signatureKey,
    },
  });
}

export async function assertChildExists(childId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { id: true },
  });
  if (!child) {
    throw new Error("Kind nicht gefunden.");
  }
}

// Restricts the search to children that have (now or previously) been
// assigned to this Schulbegleiter — a user must never be able to look up the
// names of children outside their own caseload.
export async function searchChildrenByName(
  userId: string,
  query: string,
  limit = 10,
) {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];
  return prisma.child.findMany({
    where: {
      assignments: { some: { userId } },
      OR: [
        { firstName: { contains: trimmed } },
        { lastName: { contains: trimmed } },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: limit,
  });
}

export async function getEventsForChildInRange(
  childId: string,
  start: Date,
  endExclusive: Date,
) {
  return prisma.event.findMany({
    where: { childId, date: { gte: start, lt: endExclusive } },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function findEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

export async function updateEventFields(
  id: string,
  data: Prisma.EventUpdateInput,
) {
  return prisma.event.update({ where: { id }, data });
}

export async function deleteEventById(id: string) {
  return prisma.event.delete({ where: { id } });
}

export async function findMonthlyReport(
  userId: string,
  year: number,
  month: number,
) {
  return prisma.monthlyReport.findUnique({
    where: { userId_year_month: { userId, year, month } },
  });
}

export async function listMonthlyReportsForUser(userId: string) {
  return prisma.monthlyReport.findMany({
    where: { userId },
    select: { year: true, month: true },
  });
}

export async function insertMonthlyReport(args: {
  userId: string;
  year: number;
  month: number;
  supervisorName: string;
  supervisorSignatureKey: string;
}) {
  return prisma.monthlyReport.create({ data: args });
}

export async function uploadSignature(key: string, pngBase64: string) {
  return uploadSignaturePng(key, pngBase64);
}
