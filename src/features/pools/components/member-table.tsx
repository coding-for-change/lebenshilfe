"use client";

import { useMemo, useState } from "react";
import { Plus, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MemberRow = {
  id: string;
  label: string;
  hint?: string;
  warn?: boolean;
};

type Props = {
  title: string;
  options: MemberRow[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  addLabel: string;
  emptyText: string;
  searchPlaceholder: string;
};

export function MemberTable({
  title,
  options,
  selectedIds,
  onAdd,
  onRemove,
  addLabel,
  emptyText,
  searchPlaceholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const rows = useMemo(
    () =>
      selectedIds.map((id) => byId.get(id)).filter((r): r is MemberRow => !!r),
    [selectedIds, byId],
  );
  const addable = useMemo(
    () => options.filter((o) => !selectedIds.includes(o.id)),
    [options, selectedIds],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {title}
          <span className="ml-1.5 text-muted-foreground">({rows.length})</span>
        </span>
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
            >
              <Plus className="size-4" /> {addLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-0"
            align="end"
          >
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>Keine Treffer.</CommandEmpty>
                <CommandGroup>
                  {addable.map((o) => (
                    <CommandItem
                      key={o.id}
                      value={`${o.label} ${o.hint ?? ""}`}
                      onSelect={() => {
                        onAdd(o.id);
                        setOpen(false);
                      }}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">{o.label}</span>
                        {o.hint ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {o.hint}
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-hidden rounded-lg border">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate font-medium">{r.label}</span>
                  {r.warn ? (
                    <TriangleAlert className="size-3.5 shrink-0 text-amber-600" />
                  ) : null}
                </span>
                {r.hint ? (
                  <span
                    className={cn(
                      "shrink-0 truncate text-xs text-muted-foreground",
                      r.warn && "text-amber-600",
                    )}
                  >
                    {r.hint}
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Entfernen"
                  onClick={() => onRemove(r.id)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
