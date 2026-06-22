"use client";

import { DatePicker } from "@/components/ui/date-picker";

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

export function HolidayRangePicker({
  value,
  onChange,
  id,
  ariaInvalid,
}: Props) {
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
      <div className="flex flex-1 flex-col gap-1">
        <label
          htmlFor={id}
          className="text-xs font-medium text-muted-foreground"
        >
          Startdatum
        </label>
        <DatePicker
          id={id}
          value={value.startDate}
          onChange={setStart}
          ariaInvalid={ariaInvalid}
          // Can't start after the chosen end.
          max={value.endDate || undefined}
        />
      </div>
      <span className="hidden pb-2 text-muted-foreground sm:block">–</span>
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Enddatum
        </label>
        <DatePicker
          value={value.endDate}
          onChange={setEnd}
          ariaInvalid={ariaInvalid}
          // Can't end before the chosen start.
          min={value.startDate || undefined}
        />
      </div>
    </div>
  );
}
