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
import { HolidayPlanCreateDialog } from "./holiday-plan-create-dialog";

export type HolidayPlanOption = {
  id: string;
  name: string;
};

type Props = {
  options: HolidayPlanOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreated?: (created: HolidayPlanOption) => void;
  ariaInvalid?: boolean;
  id?: string;
  /** Label shown when nothing is selected. */
  placeholder?: string;
};

export function HolidayPlanSelect({
  options,
  value,
  onChange,
  onCreated,
  ariaInvalid,
  id,
  placeholder = "Ferienplan wählen…",
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
              {selected ? selected.name : placeholder}
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
                    ? `"${search.trim()}" als neuen Ferienplan anlegen`
                    : "Neuen Ferienplan anlegen"}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <HolidayPlanCreateDialog
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
