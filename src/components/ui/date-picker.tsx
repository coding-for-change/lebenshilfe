"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { cn, formatIsoDateLocal } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  /** ISO `YYYY-MM-DD`, or empty string when no date is set. */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaInvalid?: boolean;
  className?: string;
};

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Datum wählen",
  disabled,
  id,
  ariaInvalid,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseValue(value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => !disabled && setOpen(next)}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon />
          {selected ? (
            format(selected, "PPP", { locale: de })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          locale={de}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(formatIsoDateLocal(date));
              setOpen(false);
            } else {
              onChange("");
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
