"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type DatePickerProps = {
  /** ISO `YYYY-MM-DD`, or empty string when no date is set. */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaInvalid?: boolean;
  className?: string;
  min?: string;
  max?: string;
};

/**
 * Single date picker that uses the browser's native date input. On iOS/Android
 * this surfaces the platform-native picker; on desktop browsers it offers
 * both keyboard entry and a calendar dropdown.
 */
export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  ariaInvalid,
  className,
  min,
  max,
}: DatePickerProps) {
  return (
    <Input
      id={id}
      type="date"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full", className)}
    />
  );
}
