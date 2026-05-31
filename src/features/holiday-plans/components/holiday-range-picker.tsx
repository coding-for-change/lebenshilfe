"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate, formatIsoDateLocal } from "@/lib/utils";

export type HolidayRangeValue = {
  startDate: string; // YYYY-MM-DD, or ""
  endDate: string; // YYYY-MM-DD, or ""
};

type Props = {
  value: HolidayRangeValue;
  onChange: (next: HolidayRangeValue) => void;
  id?: string;
  ariaInvalid?: boolean;
};

// `YYYY-MM-DD` parsed as local midnight so the calendar highlights the picked
// day (not the previous one in negative-UTC zones).
function toDate(iso: string): Date | undefined {
  return iso ? new Date(`${iso}T00:00:00`) : undefined;
}

export function HolidayRangePicker({
  value,
  onChange,
  id,
  ariaInvalid,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined = value.startDate
    ? { from: toDate(value.startDate), to: toDate(value.endDate) }
    : undefined;

  const label =
    value.startDate && value.endDate
      ? `${formatDate(value.startDate)} – ${formatDate(value.endDate)}`
      : value.startDate
        ? `Ab ${formatDate(value.startDate)} – Enddatum wählen`
        : "Zeitraum wählen…";

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
          aria-invalid={ariaInvalid}
          className="w-full justify-start font-normal"
        >
          <CalendarRange className="mr-2 size-4 shrink-0 opacity-60" />
          <span className={cn(!value.startDate && "text-muted-foreground")}>
            {label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        {/*
         * Manual two-click flow so the popover opens once: first click sets the
         * start (and clears any end), second click sets the end and closes.
         * We drive selection via `onDayClick` rather than range `onSelect` —
         * react-day-picker's range reconstruction would otherwise close the
         * popover after a single click.
         */}
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={selected?.from}
          selected={selected}
          onDayClick={(day) => {
            const iso = formatIsoDateLocal(day);
            // No start yet, or a complete range exists → begin a new range.
            if (!value.startDate || value.endDate) {
              onChange({ startDate: iso, endDate: "" });
              return;
            }
            // Start is set, end is open → this click is the end (swap if earlier).
            const [startDate, endDate] =
              iso < value.startDate
                ? [iso, value.startDate]
                : [value.startDate, iso];
            onChange({ startDate, endDate });
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
