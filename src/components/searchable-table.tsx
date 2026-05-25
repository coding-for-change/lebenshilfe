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
};

export function SearchableTable<T>({
  rows,
  filterBy,
  placeholder = "Suchen…",
  emptyState,
  children,
}: SearchableTableProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rows;
    return rows.filter((row) => filterBy(row, trimmed));
  }, [rows, query, filterBy]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {filtered.length === 0 && emptyState ? (
        emptyState
      ) : (
        <ScrollHint>{children(filtered)}</ScrollHint>
      )}
    </div>
  );
}
