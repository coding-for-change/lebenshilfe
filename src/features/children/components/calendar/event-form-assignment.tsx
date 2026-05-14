"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { createAssignmentAction } from "../../actions";
import { hoursToTime } from "./week-utils";
import { EventFormShell, TimeRangeFields } from "./event-form-shell";
import {
  SchoolAssistantCombobox,
  type SchoolAssistantOption,
} from "./school-assistant-combobox";

type Props = {
  childId: string;
  weekday: number;
  startHour: number;
  endHour: number;
  schoolAssistantOptions: SchoolAssistantOption[];
  subtitle: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function EventFormAssignment({
  childId,
  weekday,
  startHour,
  endHour,
  schoolAssistantOptions,
  subtitle,
  onSaved,
  onCancel,
}: Props) {
  const [userId, setUserId] = useState<string>(
    schoolAssistantOptions[0]?.id ?? "",
  );
  const [tandem, setTandem] = useState(false);
  const [start, setStart] = useState(hoursToTime(startHour));
  const [end, setEnd] = useState(hoursToTime(endHour));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!userId) {
      setError("Bitte Schulbegleiter wählen.");
      return;
    }
    setBusy(true);
    try {
      await createAssignmentAction({
        childId,
        userId,
        weekday,
        startTime: start,
        endTime: end,
        tandem,
      });
      toast.success("Zuweisung gespeichert.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <EventFormShell
      title="Neue Zuweisung"
      subtitle={subtitle}
      error={error}
      busy={busy}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <TimeRangeFields
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
      />
      <Field>
        <FieldLabel
          htmlFor="ev-sb"
          className="text-xs"
        >
          <FieldContent>
            <span>Schulbegleiter</span>
          </FieldContent>
        </FieldLabel>
        <SchoolAssistantCombobox
          id="ev-sb"
          options={schoolAssistantOptions}
          value={userId || null}
          onChange={(id) => setUserId(id ?? "")}
        />
      </Field>
      <label className="flex cursor-pointer items-start gap-2">
        <Checkbox
          checked={tandem}
          onCheckedChange={(v) => setTandem(v === true)}
        />
        <span className="text-xs leading-tight">
          <span className="block font-medium">Tandem</span>
          <span className="text-muted-foreground">
            Zwei Schulbegleiter parallel.
          </span>
        </span>
      </label>
    </EventFormShell>
  );
}
