import { prisma } from "@/lib/prisma";

// Replaces the full set of members on a pool: unlinks those removed, links the
// listed ones (moving them out of any other pool — one pool per member).
export async function setPoolChildren(poolId: string, childIds: string[]) {
  await prisma.$transaction([
    prisma.child.updateMany({
      where: { poolId, id: { notIn: childIds } },
      data: { poolId: null },
    }),
    prisma.child.updateMany({
      where: { id: { in: childIds } },
      data: { poolId },
    }),
  ]);
}

export async function setPoolAssistants(poolId: string, profileIds: string[]) {
  await prisma.$transaction([
    prisma.schoolAssistantProfile.updateMany({
      where: { poolId, id: { notIn: profileIds } },
      data: { poolId: null },
    }),
    prisma.schoolAssistantProfile.updateMany({
      where: { id: { in: profileIds } },
      data: { poolId },
    }),
  ]);
}
