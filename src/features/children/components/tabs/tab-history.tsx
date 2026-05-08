"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileDown, Loader2, Mail } from "lucide-react";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  listEventsForChildAction,
  type SerializedAdminHistory,
} from "@/features/timesheet/actions";
import { AdminEventRow } from "@/features/timesheet/components/admin-event-row";
import { MonthNavigator } from "@/features/timesheet/components/month-navigator";
import {
  compareMonthKey,
  currentMonthKey,
  formatMonthLabel,
  groupByMonth,
  monthKeyOf,
  totalHours,
} from "@/features/timesheet/lib/group";
import type { SerializedChild } from "../../serialize";

type Props = {
  child: SerializedChild;
};

type LoadState =
  | { status: "loading"; childId: string }
  | { status: "loaded"; childId: string; data: SerializedAdminHistory }
  | { status: "error"; childId: string; message: string };

export function TabHistory({ child }: Props) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    childId: child.id,
  });

  const refetch = useCallback(
    (childId: string, signal?: { cancelled: boolean }) => {
      return listEventsForChildAction(childId)
        .then((data) => {
          if (signal?.cancelled) return;
          setState({ status: "loaded", childId, data });
        })
        .catch((err) => {
          if (signal?.cancelled) return;
          setState({
            status: "error",
            childId,
            message:
              err instanceof Error ? err.message : "Laden fehlgeschlagen.",
          });
        });
    },
    [],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void refetch(child.id, signal);
    return () => {
      signal.cancelled = true;
    };
  }, [child.id, refetch]);

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
        <TooltipProvider delayDuration={200}>
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                  >
                    <FileDown />
                    PDF erstellen
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Kommt in Kürze.</TooltipContent>
            </Tooltip>
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
          </div>
        </TooltipProvider>
      </div>

      {match(state)
        .with({ status: "error", childId: child.id }, ({ message }) => (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {message}
          </div>
        ))
        .with(
          { status: "loaded", childId: child.id, data: { events: [] } },
          () => (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Noch keine erfassten Zeiten.
            </div>
          ),
        )
        .with({ status: "loaded", childId: child.id }, ({ data }) => (
          <ChildHistoryList
            data={data}
            onChanged={() => refetch(child.id)}
          />
        ))
        // Loading + stale (childId mismatch from a previously opened child).
        .otherwise(() => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Lade Historie…
          </div>
        ))}
    </div>
  );
}

function ChildHistoryList({
  data,
  onChanged,
}: {
  data: SerializedAdminHistory;
  onChanged: () => void;
}) {
  const signedKeys = new Set(
    data.signedMonths.map((m) => `${m.userId}-${m.year}-${m.month}`),
  );

  const { minMonthKey, maxMonthKey, defaultMonthKey } = useMemo(() => {
    const keys = data.events.map((e) => monthKeyOf(e.date)).sort();
    const today = currentMonthKey();
    const earliest = keys[0] ?? today;
    const latest = keys[keys.length - 1] ?? today;
    const min = compareMonthKey(earliest, today) < 0 ? earliest : today;
    const max = compareMonthKey(latest, today) > 0 ? latest : today;
    const todayHasData = keys.includes(today);
    return {
      minMonthKey: min,
      maxMonthKey: max,
      defaultMonthKey: todayHasData ? today : latest,
    };
  }, [data.events]);

  const [monthKey, setMonthKey] = useState(defaultMonthKey);
  const filtered = data.events.filter(
    (e) => monthKeyOf(e.date) === monthKey,
  );
  const groups = groupByMonth(filtered);

  return (
    <div className="flex flex-col gap-3">
      <MonthNavigator
        value={monthKey}
        onChange={setMonthKey}
        minMonthKey={minMonthKey}
        maxMonthKey={maxMonthKey}
      />
      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Einträge im {formatMonthLabel(monthKey)}.
        </div>
      ) : null}
      {groups.map(({ key, label, rows }) => {
        const [yearStr, monthStr] = key.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);
        const monthReports = data.signedMonths.filter(
          (m) => m.year === year && m.month === month,
        );

        return (
          <div
            key={key}
            className="overflow-hidden rounded-md border"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/40 px-4 py-2">
              <h4 className="text-sm font-medium">{label}</h4>
              <span className="text-xs text-muted-foreground">
                {rows.length} Eintrag{rows.length === 1 ? "" : "e"} ·{" "}
                {totalHours(rows)} h
              </span>
            </div>

            {monthReports.length > 0 ? (
              <div className="flex items-center gap-2 border-b bg-amber-50/60 px-4 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <CheckCircle2 className="size-3.5" />
                {monthReports.length === 1
                  ? `Monatsbericht von ${monthReports[0].supervisorName} unterschrieben.`
                  : `Monatsberichte unterschrieben (${monthReports.length}).`}{" "}
                Änderungen werden protokolliert.
              </div>
            ) : null}

            <ul className="divide-y">
              {rows.map((event) => {
                const signedKey = `${event.userId}-${year}-${month}`;
                const isMonthSigned = signedKeys.has(signedKey);
                return (
                  <AdminEventRow
                    key={event.id}
                    event={event}
                    edits={data.editsByEventId[event.id] ?? []}
                    isMonthSigned={isMonthSigned}
                    secondary={
                      event.userName ? (
                        <span className="truncate">{event.userName}</span>
                      ) : null
                    }
                    onDeleted={onChanged}
                  />
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
