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
import { MonthYearPicker } from "@/components/month-year-picker";
import { FlagRow } from "@/components/flag-row";
import { generateCostBearerExportAction } from "../actions";
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
  /** Earliest year that has data for this child; widens the period picker. */
  minYear?: number;
};

type PeriodMode = "single" | "range";

const NOW = new Date();

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

export function CostBearerExportDialog({
  open,
  onOpenChange,
  childId,
  childName,
  minYear,
}: Props) {
  const [mode, setMode] = useState<PeriodMode>("single");
  const [fromMonth, setFromMonth] = useState(NOW.getMonth() + 1);
  const [fromYear, setFromYear] = useState(NOW.getFullYear());
  const [toMonth, setToMonth] = useState(NOW.getMonth() + 1);
  const [toYear, setToYear] = useState(NOW.getFullYear());
  const [scope, setScope] = useState<ExportScope>("combined");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [fillWithIndirect, setFillWithIndirect] = useState(true);
  const [embedSignatures, setEmbedSignatures] = useState(false);
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
      fillWithIndirect,
      embedSignatures,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
      return;
    }

    setBusy(true);
    try {
      const { files } = await generateCostBearerExportAction(parsed.data);
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
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
    >
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
              <SelectTrigger
                id="export-mode"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Einzelner Monat</SelectItem>
                <SelectItem value="range">Zeitraum (mehrere Monate)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <MonthYearPicker
            id="export-from"
            label={mode === "single" ? "Monat" : "Von"}
            month={fromMonth}
            year={fromYear}
            minYear={minYear}
            onMonthChange={(m) => m !== null && setFromMonth(m)}
            onYearChange={setFromYear}
          />

          {mode === "range" && (
            <MonthYearPicker
              id="export-to"
              label="Bis"
              month={toMonth}
              year={toYear}
              minYear={minYear}
              onMonthChange={(m) => m !== null && setToMonth(m)}
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
              <SelectTrigger
                id="export-scope"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
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
              <SelectTrigger
                id="export-format"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <FlagRow
            id="export-fill-indirect"
            label="Stunden mit indirekter Leistung auffüllen"
            description="Sicherheitsnetz: füllt die Zeile „Indirekte Leistung“ auf die genehmigte indirekte Leistung des Kindes auf, falls die geloggten Stunden nicht reichen."
            checked={fillWithIndirect}
            onChange={setFillWithIndirect}
          />

          {format === "pdf" && (
            <FlagRow
              id="export-embed-signatures"
              label="Unterschriften einbetten"
              description="Fügt je Tag die gespeicherte Unterschrift als kleine Spalte in das PDF ein."
              checked={embedSignatures}
              onChange={setEmbedSignatures}
            />
          )}
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
            onClick={handleExport}
            disabled={busy}
          >
            {busy ? "Exportiert…" : "Exportieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
