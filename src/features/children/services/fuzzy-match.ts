import { prisma } from "@/lib/prisma";

export type MatchResult = {
  childId: string;
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function exactMatchChild(
  nameText: string,
): Promise<MatchResult | null> {
  const query = normalize(nameText);
  const children = await prisma.child.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  for (const child of children) {
    const full = normalize(`${child.firstName} ${child.lastName}`);
    const reversed = normalize(`${child.lastName} ${child.firstName}`);
    if (query === full || query === reversed) {
      return { childId: child.id };
    }
  }

  return null;
}
