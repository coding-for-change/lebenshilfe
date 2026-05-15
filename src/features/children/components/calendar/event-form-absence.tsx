"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { saveAbsenceAction } from "../../actions";
import { addDays } from "./week-utils";
import { formatIsoDateLocal } from "@/lib/utils";
import { EventFormShell } from "./event-form-shell";

type Props = {
  childId: string;
  weekStart: Date;
  weekday: number;
  subtitle: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function EventFormAbsence({
  childId,
  weekStart,
  weekday,
  subtitle,
  onSaved,
  onCancel,
}: Props) {
  const [absenceDate, setAbsenceDate] = useState(
    formatIsoDateLocal(addDays(weekStart, weekday)),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      await saveAbsenceAction({
        childId,
        date: absenceDate,
        note: note.trim() || null,
      });
      toast.success("Krankheitstag gespeichert.");
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
      title="Krankheitstag eintragen"
      subtitle={subtitle}
      error={error}
      busy={busy}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <Field>
        <FieldLabel
          htmlFor="ev-date"
          className="text-xs"
        >
          <FieldContent>
            <span>Datum</span>
          </FieldContent>
        </FieldLabel>
        <DatePicker
          id="ev-date"
          value={absenceDate}
          onChange={setAbsenceDate}
        />
      </Field>
      <Field>
        <FieldLabel
          htmlFor="ev-note"
          className="text-xs"
        >
          <FieldContent>
            <span>Notiz</span>
          </FieldContent>
        </FieldLabel>
        <Textarea
          id="ev-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional…"
        />
      </Field>
    </EventFormShell>
  );
}
