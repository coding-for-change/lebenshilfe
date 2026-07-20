import { prisma } from "@/lib/prisma";

export async function listVertretungenForChild(childId: string) {
  return prisma.childVertretung.findMany({
    where: { childId },
    include: { substituteProfile: true },
    orderBy: { date: "asc" },
  });
}

export async function listVertretungenForUserAsSubstitute(
  userId: string,
  from: Date,
  to: Date,
) {
  return prisma.childVertretung.findMany({
    where: { substituteProfile: { userId }, date: { gte: from, lt: to } },
    include: { child: true },
    orderBy: { date: "asc" },
  });
}

export async function createVertretungBlocks(data: {
  childId: string;
  substituteProfileId: string;
  date: Date;
  timeBlocks: { startTime: string; endTime: string }[];
}) {
  await prisma.childVertretung.createMany({
    data: data.timeBlocks.map((block) => ({
      childId: data.childId,
      substituteProfileId: data.substituteProfileId,
      date: data.date,
      startTime: block.startTime,
      endTime: block.endTime,
    })),
  });
}

export async function updateVertretungSubstituteForDate(
  childId: string,
  date: Date,
  substituteProfileId: string,
) {
  await prisma.childVertretung.updateMany({
    where: { childId, date },
    data: { substituteProfileId },
  });
}

export async function deleteVertretungByChildAndDate(
  childId: string,
  date: Date,
) {
  await prisma.childVertretung.deleteMany({ where: { childId, date } });
}

export async function syncVertretungBlocksForChildWeekday(
  childId: string,
  weekday: number,
) {
  const schedules = await prisma.schedule.findMany({
    where: { childId, weekday },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  if (schedules.length === 0) return;

  const allRows = await prisma.childVertretung.findMany({
    where: { childId },
    select: { date: true, substituteProfileId: true },
  });

  const byDate = new Map<string, { date: Date; substituteProfileId: string }>();
  for (const row of allRows) {
    const wd = (row.date.getUTCDay() + 6) % 7;
    if (wd !== weekday) continue;
    const key = row.date.toISOString();
    if (!byDate.has(key)) {
      byDate.set(key, {
        date: row.date,
        substituteProfileId: row.substituteProfileId,
      });
    }
  }

  if (byDate.size === 0) return;

  const entries = Array.from(byDate.values());
  const dates = entries.map((e) => e.date);

  await prisma.childVertretung.deleteMany({
    where: { childId, date: { in: dates } },
  });

  await prisma.childVertretung.createMany({
    data: entries.flatMap((entry) =>
      schedules.map((s) => ({
        childId,
        substituteProfileId: entry.substituteProfileId,
        date: entry.date,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    ),
  });
}

export async function getVertretungCoverage(
  userId: string,
  childIds: string[],
  date: Date,
): Promise<Set<string>> {
  if (childIds.length === 0) return new Set();
  const rows = await prisma.childVertretung.findMany({
    where: { substituteProfile: { userId }, childId: { in: childIds }, date },
    select: { childId: true },
  });
  return new Set(rows.map((r) => r.childId));
}
