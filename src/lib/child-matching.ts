import { prisma } from "@/lib/prisma";

export type ChildMatchResult = {
  childId: string;
  vorviertelstunde: boolean;
  nachviertelstunde: boolean;
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function exactMatchChild(
  nameText: string,
): Promise<ChildMatchResult | null> {
  const query = normalize(nameText);
  const children = await prisma.child.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      vorviertelstunde: true,
      nachviertelstunde: true,
    },
  });

  for (const child of children) {
    const full = normalize(`${child.firstName} ${child.lastName}`);
    const reversed = normalize(`${child.lastName} ${child.firstName}`);
    if (query === full || query === reversed) {
      return {
        childId: child.id,
        vorviertelstunde: child.vorviertelstunde,
        nachviertelstunde: child.nachviertelstunde,
      };
    }
  }

  return null;
}
