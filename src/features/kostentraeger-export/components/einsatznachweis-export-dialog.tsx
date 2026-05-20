"use client";

import { useState } from "react";
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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportEinsatznachweisAction } from "../actions";
import { MONTHS_LONG } from "../format";
import {
  ExportRequestSchema,
  FORMAT_OPTIONS,
  SCOPE_OPTIONS,
  type ExportFile,
  type ExportFormat,
  type ExportScope,
} from "../schemas";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
};

type PeriodMode = "single" | "range";

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const YEAR_OPTIONS = [-3, -2, -1, 0, 1].map((offset) => CURRENT_YEAR + offset);

function triggerDownload(file: ExportFile): void {
  const binary = atob(file.base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: file.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MonthYearPicker({
  id,
  label,
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  id: string;
  label: string;
  month: number;
  year: number;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        <FieldContent>
          <span>{label}</span>
        </FieldContent>
      </FieldLabel>
      <div className="flex gap-2">
        <Select
          value={String(month)}
          onValueChange={(value) => onMonthChange(Number(value))}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_LONG.map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(year)}
          onValueChange={(value) => onYearChange(Number(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Field>
  );
}

export function EinsatznachweisExportDialog({
  open,
  onOpenChange,
  childId,
  childName,
}: Props) {
  const [mode, setMode] = useState<PeriodMode>("single");
  const [fromMonth, setFromMonth] = useState(NOW.getMonth() + 1);
  const [fromYear, setFromYear] = useState(CURRENT_YEAR);
  const [toMonth, setToMonth] = useState(NOW.getMonth() + 1);
  const [toYear, setToYear] = useState(CURRENT_YEAR);
  const [scope, setScope] = useState<ExportScope>("combined");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    const from = { year: fromYear, month: fromMonth };
    const to = mode === "single" ? from : { year: toYear, month: toMonth };

    const parsed = ExportRequestSchema.safeParse({
      childId,
      format,
      scope,
      from,
      to,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
      return;
    }

    setBusy(true);
    try {
      const { files } = await exportEinsatznachweisAction(parsed.data);
      if (files.length === 0) {
        toast.error("Keine Einträge im gewählten Zeitraum.");
        return;
      }
      files.forEach((file, index) => {
        window.setTimeout(() => triggerDownload(file), index * 350);
      });
      toast.success(
        files.length === 1
          ? "Einsatznachweis wurde erstellt."
          : `${files.length} Einsatznachweise wurden erstellt.`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einsatznachweis exportieren</DialogTitle>
          <DialogDescription>
            Abrechnung für <strong>{childName}</strong> im Format der Tabelle 7.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="export-mode">
              <FieldContent>
                <span>Zeitraum</span>
              </FieldContent>
            </FieldLabel>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as PeriodMode)}
            >
              <SelectTrigger id="export-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Einzelner Monat</SelectItem>
                <SelectItem value="range">
                  Zeitraum (mehrere Monate)
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <MonthYearPicker
            id="export-from"
            label={mode === "single" ? "Monat" : "Von"}
            month={fromMonth}
            year={fromYear}
            onMonthChange={setFromMonth}
            onYearChange={setFromYear}
          />

          {mode === "range" && (
            <MonthYearPicker
              id="export-to"
              label="Bis"
              month={toMonth}
              year={toYear}
              onMonthChange={setToMonth}
              onYearChange={setToYear}
            />
          )}

          <Field>
            <FieldLabel htmlFor="export-scope">
              <FieldContent>
                <span>Aufteilung</span>
              </FieldContent>
            </FieldLabel>
            <Select
              value={scope}
              onValueChange={(value) => setScope(value as ExportScope)}
            >
              <SelectTrigger id="export-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="export-format">
              <FieldContent>
                <span>Format</span>
              </FieldContent>
            </FieldLabel>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger id="export-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
          <Button type="button" onClick={handleExport} disabled={busy}>
            {busy ? "Exportiert…" : "Exportieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
