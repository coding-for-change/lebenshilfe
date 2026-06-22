"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { SchoolCreateDialog } from "./school-create-dialog";

export type SchoolOption = {
  id: string;
  name: string;
};

type Props = {
  options: SchoolOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreated?: (created: SchoolOption) => void;
  ariaInvalid?: boolean;
  id?: string;
};

export function SchoolSelect({
  options,
  value,
  onChange,
  onCreated,
  ariaInvalid,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  return (
    <>
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
            aria-invalid={ariaInvalid}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected ? selected.name : "Schule wählen…"}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Suchen…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Keine Treffer.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => {
                      onChange(o.id === value ? null : o.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === o.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  {search.trim()
                    ? `"${search.trim()}" als neue Schule anlegen`
                    : "Neue Schule anlegen"}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <SchoolCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={search.trim() || undefined}
        onCreated={(created) => {
          onCreated?.(created);
          onChange(created.id);
          setSearch("");
        }}
      />
    </>
  );
}
