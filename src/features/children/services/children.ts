import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type ChildWithRelations = Prisma.ChildGetPayload<{
  include: {
    kostentraeger: true;
    school: { include: { holidayPlan: { include: { holidays: true } } } };
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

type ChildFields = {
  firstName?: string;
  lastName?: string;
  leosOne?: boolean;
  bescheid?: string | null;
  sbIb?: string | null;
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
