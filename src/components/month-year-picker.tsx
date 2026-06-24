"use client";

import type { ReactNode } from "react";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;
const DEFAULT_YEARS_BACK = 3;

type Props = {
  id: string;
  label: string;
  month: number;
  year: number;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  /**
   * Earliest selectable year. Defaults to a few years back; pass the year of
   * the oldest available data so the range grows with the data set and never
   * needs widening.
   */
  minYear?: number;
  /**
   * When set, adds an "Alle" month option (value 0) for selecting a whole year
   * rather than a single month. Off by default so existing single-month
   * callers are unaffected.
   */
  allowAll?: boolean;
  /**
   * Earliest selectable month. Months before it are disabled (mirroring how
   * future months are disabled), so the picker only offers periods within
   * [earliest … current month]. Also fixes the first year of the dropdown.
   */
  earliest?: { year: number; month: number };
  /** Tailwind width for the month trigger. Defaults to filling the row. */
  monthClassName?: string;
  /** Extra control(s) rendered in the same row, after the year select. */
  trailing?: ReactNode;
};

/**
 * Month + year picker. Never offers a date in the future: no future years are
 * listed, and future months of the current year are disabled.
 */
export function MonthYearPicker({
  id,
  label,
  month,
  year,
  onMonthChange,
  onYearChange,
  minYear,
  allowAll = false,
  earliest,
  monthClassName = "w-full",
  trailing,
}: Props) {
  const firstYear = Math.min(
    earliest?.year ?? minYear ?? CURRENT_YEAR - DEFAULT_YEARS_BACK,
    CURRENT_YEAR,
  );
  const years: number[] = [];
  for (let value = CURRENT_YEAR; value >= firstYear; value -= 1) {
    years.push(value);
  }

  function handleYearChange(nextYear: number) {
    onYearChange(nextYear);
    if (month === 0) return; // "Alle" is valid in any year.
    // Switching years can leave a now-future or now-too-early month selected.
    if (nextYear === CURRENT_YEAR && month > CURRENT_MONTH) {
      onMonthChange(CURRENT_MONTH);
    } else if (
      earliest &&
      nextYear === earliest.year &&
      month < earliest.month
    ) {
      onMonthChange(earliest.month);
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        <FieldContent>
          <span>{label}</span>
        </FieldContent>
      </FieldLabel>
      <div className="flex gap-2">
        <Select
          value={String(month)}
          onValueChange={(value) => onMonthChange(Number(value))}
        >
          <SelectTrigger
            id={id}
            className={monthClassName}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowAll && <SelectItem value="0">Alle Monate</SelectItem>}
            {MONTHS.map((name, index) => (
              <SelectItem
                key={name}
                value={String(index + 1)}
                disabled={
                  (year === CURRENT_YEAR && index + 1 > CURRENT_MONTH) ||
                  (!!earliest &&
                    year === earliest.year &&
                    index + 1 < earliest.month)
                }
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(year)}
          onValueChange={(value) => handleYearChange(Number(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((value) => (
              <SelectItem
                key={value}
                value={String(value)}
              >
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {trailing}
      </div>
    </Field>
  );
}
