"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { match } from "ts-pattern";
import type {
  SerializedAdminEvent,
  SerializedAdminHistory,
  SerializedSignedMonth,
} from "../actions";
import {
  compareMonthKey,
  currentMonthKey,
  formatMonthLabel,
  groupByMonth,
  monthKeyOf,
  totalHours,
} from "../lib/group";
import type { AdminHistoryState } from "../lib/use-admin-history";
import { AdminEventRow } from "./admin-event-row";
import { MonthNavigator } from "./month-navigator";

type Props = {
  state: AdminHistoryState;
  onChanged: () => void;
  getSecondary: (event: SerializedAdminEvent) => ReactNode;
  renderBanner: (monthReports: SerializedSignedMonth[]) => ReactNode | null;
};

export function AdminHistoryView({
  state,
  onChanged,
  getSecondary,
  renderBanner,
}: Props) {
  return match(state)
    .with({ status: "error" }, ({ message }) => (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
        {message}
      </div>
    ))
    .with({ status: "loaded", data: { events: [] } }, () => (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Noch keine erfassten Zeiten.
      </div>
    ))
    .with({ status: "loaded" }, ({ data }) => (
      <HistoryList
        data={data}
        onChanged={onChanged}
        getSecondary={getSecondary}
        renderBanner={renderBanner}
      />
    ))
    .otherwise(() => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Lade Historie…
      </div>
    ));
}

function HistoryList({
  data,
  onChanged,
  getSecondary,
  renderBanner,
}: {
  data: SerializedAdminHistory;
  onChanged: () => void;
  getSecondary: (event: SerializedAdminEvent) => ReactNode;
  renderBanner: (monthReports: SerializedSignedMonth[]) => ReactNode | null;
}) {
  const signedKeys = new Set(
    data.signedMonths.map((m) => `${m.userId}-${m.year}-${m.month}`),
  );

  const { minMonthKey, maxMonthKey, defaultMonthKey } = useMemo(() => {
    const keys = data.events.map((e) => monthKeyOf(e.date)).sort();
    const today = currentMonthKey();
    const earliest = keys[0] ?? today;
    const latest = keys[keys.length - 1] ?? today;
    return {
      minMonthKey: compareMonthKey(earliest, today) < 0 ? earliest : today,
      maxMonthKey: compareMonthKey(latest, today) > 0 ? latest : today,
      defaultMonthKey: keys.includes(today) ? today : latest,
    };
  }, [data.events]);

  const [monthKey, setMonthKey] = useState(defaultMonthKey);
  const groups = groupByMonth(
    data.events.filter((e) => monthKeyOf(e.date) === monthKey),
  );

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
        const bannerContent = renderBanner(monthReports);

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

            {bannerContent ? (
              <div className="flex items-center gap-2 border-b bg-amber-50/60 px-4 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <CheckCircle2 className="size-3.5" />
                {bannerContent}
              </div>
            ) : null}

            <ul className="divide-y">
              {rows.map((event) => {
                const isMonthSigned = signedKeys.has(
                  `${event.userId}-${year}-${month}`,
                );
                return (
                  <AdminEventRow
                    key={event.id}
                    event={event}
                    edits={data.editsByEventId[event.id] ?? []}
                    isMonthSigned={isMonthSigned}
                    secondary={getSecondary(event)}
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
