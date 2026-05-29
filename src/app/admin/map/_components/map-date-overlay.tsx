"use client";

import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

export function MapDateOverlay({
  value,
  onChange,
  loading,
}: {
  value: string;
  onChange: (next: string) => void;
  loading: boolean;
}) {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur">
      <span className="text-xs font-medium text-muted-foreground">Datum</span>
      <div className="w-56">
        <DatePicker
          value={value}
          onChange={(next) => {
            if (next) onChange(next);
          }}
        />
      </div>
      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}
