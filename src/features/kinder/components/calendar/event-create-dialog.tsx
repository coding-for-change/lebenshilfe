"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAssignmentAction,
  createScheduleAction,
  saveAbsenceAction,
} from "../../actions";
import { DAY_LABELS_DE, addDays, hoursToTime, toIso } from "./week-utils";

type EventKind = "assignment" | "schedule" | "absence";

type SchulbegleiterOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  weekStart: Date;
  // Prefill from drag selection.
  weekday: number;
  startHour: number;
  endHour: number;
  schulbegleiterOptions: SchulbegleiterOption[];
  onSaved: () => void;
};

export function EventCreateDialog({
  open,
  onOpenChange,
  childId,
  weekStart,
  weekday,
  startHour,
  endHour,
  schulbegleiterOptions,
  onSaved,
}: Props) {
  const [kind, setKind] = useState<EventKind>("assignment");
  const [userId, setUserId] = useState<string>("");
  const [tandem, setTandem] = useState(false);
  const [start, setStart] = useState(hoursToTime(startHour));
  const [end, setEnd] = useState(hoursToTime(endHour));
  const [absenceDate, setAbsenceDate] = useState(
    toIso(addDays(weekStart, weekday)),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind("assignment");
    setUserId(schulbegleiterOptions[0]?.id ?? "");
    setTandem(false);
    setStart(hoursToTime(startHour));
    setEnd(hoursToTime(endHour));
    setAbsenceDate(toIso(addDays(weekStart, weekday)));
    setNote("");
    setError(null);
    setBusy(false);
  }, [open, schulbegleiterOptions, startHour, endHour, weekStart, weekday]);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (kind === "assignment") {
        if (!userId) {
          setError("Bitte Schulbegleiter wählen.");
          setBusy(false);
          return;
        }
        await createAssignmentAction({
          childId,
          userId,
          weekday,
          startTime: start,
          endTime: end,
          tandem,
        });
        toast.success("Zuweisung gespeichert.");
      } else if (kind === "schedule") {
        await createScheduleAction({
          childId,
          weekday,
          startTime: start,
          endTime: end,
        });
        toast.success("Stundenplan gespeichert.");
      } else {
        await saveAbsenceAction({
          childId,
          date: absenceDate,
          note: note.trim() || null,
        });
        toast.success("Krankheitstag gespeichert.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Eintrag</DialogTitle>
          <DialogDescription>
            {DAY_LABELS_DE[weekday]} ·{" "}
            {kind === "absence" ? "Ganzer Tag" : `${start} – ${end}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="ev-kind">
              <FieldContent>
                <span>Art des Eintrags</span>
              </FieldContent>
            </FieldLabel>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as EventKind)}
            >
              <SelectTrigger id="ev-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">
                  Zuweisung (wöchentlich)
                </SelectItem>
                <SelectItem value="schedule">
                  Stundenplan (wöchentlich)
                </SelectItem>
                <SelectItem value="absence">Krankheit (Datum)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {kind !== "absence" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="ev-start">
                  <FieldContent>
                    <span>Von</span>
                  </FieldContent>
                </FieldLabel>
                <Input
                  id="ev-start"
                  type="time"
                  step={900}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ev-end">
                  <FieldContent>
                    <span>Bis</span>
                  </FieldContent>
                </FieldLabel>
                <Input
                  id="ev-end"
                  type="time"
                  step={900}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <Field>
              <FieldLabel htmlFor="ev-date">
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
          )}

          {kind === "assignment" ? (
            <>
              <Field>
                <FieldLabel htmlFor="ev-sb">
                  <FieldContent>
                    <span>Schulbegleiter</span>
                  </FieldContent>
                </FieldLabel>
                <Select
                  value={userId}
                  onValueChange={setUserId}
                >
                  <SelectTrigger id="ev-sb">
                    <SelectValue placeholder="Wählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {schulbegleiterOptions.length === 0 ? (
                      <SelectItem
                        value="__empty"
                        disabled
                      >
                        Keine angenommenen Schulbegleiter.
                      </SelectItem>
                    ) : (
                      schulbegleiterOptions.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                        >
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={tandem}
                  onCheckedChange={(v) => setTandem(v === true)}
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">Tandem</span>
                  <span className="text-xs text-muted-foreground">
                    Zwei Schulbegleiter parallel an diesem Tag.
                  </span>
                </div>
              </label>
            </>
          ) : null}

          {kind === "absence" ? (
            <Field>
              <FieldLabel htmlFor="ev-note">
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
          ) : null}

          {error ? <FieldError>{error}</FieldError> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Speichert…" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
