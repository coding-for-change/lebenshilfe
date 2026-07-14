import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type AssignmentWithProfile = Prisma.ChildAssignmentGetPayload<{
  include: { profile: true };
}>;

export async function listAssignmentsForChild(childId: string) {
  return prisma.childAssignment.findMany({
    where: { childId },
    include: { profile: true },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function listAssignmentsForUser(userId: string) {
  return prisma.childAssignment.findMany({
    where: { profile: { userId } },
    include: { child: true },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function createAssignment(data: {
  childId: string;
  profileId: string;
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
    profileId: string;
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

/**
 * Returns the set of childIds that userId has a recurring assignment for
 * on the given weekday (Mon=0..Sun=6). Used for cross-feature access checks.
 */
export async function getAssignmentCoverage(
  userId: string,
  childIds: string[],
  weekday: number,
): Promise<Set<string>> {
  if (childIds.length === 0) return new Set();
  const rows = await prisma.childAssignment.findMany({
    where: { profile: { userId }, childId: { in: childIds }, weekday },
    select: { childId: true },
  });
  return new Set(rows.map((r) => r.childId));
}
