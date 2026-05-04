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

export async function deleteAbsenceById(id: string) {
  await prisma.childAbsence.delete({ where: { id } });
}
