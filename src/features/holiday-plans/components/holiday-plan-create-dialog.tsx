"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import { createHolidayPlanAction } from "../actions";
import { CreateHolidayPlanSchema } from "../schemas";
import {
  HolidayRangePicker,
  type HolidayRangeValue,
} from "./holiday-range-picker";

type DraftEntry = {
  name: string | null;
  startDate: string;
  endDate: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: { id: string; name: string }) => void;
  initialName?: string;
};

export function HolidayPlanCreateDialog({
  open,
  onOpenChange,
  onCreated,
  initialName,
}: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [range, setRange] = useState<HolidayRangeValue>({
    startDate: "",
    endDate: "",
  });
  const [entryName, setEntryName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  function reset() {
    setName(initialName ?? "");
    setEntries([]);
    setRange({ startDate: "", endDate: "" });
    setEntryName("");
    setError(undefined);
    setBusy(false);
  }

  function addEntry() {
    if (!range.startDate || !range.endDate) {
      toast.error("Bitte einen Zeitraum wählen.");
      return;
    }
    setEntries((prev) => [
      ...prev,
      {
        name: entryName.trim() || null,
        startDate: range.startDate,
        endDate: range.endDate,
      },
    ]);
    setRange({ startDate: "", endDate: "" });
    setEntryName("");
  }

  async function handleSubmit() {
    const parsed = CreateHolidayPlanSchema.safeParse({
      name: name.trim(),
      entries,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Eingabe ungültig.");
      return;
    }
    setBusy(true);
    try {
      const result = await createHolidayPlanAction(parsed.data);
      toast.success(`Ferienplan "${result.plan.name}" angelegt.`);
      onCreated(result.plan);
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Ferienplan anlegen</DialogTitle>
          <DialogDescription>
            Ein Plan bündelt mehrere Ferienzeiträume und kann mehreren Schulen
            zugewiesen werden.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="plan-create-name">
              <FieldContent>
                <span>Name</span>
              </FieldContent>
            </FieldLabel>
            <Input
              id="plan-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bayern Standard 2026/27"
              aria-invalid={!!error}
            />
            <FieldError>{error}</FieldError>
          </Field>

          {entries.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {entries.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{h.name ?? "Ferien"}</span>{" "}
                    <span className="text-muted-foreground">
                      {formatDate(h.startDate)} – {formatDate(h.endDate)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Entfernen"
                    onClick={() =>
                      setEntries((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">Ferienzeitraum hinzufügen</p>
            <HolidayRangePicker
              value={range}
              onChange={setRange}
            />
            <Input
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              placeholder="Bezeichnung (optional, z.B. Sommerferien)"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addEntry}
              className="self-end"
            >
              <Plus className="size-4" /> Hinzufügen
            </Button>
          </div>
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
