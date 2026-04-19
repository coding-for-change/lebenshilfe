import { prisma } from "@/lib/prisma";
import { uploadSignaturePng } from "@/lib/storage";
import { EventType, Prisma } from "@/generated/prisma";

export async function getAssignedChildren(userId: string) {
  const rows = await prisma.childAssignment.findMany({
    where: { userId },
    include: { child: true },
    orderBy: { child: { firstName: "asc" } },
  });
  return rows.map((r) => r.child);
}

export async function assertChildrenAssignedToUser(
  userId: string,
  childIds: string[],
) {
  if (childIds.length === 0) return;
  const count = await prisma.childAssignment.count({
    where: { userId, childId: { in: childIds } },
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
    include: { child: true },
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
