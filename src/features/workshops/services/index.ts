import { prisma } from "@/lib/prisma";

export async function listWorkshops() {
  return prisma.workshop.findMany({ orderBy: { createdAt: "desc" } });
}

export async function findWorkshopById(id: string) {
  return prisma.workshop.findUnique({ where: { id } });
}

export async function insertWorkshop(name: string, description: string | null) {
  return prisma.workshop.create({ data: { name, description } });
}

export async function updateWorkshopFields(
  id: string,
  name: string,
  description: string | null,
) {
  return prisma.workshop.update({ where: { id }, data: { name, description } });
}

export async function deleteWorkshopById(id: string) {
  return prisma.workshop.delete({ where: { id } });
}

export async function countAttendancesForWorkshop(workshopId: string) {
  return prisma.workshopAttendance.count({ where: { workshopId } });
}
