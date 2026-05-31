import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type HolidayPlanWithRelations = Prisma.HolidayPlanGetPayload<{
  include: {
    holidays: true;
    _count: { select: { schools: true } };
  };
}>;

const planInclude = {
  holidays: { orderBy: { startDate: "asc" } },
  _count: { select: { schools: true } },
} satisfies Prisma.HolidayPlanInclude;

export async function listHolidayPlans(): Promise<HolidayPlanWithRelations[]> {
  return prisma.holidayPlan.findMany({
    include: planInclude,
    orderBy: { name: "asc" },
  });
}

export async function findHolidayPlanById(id: string) {
  return prisma.holidayPlan.findUnique({ where: { id }, include: planInclude });
}

export type EntryData = {
  name: string | null;
  startDate: Date;
  endDate: Date;
};

export async function createHolidayPlan(name: string, entries: EntryData[]) {
  return prisma.holidayPlan.create({
    data: {
      name,
      holidays: entries.length ? { create: entries } : undefined,
    },
  });
}

export async function updateHolidayPlan(id: string, data: { name: string }) {
  return prisma.holidayPlan.update({ where: { id }, data });
}

export async function deleteHolidayPlanById(id: string) {
  await prisma.holidayPlan.delete({ where: { id } });
}

export async function createEntry(data: { planId: string } & EntryData) {
  return prisma.holidayPlanEntry.create({ data });
}

export async function updateEntryById(id: string, data: EntryData) {
  return prisma.holidayPlanEntry.update({ where: { id }, data });
}

export async function deleteEntryById(id: string) {
  await prisma.holidayPlanEntry.delete({ where: { id } });
}

// Holiday entries for the given plans that overlap [rangeStart, rangeEnd].
// Drives the Schulbegleiter "Heute sind Schulferien" banner. Two `@db.Date`
// columns model an inclusive range → overlap is start <= rangeEnd && end >= rangeStart.
export async function listEntriesForPlanIds(
  planIds: string[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  if (planIds.length === 0) return [];
  return prisma.holidayPlanEntry.findMany({
    where: {
      planId: { in: planIds },
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
    },
    orderBy: { startDate: "asc" },
  });
}
