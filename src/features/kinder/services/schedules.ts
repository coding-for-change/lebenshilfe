import { prisma } from "@/lib/prisma";

export async function listSchedulesForChild(childId: string) {
  return prisma.schedule.findMany({
    where: { childId },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function listSchedulesForChildren(childIds: string[]) {
  if (childIds.length === 0) return [];
  return prisma.schedule.findMany({
    where: { childId: { in: childIds } },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function createSchedule(data: {
  childId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}) {
  return prisma.schedule.create({ data });
}

export async function updateSchedule(
  id: string,
  data: Partial<{ weekday: number; startTime: string; endTime: string }>,
) {
  return prisma.schedule.update({ where: { id }, data });
}

export async function deleteScheduleById(id: string) {
  await prisma.schedule.delete({ where: { id } });
}
