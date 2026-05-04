import { Check, Minus } from "lucide-react";

export function FlagCell({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );
}
