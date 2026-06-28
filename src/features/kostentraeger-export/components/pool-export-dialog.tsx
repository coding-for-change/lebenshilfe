"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MonthYearPicker } from "@/components/month-year-picker";
import { FlagRow } from "@/components/flag-row";
import { cn } from "@/lib/utils";
import { generatePoolExportAction } from "../actions";
import {
  PoolExportRequestSchema,
  FORMAT_OPTIONS,
  SCOPE_OPTIONS,
  type ExportFile,
  type ExportFormat,
  type ExportScope,
} from "../schemas";

type Props = {
  poolId: string;
  poolName: string;
};

type PeriodMode = "single" | "range";

const NOW = new Date();

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

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

export function PoolExportDialog({ poolId, poolName }: Props) {
  const [mode, setMode] = useState<PeriodMode>("single");
  const [fromMonth, setFromMonth] = useState(NOW.getMonth() + 1);
  const [fromYear, setFromYear] = useState(NOW.getFullYear());
  const [toMonth, setToMonth] = useState(NOW.getMonth() + 1);
  const [toYear, setToYear] = useState(NOW.getFullYear());
  const [scope, setScope] = useState<ExportScope>("combined");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [embedSignatures, setEmbedSignatures] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    const from = { year: fromYear, month: fromMonth };
    const to = mode === "single" ? from : { year: toYear, month: toMonth };

    const parsed = PoolExportRequestSchema.safeParse({
      poolId,
      format,
      scope,
      from,
      to,
      embedSignatures,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
      return;
    }

    setBusy(true);
    try {
      const { files } = await generatePoolExportAction(parsed.data);
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Einsatznachweis für <strong>{poolName}</strong>.
      </p>

      <div className="flex flex-col gap-2.5">
        <SectionLabel>Zeitraum</SectionLabel>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(
            [
              ["single", "Einzelner Monat"],
              ["range", "Zeitraum"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={cn("grid gap-2", mode === "range" && "sm:grid-cols-2")}>
          <MonthYearPicker
            id="pool-export-from"
            label={mode === "single" ? "Monat" : "Von"}
            month={fromMonth}
            year={fromYear}
            onMonthChange={setFromMonth}
            onYearChange={setFromYear}
          />
          {mode === "range" && (
            <MonthYearPicker
              id="pool-export-to"
              label="Bis"
              month={toMonth}
              year={toYear}
              onMonthChange={setToMonth}
              onYearChange={setToYear}
            />
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2.5">
        <SectionLabel>Format & Aufteilung</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="pool-export-format">
              <FieldContent>
                <span>Format</span>
              </FieldContent>
            </FieldLabel>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              <SelectTrigger
                id="pool-export-format"
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
          <Field>
            <FieldLabel htmlFor="pool-export-scope">
              <FieldContent>
                <span>Aufteilung</span>
              </FieldContent>
            </FieldLabel>
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as ExportScope)}
            >
              <SelectTrigger
                id="pool-export-scope"
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
        </div>
        {format === "pdf" && (
          <FlagRow
            id="pool-export-embed-signatures"
            label="Unterschriften einbetten"
            description="Fügt je Tag die gespeicherte Unterschrift in das PDF ein."
            checked={embedSignatures}
            onChange={setEmbedSignatures}
          />
        )}
      </div>

      <Separator />

      <Button
        type="button"
        onClick={handleExport}
        disabled={busy}
      >
        <Download className="size-4" />
        {busy ? "Exportiert…" : "Exportieren"}
      </Button>
    </div>
  );
}
