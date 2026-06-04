"use client";

import { useEffect, useState } from "react";
import type { Matcher } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, formatIsoDateLocal } from "@/lib/utils";

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

// Parse a typed German date ("TT.MM.JJJJ", lenient on leading zeros) into an
// ISO `YYYY-MM-DD`. Returns "" for an empty string (a cleared field) and null
// for anything that isn't a real calendar date (e.g. 31.02.2026).
function parseGermanDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const m = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return formatIsoDateLocal(date);
}

function isoToGerman(iso: string): string {
  return iso ? formatDate(iso) : "";
}

type DateFieldProps = {
  id?: string;
  label: string;
  value: string; // ISO or ""
  onChange: (iso: string) => void; // "" clears
  ariaInvalid?: boolean;
  calendarDisabled?: Matcher | Matcher[];
  fallbackMonth?: Date;
};

function DateField({
  id,
  label,
  value,
  onChange,
  ariaInvalid,
  calendarDisabled,
  fallbackMonth,
}: DateFieldProps) {
  const [text, setText] = useState(() => isoToGerman(value));
  const [open, setOpen] = useState(false);

  // Mirror external value changes (reset, calendar pick, range guard) into the
  // text field — but only while the user isn't mid-typing an invalid draft.
  useEffect(() => {
    setText(isoToGerman(value));
  }, [value]);

  const selected = toDate(value);

  return (
    <div className="flex flex-1 flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          value={text}
          inputMode="numeric"
          autoComplete="off"
          placeholder="TT.MM.JJJJ"
          aria-invalid={ariaInvalid}
          className="pr-9"
          onChange={(e) => {
            setText(e.target.value);
            const parsed = parseGermanDate(e.target.value);
            // Commit only complete, valid input; keep typing otherwise.
            if (parsed !== null) onChange(parsed);
          }}
          onBlur={() => {
            const parsed = parseGermanDate(text);
            // Normalise a valid entry to canonical form; revert an invalid one.
            setText(isoToGerman(parsed ? parsed : value));
          }}
        />
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${label} im Kalender wählen`}
              className="absolute right-0 top-0 h-full px-2 text-muted-foreground hover:bg-transparent"
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="end"
          >
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected ?? fallbackMonth}
              disabled={calendarDisabled}
              onSelect={(day) => {
                if (!day) return;
                onChange(formatIsoDateLocal(day));
                setOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function HolidayRangePicker({
  value,
  onChange,
  id,
  ariaInvalid,
}: Props) {
  const start = toDate(value.startDate);
  const end = toDate(value.endDate);

  const setStart = (iso: string) => {
    // A start past the current end would invalidate the range — drop the end.
    if (iso && value.endDate && iso > value.endDate) {
      onChange({ startDate: iso, endDate: "" });
    } else {
      onChange({ ...value, startDate: iso });
    }
  };

  const setEnd = (iso: string) => onChange({ ...value, endDate: iso });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <DateField
        id={id}
        label="Startdatum"
        value={value.startDate}
        onChange={setStart}
        ariaInvalid={ariaInvalid}
        calendarDisabled={end ? { after: end } : undefined}
      />
      <span className="hidden pb-2 text-muted-foreground sm:block">–</span>
      <DateField
        label="Enddatum"
        value={value.endDate}
        onChange={setEnd}
        ariaInvalid={ariaInvalid}
        calendarDisabled={start ? { before: start } : undefined}
        fallbackMonth={start}
      />
    </div>
  );
}
