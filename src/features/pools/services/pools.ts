import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export type PoolWithRelations = Prisma.PoolGetPayload<{
  include: {
    school: true;
    kostentraeger: true;
    children: true;
    assistants: true;
    _count: { select: { children: true; assistants: true } };
  };
}>;

const poolInclude = {
  school: true,
  kostentraeger: true,
  children: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
  assistants: { orderBy: { name: "asc" } },
  _count: { select: { children: true, assistants: true } },
} satisfies Prisma.PoolInclude;

export async function listPools(): Promise<PoolWithRelations[]> {
  return prisma.pool.findMany({
    include: poolInclude,
    orderBy: { name: "asc" },
  });
}

export async function findPoolById(id: string) {
  return prisma.pool.findUnique({ where: { id }, include: poolInclude });
}

export async function createPool(data: {
  name: string;
  schoolId: string;
  kostentraegerId: string;
}) {
  return prisma.pool.create({ data });
}

export async function updatePool(
  id: string,
  data: { name?: string; schoolId?: string; kostentraegerId?: string },
) {
  return prisma.pool.update({ where: { id }, data });
}

export async function deletePoolById(id: string) {
  await prisma.pool.delete({ where: { id } });
}
