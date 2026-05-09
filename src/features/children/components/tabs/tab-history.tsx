"use client";

import { FileDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { listEventsForChildAction } from "@/features/timesheet/actions";
import { AdminHistoryView } from "@/features/timesheet/components/admin-history-view";
import { useAdminHistory } from "@/features/timesheet/lib/use-admin-history";
import type { SerializedChild } from "../../serialize";

type Props = {
  child: SerializedChild;
};

export function TabHistory({ child }: Props) {
  const { state, refetch } = useAdminHistory(
    child.id,
    listEventsForChildAction,
  );

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

      <AdminHistoryView
        state={state}
        onChanged={refetch}
        getSecondary={(event) =>
          event.userName ? (
            <span className="truncate">{event.userName}</span>
          ) : null
        }
        renderBanner={(reports) => {
          if (reports.length === 0) return null;
          return (
            <>
              {reports.length === 1
                ? `Monatsbericht von ${reports[0].supervisorName} unterschrieben.`
                : `Monatsberichte unterschrieben (${reports.length}).`}{" "}
              Änderungen werden protokolliert.
            </>
          );
        }}
      />
    </div>
  );
}
