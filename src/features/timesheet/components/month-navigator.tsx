"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonths, compareMonthKey, formatMonthLabel } from "../lib/group";

type Props = {
  value: string;
  onChange: (next: string) => void;
  minMonthKey?: string;
  maxMonthKey?: string;
};

export function MonthNavigator({
  value,
  onChange,
  minMonthKey,
  maxMonthKey,
}: Props) {
  const prev = addMonths(value, -1);
  const next = addMonths(value, 1);
  const prevDisabled =
    minMonthKey != null && compareMonthKey(value, minMonthKey) <= 0;
  const nextDisabled =
    maxMonthKey != null && compareMonthKey(value, maxMonthKey) >= 0;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2 py-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={prevDisabled}
        onClick={() => onChange(prev)}
        aria-label="Vorheriger Monat"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span
        className="text-sm font-medium tabular-nums"
        aria-live="polite"
      >
        {formatMonthLabel(value)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={nextDisabled}
        onClick={() => onChange(next)}
        aria-label="Nächster Monat"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
