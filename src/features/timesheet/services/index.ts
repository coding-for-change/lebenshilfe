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
  // child (one per weekday), so we dedupe by child id before returning.
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
    where: { userId, deleted: false, date: { gte: start, lt: endExclusive } },
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

// One Event row per (child, Stundenplan block). A child with several schedule
// blocks on the day therefore produces several WORK entries (COD-48).
export async function insertWorkEvents(args: {
  userId: string;
  date: Date;
  blocks: { childId: string; startTime: string; endTime: string }[];
  note?: string | null;
  signatureKey: string;
}) {
  return prisma.event.createMany({
    data: args.blocks.map((block) => ({
      userId: args.userId,
      childId: block.childId,
      type: EventType.WORK,
      date: args.date,
      startTime: block.startTime,
      endTime: block.endTime,
      note: args.note ?? null,
      signatureKey: args.signatureKey,
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

export async function findEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

export async function signWorkEvents(
  userId: string,
  eventIds: string[],
  signatureKey: string,
) {
  return prisma.event.updateMany({
    where: {
      id: { in: eventIds },
      userId,
      type: EventType.WORK,
      signatureKey: null,
      deleted: false,
    },
    data: { signatureKey },
  });
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
