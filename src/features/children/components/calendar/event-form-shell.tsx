"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = {
  title: string;
  subtitle: string;
  error: string | null;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
};

export function EventFormShell({
  title,
  subtitle,
  error,
  busy,
  onSubmit,
  onCancel,
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="font-semibold leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>

      {children}

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={busy}
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}

type TimeRangeProps = {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
};

export function TimeRangeFields({
  start,
  end,
  onStartChange,
  onEndChange,
}: TimeRangeProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field>
        <FieldLabel
          htmlFor="ev-start"
          className="text-xs"
        >
          <FieldContent>
            <span>Von</span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="ev-start"
          type="time"
          step={900}
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="h-8"
        />
      </Field>
      <Field>
        <FieldLabel
          htmlFor="ev-end"
          className="text-xs"
        >
          <FieldContent>
            <span>Bis</span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="ev-end"
          type="time"
          step={900}
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="h-8"
        />
      </Field>
    </div>
  );
}
