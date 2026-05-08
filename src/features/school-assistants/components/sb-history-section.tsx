"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { match } from "ts-pattern";
import {
  listEventsForSchoolAssistantAction,
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

type Props = {
  userId: string | null;
};

// userId is tagged on each variant so the match guards against rendering
// stale data from a previous selection during the render between a userId
// change and the effect that resets state.
type LoadState =
  | { status: "loading"; userId: string }
  | { status: "loaded"; userId: string; data: SerializedAdminHistory }
  | { status: "error"; userId: string; message: string };

export function SbHistorySection({ userId }: Props) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    userId: userId ?? "",
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setState({ status: "loading", userId });
    let cancelled = false;
    listEventsForSchoolAssistantAction(userId)
      .then((data) => {
        if (!cancelled) setState({ status: "loaded", userId, data });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          userId,
          message: err instanceof Error ? err.message : "Laden fehlgeschlagen.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, nonce]);

  if (!userId) {
    return (
      <div className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Sobald die Einladung angenommen wurde, erscheinen hier alle erfassten
        Arbeitszeiten.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {match(state)
        .with({ status: "error", userId }, ({ message }) => (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {message}
          </div>
        ))
        .with({ status: "loaded", userId, data: { events: [] } }, () => (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Noch keine erfassten Zeiten.
          </div>
        ))
        .with({ status: "loaded", userId }, ({ data }) => (
          <SignedHistoryList
            data={data}
            onChanged={() => setNonce((n) => n + 1)}
          />
        ))
        .otherwise(() => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Lade Historie…
          </div>
        ))}
    </div>
  );
}

function SignedHistoryList({
  data,
  onChanged,
}: {
  data: SerializedAdminHistory;
  onChanged: () => void;
}) {
  const signedByKey = new Map(
    data.signedMonths.map((m) => [`${m.userId}-${m.year}-${m.month}`, m]),
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
        const signedReport = signedByKey.get(
          `${rows[0]?.userId}-${Number(yearStr)}-${Number(monthStr)}`,
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

            {signedReport ? (
              <div className="flex items-center gap-2 border-b bg-amber-50/60 px-4 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <CheckCircle2 className="size-3.5" />
                Vom Vorgesetzten ({signedReport.supervisorName}) unterschrieben
                am{" "}
                {new Date(signedReport.signedAt).toLocaleDateString("de-DE")}.
                Änderungen werden protokolliert.
              </div>
            ) : null}

            <ul className="divide-y">
              {rows.map((event) => (
                <AdminEventRow
                  key={event.id}
                  event={event}
                  edits={data.editsByEventId[event.id] ?? []}
                  isMonthSigned={!!signedReport}
                  secondary={
                    event.childName ? (
                      <span className="truncate">{event.childName}</span>
                    ) : null
                  }
                  onDeleted={onChanged}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
