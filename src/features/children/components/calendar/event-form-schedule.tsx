"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createScheduleAction } from "../../actions";
import { hoursToTime } from "./week-utils";
import { EventFormShell, TimeRangeFields } from "./event-form-shell";

type Props = {
  childId: string;
  weekday: number;
  startHour: number;
  endHour: number;
  subtitle: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function EventFormSchedule({
  childId,
  weekday,
  startHour,
  endHour,
  subtitle,
  onSaved,
  onCancel,
}: Props) {
  const [start, setStart] = useState(hoursToTime(startHour));
  const [end, setEnd] = useState(hoursToTime(endHour));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      await createScheduleAction({
        childId,
        weekday,
        startTime: start,
        endTime: end,
      });
      toast.success("Stundenplan gespeichert.");
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
      title="Neuer Stundenplan-Eintrag"
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
    </EventFormShell>
  );
}
