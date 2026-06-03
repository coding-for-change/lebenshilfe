import { prisma } from "@/lib/prisma";
import { nameSimilarity } from "@/lib/fuzzy";
import type { ChildMatchCandidate } from "../schemas";

/**
 * Score every child against a free-text name and return the best `limit`
 * candidates, highest score first. "Dumb" data access + pure scoring — the
 * confidence threshold / suggestion decision lives in the facade.
 */
export async function rankChildrenByName(
  query: string,
  limit = 5,
): Promise<ChildMatchCandidate[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const children = await prisma.child.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  return children
    .map((c) => ({
      childId: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      score: nameSimilarity(trimmed, `${c.firstName} ${c.lastName}`),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
