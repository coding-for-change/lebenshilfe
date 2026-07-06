import type { HistoryQuery } from "./schemas";

// Resolves which period the history tab should show. An explicit query wins;
// otherwise default to the most recent month that has data, falling back to
// the current month when the child has none.
export function resolveHistoryPeriod(
  query: HistoryQuery | undefined,
  bounds: { earliest: Date; latest: Date } | null,
): HistoryQuery {
  if (query) return query;
  const base = bounds ? bounds.latest : new Date();
  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    order: "desc",
  };
}

// Half-open [from, to) UTC range for a single month, or the whole year when
// `month` is null ("Alle"). Date.UTC normalises month 12 → next January.
export function historyRange(period: HistoryQuery): { from: Date; to: Date } {
  const { year, month } = period;
  if (month === null) {
    return {
      from: new Date(Date.UTC(year, 0, 1)),
      to: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 1)),
  };
}
