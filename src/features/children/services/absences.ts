import { prisma } from "@/lib/prisma";

export async function listAbsencesForChild(childId: string) {
  return prisma.childAbsence.findMany({
    where: { childId },
    orderBy: { date: "desc" },
  });
}

export async function listAbsencesForChildrenInRange(
  childIds: string[],
  from: Date,
  to: Date,
) {
  if (childIds.length === 0) return [];
  return prisma.childAbsence.findMany({
    where: {
      childId: { in: childIds },
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
  });
}

export async function upsertAbsence(data: {
  childId: string;
  date: Date;
  note: string | null;
}) {
  return prisma.childAbsence.upsert({
    where: { childId_date: { childId: data.childId, date: data.date } },
    create: data,
    update: { note: data.note },
  });
}

/**
 * Records a Schulbegleiter-reported absence. Idempotent: if the child is
 * already marked absent for that date — whether by an admin or a previous
 * report — the existing row is kept untouched (the update is a no-op) so an
 * admin-created entry is never clobbered. `createdByUserId` is only stamped on
 * first creation, which is what scopes the revoke permission to the reporter.
 */
export async function reportChildAbsence(data: {
  childId: string;
  date: Date;
  note: string | null;
  createdByUserId: string;
}) {
  return prisma.childAbsence.upsert({
    where: { childId_date: { childId: data.childId, date: data.date } },
    create: data,
    update: {},
  });
}

export async function findAbsenceById(id: string) {
  return prisma.childAbsence.findUnique({ where: { id } });
}

export async function deleteAbsenceById(id: string) {
  await prisma.childAbsence.delete({ where: { id } });
}
