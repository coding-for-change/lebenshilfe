import { cn } from "@/lib/utils";

type WizardProgressProps = {
  steps: number;
  current: number; // 0-indexed
  labels?: string[];
};

export function WizardProgress({
  steps,
  current,
  labels,
}: WizardProgressProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {Array.from({ length: steps }).map((_, i) => {
          const filled = i <= current;
          return (
            <div
              key={i}
              aria-label={labels?.[i] ?? `Schritt ${i + 1}`}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                filled
                  ? "bg-primary"
                  : "border border-primary/40 bg-transparent",
              )}
            />
          );
        })}
      </div>
      {labels ? (
        <p className="text-xs text-muted-foreground">
          Schritt {current + 1} von {steps} · {labels[current]}
        </p>
      ) : null}
    </div>
  );
}
