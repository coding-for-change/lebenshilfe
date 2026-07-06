import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type ChildWithRelations = Prisma.ChildGetPayload<{
  include: {
    kostentraeger: true;
    school: { include: { holidayPlan: { include: { holidays: true } } } };
    pool: true;
    assignments: { include: { user: true } };
    schedules: true;
    absences: true;
    vertretungen: { include: { substituteUser: true } };
  };
}>;

const childInclude = {
  kostentraeger: true,
  school: {
    include: {
      holidayPlan: { include: { holidays: { orderBy: { startDate: "asc" } } } },
    },
  },
  pool: true,
  assignments: { include: { user: true } },
  schedules: true,
  absences: true,
  vertretungen: { include: { substituteUser: true } },
} satisfies Prisma.ChildInclude;

export async function listChildren(): Promise<ChildWithRelations[]> {
  return prisma.child.findMany({
    include: childInclude,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function findChildById(id: string) {
  return prisma.child.findUnique({ where: { id }, include: childInclude });
}

// Lightweight existence check (no relations) for callers that only need to
// know a child id is valid before referencing it.
export async function childExists(id: string) {
  const child = await prisma.child.findUnique({
    where: { id },
    select: { id: true },
  });
  return child !== null;
}

// Restricts the search to children currently assigned to this Schulbegleiter
// — a user must never be able to look up the names of children outside their
// own caseload. Note: assignments are hard-deleted, so an unassigned child
// drops out of the results immediately (there is no "previously assigned").
export async function searchAssignedChildrenByName(
  userId: string,
  query: string,
  limit = 10,
) {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];
  return prisma.child.findMany({
    where: {
      assignments: { some: { userId } },
      OR: [
        { firstName: { contains: trimmed } },
        { lastName: { contains: trimmed } },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: limit,
  });
}

type ChildFields = {
  firstName?: string;
  lastName?: string;
  leosOne?: boolean;
  bescheid?: string | null;
  sbIb?: string | null;
  approvedDirectHours?: number | null;
  approvedIndirectHours?: number | null;
  vorviertelstunde?: boolean;
  nachviertelstunde?: boolean;
  ausflugSchullandheim?: boolean;
  schweigepflichtsentbindung?: boolean;
  bemerkung?: string | null;
  kostentraegerId?: string | null;
  schoolId?: string | null;
};

export async function createChild(
  fields: ChildFields & {
    firstName: string;
    lastName: string;
  },
) {
  return prisma.child.create({ data: fields });
}

export async function updateChild(id: string, fields: ChildFields) {
  return prisma.child.update({ where: { id }, data: fields });
}

export async function deleteChildById(id: string) {
  await prisma.child.delete({ where: { id } });
}
