"use server";

import { requireAdmin } from "@/lib/auth-guards";
import { downloadObject } from "@/lib/storage";
import { CostBearerExportFacade } from "./facade";
import { sanitizeFileName } from "./format";
import { renderCsv } from "./render/csv";
import { renderPdf } from "./render/pdf";
import { renderXlsx } from "./render/xlsx";
import {
  ExportRequestSchema,
  PoolExportRequestSchema,
  type ExportDocument,
  type ExportFile,
  type ExportRequest,
  type PoolExportRequest,
} from "./schemas";

const MIME_TYPES: Record<ExportRequest["format"], string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv;charset=utf-8",
};

function periodFilePart(request: {
  from: { year: number; month: number };
  to: { year: number; month: number };
}): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const from = `${request.from.year}-${pad(request.from.month)}`;
  const to = `${request.to.year}-${pad(request.to.month)}`;
  return from === to ? from : `${from}_bis_${to}`;
}

async function renderDocuments(
  documents: ExportDocument[],
  format: ExportRequest["format"],
  period: string,
  signatures: Map<string, Buffer> | undefined,
): Promise<ExportFile[]> {
  const files: ExportFile[] = [];
  for (const doc of documents) {
    let bytes: Buffer;
    if (format === "csv") {
      bytes = renderCsv(doc);
    } else if (format === "xlsx") {
      bytes = await renderXlsx(doc);
    } else {
      bytes = await renderPdf(doc, signatures);
    }

    const namePart = doc.schulbegleiterName
      ? `${doc.subjectName}_${doc.schulbegleiterName}`
      : doc.subjectName;

    files.push({
      filename: `${sanitizeFileName(`Einsatznachweis_${namePart}_${period}`)}.${format}`,
      mimeType: MIME_TYPES[format],
      base64: bytes.toString("base64"),
    });
  }
  return files;
}

/** Fetches every referenced day signature from S3, skipping any that fail. */
async function collectSignatures(
  documents: ExportDocument[],
): Promise<Map<string, Buffer>> {
  const keys = new Set<string>();
  for (const doc of documents) {
    for (const month of doc.months) {
      for (const day of month.days) {
        if (day.signatureKey) keys.add(day.signatureKey);
      }
    }
  }
  const entries = await Promise.all(
    [...keys].map(async (key) => {
      try {
        return [key, await downloadObject(key)] as const;
      } catch {
        return null;
      }
    }),
  );
  return new Map(
    entries.filter((entry): entry is [string, Buffer] => entry !== null),
  );
}

/**
 * Builds the Kostenträger-Einsatznachweis export for a child. Returns one file
 * for `combined` scope, or one file per Schulbegleiter for `per-assistant`
 * scope. Files are base64-encoded for transport to the client.
 */
export async function generateCostBearerExportAction(
  input: ExportRequest,
): Promise<{ files: ExportFile[] }> {
  await requireAdmin();
  const request = ExportRequestSchema.parse(input);

  const documents = await CostBearerExportFacade.build(request);
  const period = periodFilePart(request);

  const signatures =
    request.format === "pdf" && request.embedSignatures
      ? await collectSignatures(documents)
      : undefined;

  const files = await renderDocuments(
    documents,
    request.format,
    period,
    signatures,
  );
  return { files };
}

/**
 * Builds the Einsatznachweis export for a pool. Returns one file for `combined`
 * scope, or one file per Schulbegleiter for `per-assistant` scope.
 */
export async function generatePoolExportAction(
  input: PoolExportRequest,
): Promise<{ files: ExportFile[] }> {
  await requireAdmin();
  const request = PoolExportRequestSchema.parse(input);

  const documents = await CostBearerExportFacade.buildForPool(request);
  const period = periodFilePart(request);

  const signatures =
    request.format === "pdf" && request.embedSignatures
      ? await collectSignatures(documents)
      : undefined;

  const files = await renderDocuments(
    documents,
    request.format,
    period,
    signatures,
  );
  return { files };
}
