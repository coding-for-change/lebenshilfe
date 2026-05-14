import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type CostBearerRecord = Prisma.KostentraegerGetPayload<object>;

export async function listKostentraeger() {
  return prisma.kostentraeger.findMany({ orderBy: { name: "asc" } });
}

export async function findKostentraegerById(id: string) {
  return prisma.kostentraeger.findUnique({ where: { id } });
}

export async function createKostentraeger(data: {
  name: string;
  email: string | null;
  address: string | null;
}) {
  return prisma.kostentraeger.create({ data });
}

export async function updateKostentraeger(
  id: string,
  data: { name: string; email: string | null; address: string | null },
) {
  return prisma.kostentraeger.update({ where: { id }, data });
}

export async function deleteKostentraegerById(id: string) {
  await prisma.kostentraeger.delete({ where: { id } });
}
