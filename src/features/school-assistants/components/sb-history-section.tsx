"use client";

import { listEventsForSchoolAssistantAction } from "@/features/timesheet/actions";
import { AdminHistoryView } from "@/features/timesheet/components/admin-history-view";
import { useAdminHistory } from "@/features/timesheet/lib/use-admin-history";

type Props = {
  userId: string | null;
};

export function SbHistorySection({ userId }: Props) {
  const { state, refetch } = useAdminHistory(
    userId,
    listEventsForSchoolAssistantAction,
  );

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
      <AdminHistoryView
        state={state}
        onChanged={refetch}
        getSecondary={(event) =>
          event.childName ? (
            <span className="truncate">{event.childName}</span>
          ) : null
        }
        renderBanner={(reports) => {
          const report = reports.find((r) => r.userId === userId);
          if (!report) return null;
          return (
            <>
              Vom Vorgesetzten ({report.supervisorName}) unterschrieben am{" "}
              {new Date(report.signedAt).toLocaleDateString("de-DE")}.
              Änderungen werden protokolliert.
            </>
          );
        }}
      />
    </div>
  );
}
