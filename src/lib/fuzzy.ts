/**
 * Dependency-free fuzzy string matching for German names.
 *
 * Used to match a free-text child name typed by a Schulbegleiter against the
 * child roster (see `ChildrenFacade.matchChildByFreeText`). Kept here in `lib/`
 * as cross-cutting infrastructure: it is pure string math with no domain or DB
 * knowledge, so any layer may use it.
 *
 * `nameSimilarity` returns a score in [0, 1] that is robust to umlaut spelling
 * (Müller ≈ Mueller), diacritics, punctuation, casing, and word order
 * (Max Mustermann ≈ Mustermann, Max).
 */

/**
 * Normalise a name for comparison: lowercase, expand German umlauts/ß to their
 * ASCII digraphs, strip remaining diacritics and punctuation, collapse spaces.
 */
export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortTokens(normalized: string): string {
  return normalized.split(" ").filter(Boolean).sort().join(" ");
}

function bigramCounts(value: string): Map<string, number> {
  const compact = value.replace(/\s+/g, "");
  const counts = new Map<string, number>();
  for (let i = 0; i < compact.length - 1; i++) {
    const bigram = compact.slice(i, i + 2);
    counts.set(bigram, (counts.get(bigram) ?? 0) + 1);
  }
  return counts;
}

/** Sørensen–Dice coefficient over character bigrams, in [0, 1]. */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const ba = bigramCounts(a);
  const bb = bigramCounts(b);
  let total = 0;
  let overlap = 0;
  for (const count of ba.values()) total += count;
  for (const count of bb.values()) total += count;
  for (const [bigram, count] of ba) {
    overlap += Math.min(count, bb.get(bigram) ?? 0);
  }
  return total === 0 ? 0 : (2 * overlap) / total;
}

/** Levenshtein edit distance (iterative, two-row). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Levenshtein similarity normalised to [0, 1]. */
export function levenshteinRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Combined similarity of two names in [0, 1]. Compares both as-is and with
 * tokens sorted (so first/last-name order does not matter), taking the best of
 * the Dice coefficient and the Levenshtein ratio.
 */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const direct = Math.max(diceCoefficient(na, nb), levenshteinRatio(na, nb));
  const sa = sortTokens(na);
  const sb = sortTokens(nb);
  const reordered = Math.max(diceCoefficient(sa, sb), levenshteinRatio(sa, sb));

  return Math.max(direct, reordered);
}
