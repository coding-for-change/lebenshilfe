import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type VertretungWithRelations = Prisma.ChildVertretungGetPayload<{
  include: { originalUser: true; substituteUser: true };
}>;

export async function listVertretungenForChild(childId: string) {
  return prisma.childVertretung.findMany({
    where: { childId },
    include: { originalUser: true, substituteUser: true },
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
    include: { child: true, originalUser: true },
    orderBy: { date: "asc" },
  });
}

export async function listVertretungenForUserAsOriginal(
  userId: string,
  from: Date,
  to: Date,
) {
  return prisma.childVertretung.findMany({
    where: { originalUserId: userId, date: { gte: from, lt: to } },
    include: { child: true, substituteUser: true },
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
