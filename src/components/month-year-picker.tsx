"use client";

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

type CommonProps = {
  id: string;
  label: string;
  year: number;
  onYearChange: (value: number) => void;
  /**
   * Earliest selectable year. Defaults to a few years back; pass the year of
   * the oldest available data so the range grows with the data set and never
   * needs widening.
   */
  minYear?: number;
  /**
   * Earliest selectable month. Months before it are disabled (mirroring how
   * future months are disabled), so the picker only offers periods within
   * [earliest … current month]. Also fixes the first year of the dropdown.
   */
  earliest?: { year: number; month: number };
};

/**
 * `allowAll` adds an "Alle" option (a whole year instead of one month) and
 * widens `month`/`onMonthChange` to include null ("Alle"). Single-month callers
 * omit it and keep a plain `number` API — they never have to handle null.
 */
type Props = CommonProps &
  (
    | {
        allowAll: true;
        month: number | null;
        onMonthChange: (value: number | null) => void;
      }
    | {
        allowAll?: false;
        month: number;
        onMonthChange: (value: number) => void;
      }
  );

/**
 * Month + year picker. Never offers a date in the future: no future years are
 * listed, and future months of the current year are disabled.
 */
export function MonthYearPicker(props: Props) {
  const { id, label, year, onYearChange, minYear, earliest } = props;
  const { month } = props;

  const firstYear = Math.min(
    earliest?.year ?? minYear ?? CURRENT_YEAR - DEFAULT_YEARS_BACK,
    CURRENT_YEAR,
  );
  const years: number[] = [];
  for (let value = CURRENT_YEAR; value >= firstYear; value -= 1) {
    years.push(value);
  }

  // "Alle" maps to null and is only offered when allowAll is set, so narrowing
  // on it keeps the nullable call type-safe without leaking null to
  // single-month callers.
  function handleMonthSelect(value: string) {
    if (value === "all") {
      if (props.allowAll) props.onMonthChange(null);
      return;
    }
    props.onMonthChange(Number(value));
  }

  function handleYearChange(nextYear: number) {
    onYearChange(nextYear);
    if (month === null) return; // "Alle" is valid in any year.
    // Switching years can leave a now-future or now-too-early month selected.
    if (nextYear === CURRENT_YEAR && month > CURRENT_MONTH) {
      props.onMonthChange(CURRENT_MONTH);
    } else if (
      earliest &&
      nextYear === earliest.year &&
      month < earliest.month
    ) {
      props.onMonthChange(earliest.month);
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
          value={month === null ? "all" : String(month)}
          onValueChange={handleMonthSelect}
        >
          <SelectTrigger
            id={id}
            className="w-40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.allowAll && <SelectItem value="all">Alle Monate</SelectItem>}
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
      </div>
    </Field>
  );
}
