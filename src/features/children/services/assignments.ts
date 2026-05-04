import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type AssignmentWithUser = Prisma.ChildAssignmentGetPayload<{
  include: { user: true };
}>;

export async function listAssignmentsForChild(childId: string) {
  return prisma.childAssignment.findMany({
    where: { childId },
    include: { user: true },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function listAssignmentsForUser(userId: string) {
  return prisma.childAssignment.findMany({
    where: { userId },
    include: { child: true },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function createAssignment(data: {
  childId: string;
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  tandem: boolean;
}) {
  return prisma.childAssignment.create({ data });
}

export async function updateAssignment(
  id: string,
  data: Partial<{
    userId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    tandem: boolean;
  }>,
) {
  return prisma.childAssignment.update({ where: { id }, data });
}

export async function deleteAssignmentById(id: string) {
  await prisma.childAssignment.delete({ where: { id } });
}
