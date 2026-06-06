"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollHint } from "@/components/scroll-hint";

type SearchableTableProps<T> = {
  rows: T[];
  filterBy: (row: T, query: string) => boolean;
  placeholder?: string;
  emptyState?: ReactNode;
  children: (filteredRows: T[]) => ReactNode;
  /**
   * Optional per-row mobile card renderer. When provided, the desktop table
   * (`children`) is hidden below `md` and a vertical stack of cards is shown
   * instead — so wide tables no longer force horizontal scrolling on phones.
   */
  renderCard?: (row: T) => ReactNode;
  /** Stable key for each card; falls back to the array index. */
  getRowKey?: (row: T) => string;
};

export function SearchableTable<T>({
  rows,
  filterBy,
  placeholder = "Suchen…",
  emptyState,
  children,
  renderCard,
  getRowKey,
}: SearchableTableProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rows;
    return rows.filter((row) => filterBy(row, trimmed));
  }, [rows, query, filterBy]);

  const showEmpty = filtered.length === 0 && emptyState;

  return (
    <div className="space-y-3">
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {showEmpty ? (
        emptyState
      ) : renderCard ? (
        <>
          <ul className="space-y-2 md:hidden">
            {filtered.map((row, i) => (
              <li key={getRowKey ? getRowKey(row) : i}>{renderCard(row)}</li>
            ))}
          </ul>
          <ScrollHint className="hidden md:block">
            {children(filtered)}
          </ScrollHint>
        </>
      ) : (
        <ScrollHint>{children(filtered)}</ScrollHint>
      )}
    </div>
  );
}
