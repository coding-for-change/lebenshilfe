"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HolidayRangePicker,
  type HolidayRangeValue,
} from "./holiday-range-picker";
import {
  addHolidayEntryAction,
  deleteHolidayEntryAction,
  updateHolidayEntryAction,
} from "../actions";
import type { SerializedHolidayEntry } from "../serialize";

type Props = {
  planId: string;
  entries: SerializedHolidayEntry[];
};

const EMPTY_RANGE: HolidayRangeValue = { startDate: "", endDate: "" };

export function HolidayEntryEditor({ planId, entries }: Props) {
  const [range, setRange] = useState<HolidayRangeValue>(EMPTY_RANGE);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!range.startDate || !range.endDate) {
      toast.error("Bitte einen Zeitraum wählen.");
      return;
    }
    setBusy(true);
    try {
      await addHolidayEntryAction({
        planId,
        name: name.trim() || null,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      toast.success("Ferien hinzugefügt.");
      setRange(EMPTY_RANGE);
      setName("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Noch keine Ferien hinterlegt.
          </p>
        ) : (
          entries.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
        <p className="text-sm font-medium">Neue Ferien hinzufügen</p>
        <HolidayRangePicker
          value={range}
          onChange={setRange}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bezeichnung (optional, z.B. Sommerferien)"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={busy}
          className="self-end"
        >
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: SerializedHolidayEntry }) {
  const [range, setRange] = useState<HolidayRangeValue>({
    startDate: entry.startDate,
    endDate: entry.endDate,
  });
  const [name, setName] = useState(entry.name ?? "");
  const [busy, setBusy] = useState(false);

  const dirty =
    range.startDate !== entry.startDate ||
    range.endDate !== entry.endDate ||
    (name.trim() || null) !== (entry.name ?? null);

  async function handleSave() {
    if (!range.startDate || !range.endDate) {
      toast.error("Bitte einen Zeitraum wählen.");
      return;
    }
    setBusy(true);
    try {
      await updateHolidayEntryAction(entry.id, {
        name: name.trim() || null,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      toast.success("Ferien aktualisiert.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteHolidayEntryAction(entry.id);
      toast.success("Ferien gelöscht.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <HolidayRangePicker
        value={range}
        onChange={setRange}
      />
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bezeichnung (optional)"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSave}
          disabled={busy || !dirty}
        >
          Speichern
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={busy}
          aria-label="Ferien löschen"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
