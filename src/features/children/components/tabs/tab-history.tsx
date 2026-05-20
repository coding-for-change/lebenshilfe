"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2, Mail } from "lucide-react";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EinsatznachweisExportDialog } from "@/features/kostentraeger-export";
import { listWorkEventsForChildAction } from "../../actions";
import { formatMonthYearLong, formatShortDateWithWeekday } from "@/lib/utils";
import type { SerializedChild } from "../../serialize";

type Props = {
  child: SerializedChild;
};

type WorkEvent = Awaited<
  ReturnType<typeof listWorkEventsForChildAction>
>[number];

function groupByMonth(events: WorkEvent[]) {
  const groups = new Map<string, { label: string; rows: WorkEvent[] }>();
  for (const e of events) {
    const date = new Date(`${e.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) {
      groups.set(key, { label: formatMonthYearLong(date), rows: [] });
    }
    groups.get(key)!.rows.push(e);
  }
  return [...groups.entries()].map(([key, val]) => ({ key, ...val }));
}

function totalHours(events: WorkEvent[]) {
  let mins = 0;
  for (const e of events) {
    if (!e.startTime || !e.endTime) continue;
    const [h1, m1] = e.startTime.split(":").map(Number);
    const [h2, m2] = e.endTime.split(":").map(Number);
    mins += h2 * 60 + m2 - (h1 * 60 + m1);
  }
  return (mins / 60).toFixed(2).replace(".", ",");
}

type LoadState =
  | { status: "loading"; childId: string }
  | { status: "loaded"; childId: string; events: WorkEvent[] }
  | { status: "error"; childId: string; message: string };

export function TabHistory({ child }: Props) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    childId: child.id,
  });
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listWorkEventsForChildAction(child.id)
      .then((rows) => {
        if (!cancelled) {
          setState({ status: "loaded", childId: child.id, events: rows });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: "error",
            childId: child.id,
            message:
              err instanceof Error ? err.message : "Laden fehlgeschlagen.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [child.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Übersicht aller Arbeitszeiten der Schulbegleiter mit{" "}
          <strong>
            {child.firstName} {child.lastName}
          </strong>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
          >
            <FileDown />
            PDF erstellen
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    type="button"
                    size="sm"
                    disabled
                  >
                    <Mail />
                    An Kostenstelle senden
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Kommt in Kürze.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {match(state)
        .with({ status: "error", childId: child.id }, ({ message }) => (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {message}
          </div>
        ))
        .with({ status: "loaded", childId: child.id, events: [] }, () => (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Noch keine erfassten Zeiten.
          </div>
        ))
        .with({ status: "loaded", childId: child.id }, ({ events }) => (
          <div className="flex flex-col gap-3">
            {groupByMonth(events).map(({ key, label, rows }) => (
              <div
                key={key}
                className="overflow-hidden rounded-md border"
              >
                <div className="flex items-baseline justify-between gap-2 border-b bg-muted/40 px-4 py-2">
                  <h4 className="text-sm font-medium">{label}</h4>
                  <span className="text-xs text-muted-foreground">
                    {rows.length} Eintrag {rows.length === 1 ? "" : "e"} ·{" "}
                    {totalHours(rows)} h
                  </span>
                </div>
                <ul className="divide-y">
                  {rows.map((r) => (
                    <li
                      key={r.id}
                      className="grid grid-cols-[max-content_1fr_max-content] gap-3 px-4 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {formatShortDateWithWeekday(r.date)}
                      </span>
                      <span className="text-muted-foreground">
                        {r.userName}
                        {r.note ? <> · {r.note}</> : null}
                      </span>
                      <span className="tabular-nums">
                        {r.startTime ?? "—"} – {r.endTime ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))
        // Loading + stale (childId mismatch from a previously opened child).
        .otherwise(() => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Lade Historie…
          </div>
        ))}

      <EinsatznachweisExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        childId={child.id}
        childName={`${child.firstName} ${child.lastName}`}
      />
    </div>
  );
}
