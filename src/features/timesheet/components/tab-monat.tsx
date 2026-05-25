"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarGrid } from "./calendar-grid";
import { HandoverDialog } from "./handover-dialog";
import { MONTHS_LONG, isSameUtcDay } from "./date-utils";
import type { Event } from "@/generated/prisma";

type VertretungDay = {
  date: string;
  childName: string;
  startTime: string;
  endTime: string;
};

type Props = {
  viewDate: Date;
  today: Date;
  selectedDate: Date;
  onViewDateChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  events: Array<
    Pick<Event, "id" | "date" | "type" | "startTime" | "endTime" | "childId">
  >;
  lockedMonths: Set<string>;
  substituteOn?: VertretungDay[];
};

export function TabMonat({
  viewDate,
  today,
  selectedDate,
  onViewDateChange,
  onSelectDay,
  events,
  lockedMonths,
  substituteOn = [],
}: Props) {
  const year = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth() + 1;
  const [handoverOpen, setHandoverOpen] = useState(false);

  const monthEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.date.getUTCFullYear() === year &&
          e.date.getUTCMonth() + 1 === month,
      ),
    [events, year, month],
  );

  // Filter Vertretung days to the current month for the calendar.
  const monthSubstituteOn = useMemo(
    () =>
      substituteOn.filter((v) => {
        const d = new Date(v.date);
        return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
      }),
    [substituteOn, year, month],
  );

  const locked = lockedMonths.has(`${year}-${month}`);
  const monthCompleted = new Date(Date.UTC(year, month, 1)) <= today;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Lehrer Ansicht
          </p>
          <h1 className="text-xl font-semibold">
            {MONTHS_LONG[month - 1]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              onViewDateChange(new Date(Date.UTC(year, month - 2, 1)))
            }
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onViewDateChange(
                new Date(
                  Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
                ),
              )
            }
          >
            Heute
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onViewDateChange(new Date(Date.UTC(year, month, 1)))}
            aria-label="Nächster Monat"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <CalendarGrid
          year={year}
          month={month}
          today={today}
          selectedDate={
            isSameUtcDay(selectedDate, viewDate) ? selectedDate : viewDate
          }
          events={monthEvents}
          onSelectDay={onSelectDay}
          locked={locked}
          substituteOn={monthSubstituteOn}
        />
      </Card>

      <Button
        size="lg"
        className="w-full h-14"
        disabled={locked || !monthCompleted}
        onClick={() => setHandoverOpen(true)}
      >
        <ShieldCheck className="size-5" />
        {locked
          ? "Bereits an Vorgesetzten übergeben"
          : !monthCompleted
            ? "Monat noch nicht abgeschlossen"
            : "An Vorgesetzten übergeben"}
      </Button>

      <HandoverDialog
        open={handoverOpen}
        onOpenChange={setHandoverOpen}
        year={year}
        month={month}
        events={monthEvents}
      />
    </div>
  );
}
