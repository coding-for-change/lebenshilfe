"use client";

import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

export function FlagRow({ id, label, description, checked, onChange }: Props) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </label>
  );
}
