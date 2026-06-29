import { match } from "ts-pattern";
import { shiftTime } from "@/lib/dates";

export type QuarterHourHint = { label: string; billed: string };

/**
 * Display-only Vor-/Nachviertelstunde hint: the label plus the billed span (the
 * raw time widened by ±15 on each approved side). Null when neither side
 * applies. The stored time is never changed — this is purely for display.
 */
export function quarterHourHint(
  before: boolean,
  after: boolean,
  start: string,
  end: string,
): QuarterHourHint | null {
  return match({ before, after })
    .with({ before: true, after: true }, () => ({
      label: "Vor- & Nachviertelstunde",
      billed: `${shiftTime(start, -15)}–${shiftTime(end, 15)}`,
    }))
    .with({ before: true, after: false }, () => ({
      label: "Vorviertelstunde",
      billed: `ab ${shiftTime(start, -15)}`,
    }))
    .with({ before: false, after: true }, () => ({
      label: "Nachviertelstunde",
      billed: `bis ${shiftTime(end, 15)}`,
    }))
    .otherwise(() => null);
}
