"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  createAssignmentAction,
  createScheduleAction,
  saveAbsenceAction,
} from "../../actions";
import { DAY_LABELS_DE, addDays, hoursToTime, toIso } from "./week-utils";
import type { EventKind } from "./week-calendar";

type SchulbegleiterOption = {
  id: string;
  name: string;
};

type Props = {
  kind: EventKind;
  childId: string;
  weekStart: Date;
  weekday: number;
  startHour: number;
  endHour: number;
  schulbegleiterOptions: SchulbegleiterOption[];
  onSaved: () => void;
  onCancel: () => void;
};

const KIND_TITLES: Record<EventKind, string> = {
  assignment: "Neue Zuweisung",
  schedule: "Neuer Stundenplan-Eintrag",
  absence: "Krankheitstag eintragen",
};

// Inline form rendered inside a Popover. State is initialised from the drag
// selection on first mount; the parent remounts (via a fresh `key`) when a
// new drag completes, so we don't need internal reset logic.
export function EventCreateForm({
  kind,
  childId,
  weekStart,
  weekday,
  startHour,
  endHour,
  schulbegleiterOptions,
  onSaved,
  onCancel,
}: Props) {
  const [userId, setUserId] = useState<string>(
    schulbegleiterOptions[0]?.id ?? "",
  );
  const [tandem, setTandem] = useState(false);
  const [start, setStart] = useState(hoursToTime(startHour));
  const [end, setEnd] = useState(hoursToTime(endHour));
  const [absenceDate, setAbsenceDate] = useState(
    toIso(addDays(weekStart, weekday)),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="font-semibold leading-tight">{KIND_TITLES[kind]}</div>
        <div className="text-xs text-muted-foreground">
          {DAY_LABELS_DE[weekday]} ·{" "}
          {kind === "absence" ? "Ganzer Tag" : `${start} – ${end}`}
        </div>
      </div>

      {kind !== "absence" ? (
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
              onChange={(e) => setStart(e.target.value)}
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
              onChange={(e) => setEnd(e.target.value)}
              className="h-8"
            />
          </Field>
        </div>
      ) : (
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
      )}

      {kind === "assignment" ? (
        <>
          <Field>
            <FieldLabel
              htmlFor="ev-sb"
              className="text-xs"
            >
              <FieldContent>
                <span>Schulbegleiter</span>
              </FieldContent>
            </FieldLabel>
            <SchulbegleiterCombobox
              id="ev-sb"
              options={schulbegleiterOptions}
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
        </>
      ) : null}

      {kind === "absence" ? (
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
      ) : null}

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
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}

function SchulbegleiterCombobox({
  id,
  options,
  value,
  onChange,
}: {
  id?: string;
  options: SchulbegleiterOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className="h-8 w-full justify-between font-normal"
          disabled={options.length === 0}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected
              ? selected.name
              : options.length === 0
                ? "Keine angenommenen Schulbegleiter."
                : "Wählen…"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Suchen…" />
          <CommandList>
            <CommandEmpty>Keine Treffer.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => {
                    onChange(o.id === value ? null : o.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
