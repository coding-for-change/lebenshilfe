import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type SchoolWithRelations = Prisma.SchoolGetPayload<{
  include: {
    holidayPlan: { include: { holidays: true } };
    _count: { select: { children: true } };
  };
}>;

const schoolInclude = {
  holidayPlan: { include: { holidays: { orderBy: { startDate: "asc" } } } },
  _count: { select: { children: true } },
} satisfies Prisma.SchoolInclude;

export async function listSchools(): Promise<SchoolWithRelations[]> {
  return prisma.school.findMany({
    include: schoolInclude,
    orderBy: { name: "asc" },
  });
}

export async function findSchoolById(id: string) {
  return prisma.school.findUnique({ where: { id }, include: schoolInclude });
}

export type SchoolData = {
  name: string;
  address: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  holidayPlanId: string | null;
};

export async function createSchool(data: SchoolData) {
  return prisma.school.create({ data });
}

export async function updateSchool(id: string, data: Partial<SchoolData>) {
  return prisma.school.update({ where: { id }, data });
}

export async function deleteSchoolById(id: string) {
  await prisma.school.delete({ where: { id } });
}

export async function assignHolidayPlan(
  schoolIds: string[],
  holidayPlanId: string | null,
) {
  return prisma.school.updateMany({
    where: { id: { in: schoolIds } },
    data: { holidayPlanId },
  });
}
