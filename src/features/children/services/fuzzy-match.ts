import { prisma } from "@/lib/prisma";

// Jaro-Winkler similarity — returns 0.0 (no match) to 1.0 (identical).
function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (la === 0 || lb === 0) return 0;

  const matchDistance = Math.floor(Math.max(la, lb) / 2) - 1;
  const aMatches = new Array<boolean>(la).fill(false);
  const bMatches = new Array<boolean>(lb).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < la; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, lb);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < la; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / la + matches / lb + (matches - transpositions / 2) / matches) /
    3;

  // Winkler boost: reward common prefix (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(la, lb)); i++) {
    if (a[i] !== b[i]) break;
    prefix++;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export type MatchResult = {
  childId: string;
  confidence: number;
};

export const MATCH_AUTO_THRESHOLD = 0.85;

export async function fuzzyMatchChild(
  nameText: string,
): Promise<MatchResult | null> {
  const children = await prisma.child.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  const query = normalize(nameText);
  let best: MatchResult | null = null;

  for (const child of children) {
    const full = normalize(`${child.firstName} ${child.lastName}`);
    const reversed = normalize(`${child.lastName} ${child.firstName}`);
    const score = Math.max(
      jaroWinkler(query, full),
      jaroWinkler(query, reversed),
    );

    if (best === null || score > best.confidence) {
      best = { childId: child.id, confidence: score };
    }
  }

  return best;
}
