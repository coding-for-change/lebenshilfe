import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlagCell({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );
}

/**
 * Labelled variant of {@link FlagCell} for mobile cards, where a bare ✓/—
 * icon loses its meaning once the column header is gone.
 */
export function FlagChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs",
        on
          ? "border-green-600/30 bg-green-600/10 text-foreground"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {on ? (
        <Check className="size-3 text-green-600" />
      ) : (
        <Minus className="size-3" />
      )}
      {label}
    </span>
  );
}
