"use client";

import { ChevronDown, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export type ChildOption = {
  id: string;
  firstName: string;
  lastName: string;
  vorviertelstunde: boolean;
  nachviertelstunde: boolean;
};

type Props = {
  options: ChildOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  minSelectable?: number;
};

export function ChildrenFilter({
  options,
  selected,
  onChange,
  label = "Kinder",
  minSelectable = 0,
}: Props) {
  const allIds = options.map((c) => c.id);
  const allSelected = selected.length === allIds.length && allIds.length > 0;

  const summary =
    selected.length === 0
      ? "Keine ausgewählt"
      : selected.length === allIds.length
        ? "Alle Kinder"
        : options
            .filter((c) => selected.includes(c.id))
            .map((c) => c.firstName)
            .join(", ");

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    if (next.length < minSelectable) return;
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 justify-between gap-2"
        >
          <Users className="size-4" />
          <span className="truncate max-w-[180px] text-left">{summary}</span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
      >
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <Separator />
        <div className="p-2">
          <label
            htmlFor="children-filter-all"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Checkbox
              id="children-filter-all"
              checked={allSelected}
              onCheckedChange={() => onChange(allSelected ? [] : allIds)}
            />
            <span>Alle auswählen</span>
          </label>
          <Separator className="my-1" />
          {options.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Noch keinem Kind zugewiesen.
            </p>
          ) : (
            options.map((c) => (
              <label
                key={c.id}
                htmlFor={`children-filter-${c.id}`}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  id={`children-filter-${c.id}`}
                  checked={selected.includes(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                />
                <span>
                  {c.firstName} {c.lastName}
                </span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
