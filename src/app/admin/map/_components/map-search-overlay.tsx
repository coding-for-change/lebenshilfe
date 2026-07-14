"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { MapSchool } from "../types";

type Entry = {
  schoolKey: string;
  schoolName: string;
  label: string;
  kind: "child" | "assistant";
  searchValue: string;
};

function buildIndex(schools: MapSchool[]): Entry[] {
  const entries: Entry[] = [];
  const seenAssistants = new Set<string>();
  for (const school of schools) {
    for (const child of school.children) {
      const fullName = `${child.firstName} ${child.lastName}`;
      const assistantNames = child.assistants.map((a) => a.name).join("|");
      entries.push({
        schoolKey: school.key,
        schoolName: school.name || "Schule",
        label: fullName,
        kind: "child",
        searchValue: `kind:${fullName}|${school.name}|${child.id}|${assistantNames}`,
      });
      for (const a of child.assistants) {
        const dedupeKey = `${school.key}::${a.profileId}`;
        if (seenAssistants.has(dedupeKey)) continue;
        seenAssistants.add(dedupeKey);
        entries.push({
          schoolKey: school.key,
          schoolName: school.name || "Schule",
          label: a.name,
          kind: "assistant",
          searchValue: `sb:${a.name}|${school.name}|${a.profileId}`,
        });
      }
    }
  }
  return entries;
}

export function MapSearchOverlay({
  schools,
  onSelect,
}: {
  schools: MapSchool[];
  onSelect: (schoolKey: string) => void;
}) {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => buildIndex(schools), [schools]);
  const open = query.trim().length > 0;

  const childEntries = entries.filter((e) => e.kind === "child");
  const assistantEntries = entries.filter((e) => e.kind === "assistant");

  return (
    <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100%-2rem)]">
      <Command
        shouldFilter
        className="rounded-lg border bg-popover/95 shadow-lg backdrop-blur"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Kind oder Schulbegleiter suchen…"
        />
        {open ? (
          <CommandList>
            <CommandEmpty>Keine Treffer.</CommandEmpty>
            {childEntries.length > 0 ? (
              <CommandGroup heading="Kinder">
                {childEntries.map((e) => (
                  <CommandItem
                    key={`child-${e.searchValue}`}
                    value={e.searchValue}
                    onSelect={() => {
                      onSelect(e.schoolKey);
                      setQuery("");
                    }}
                  >
                    <Search />
                    <span className="flex-1">{e.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.schoolName}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {assistantEntries.length > 0 ? (
              <CommandGroup heading="Schulbegleiter">
                {assistantEntries.map((e) => (
                  <CommandItem
                    key={`sb-${e.searchValue}`}
                    value={e.searchValue}
                    onSelect={() => {
                      onSelect(e.schoolKey);
                      setQuery("");
                    }}
                  >
                    <Search />
                    <span className="flex-1">{e.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.schoolName}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        ) : null}
      </Command>
    </div>
  );
}
