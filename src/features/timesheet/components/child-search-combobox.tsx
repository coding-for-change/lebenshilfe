"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { debounce } from "perfect-debounce";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { searchChildrenForSubstituteAction } from "../actions";

export type ChildOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type Props = {
  id?: string;
  value: ChildOption | null;
  onChange: (child: ChildOption | null) => void;
  placeholder?: string;
};

function displayName(c: ChildOption) {
  return `${c.firstName} ${c.lastName}`;
}

export function ChildSearchCombobox({
  id,
  value,
  onChange,
  placeholder = "Kind suchen…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChildOption[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.trim().length < 1) {
          setResults([]);
          setLoading(false);
          return;
        }
        try {
          const rows = await searchChildrenForSubstituteAction(q);
          setResults(rows);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 250),
    [],
  );

  useEffect(() => () => search.cancel(), [search]);

  useEffect(() => {
    if (!open) return;
    setLoading(query.trim().length > 0);
    void search(query);
  }, [query, open, search]);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value ? displayName(value) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Vor- oder Nachname tippen…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Suche…
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {query.trim().length === 0
                    ? "Mindestens einen Buchstaben tippen."
                    : "Keine Treffer."}
                </CommandEmpty>
                <CommandGroup>
                  {results.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        onChange(c.id === value?.id ? null : c);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          value?.id === c.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {displayName(c)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
