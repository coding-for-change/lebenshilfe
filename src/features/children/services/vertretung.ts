import { prisma } from "@/lib/prisma";

export async function listVertretungenForChild(childId: string) {
  return prisma.childVertretung.findMany({
    where: { childId },
    include: { substituteUser: true },
    orderBy: { date: "asc" },
  });
}

export async function listVertretungenForUserAsSubstitute(
  userId: string,
  from: Date,
  to: Date,
) {
  return prisma.childVertretung.findMany({
    where: { substituteUserId: userId, date: { gte: from, lt: to } },
    include: { child: true },
    orderBy: { date: "asc" },
  });
}

export async function createVertretung(data: {
  childId: string;
  substituteUserId: string;
  date: Date;
  startTime: string;
  endTime: string;
}) {
  return prisma.childVertretung.create({ data });
}

export async function updateVertretung(
  id: string,
  data: Partial<{
    substituteUserId: string;
    startTime: string;
    endTime: string;
  }>,
) {
  return prisma.childVertretung.update({ where: { id }, data });
}

export async function deleteVertretungById(id: string) {
  await prisma.childVertretung.delete({ where: { id } });
}

/**
 * After a Schedule is created or updated, re-compute the min/max time span
 * for that child+weekday and apply it to all future Vertretungen on matching
 * dates. If no schedules remain for that weekday (delete case), nothing is
 * changed — the existing snapshot is preserved.
 *
 * weekday uses Mon=0..Sun=6, matching the app's Schedule.weekday convention.
 */
export async function syncVertretungTimesForChildWeekday(
  childId: string,
  weekday: number,
) {
  const schedules = await prisma.schedule.findMany({
    where: { childId, weekday },
    select: { startTime: true, endTime: true },
  });
  if (schedules.length === 0) return; // schedule deleted — keep existing snapshot

  const newStart = schedules.reduce(
    (min, s) => (s.startTime < min ? s.startTime : min),
    schedules[0].startTime,
  );
  const newEnd = schedules.reduce(
    (max, s) => (s.endTime > max ? s.endTime : max),
    schedules[0].endTime,
  );

  const today = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    ),
  );

  // Fetch all future Vertretungen for this child, then filter to the matching
  // weekday in JS (Prisma / MySQL cannot filter @db.Date by weekday natively).
  const future = await prisma.childVertretung.findMany({
    where: { childId, date: { gte: today } },
    select: { id: true, date: true },
  });

  // Schedule weekday: Mon=0..Sun=6. JS Date.getUTCDay(): Sun=0..Sat=6.
  const matching = future.filter(
    (v) => (v.date.getUTCDay() + 6) % 7 === weekday,
  );
  if (matching.length === 0) return;

  await prisma.childVertretung.updateMany({
    where: { id: { in: matching.map((v) => v.id) } },
    data: { startTime: newStart, endTime: newEnd },
  });
}

/**
 * Returns the set of childIds from childVertretung where the given user
 * is the substitute on the exact date. Used for access validation.
 */
export async function getVertretungCoverage(
  substituteUserId: string,
  childIds: string[],
  date: Date,
): Promise<Set<string>> {
  if (childIds.length === 0) return new Set();
  const rows = await prisma.childVertretung.findMany({
    where: { substituteUserId, childId: { in: childIds }, date },
    select: { childId: true },
  });
  return new Set(rows.map((r) => r.childId));
}
