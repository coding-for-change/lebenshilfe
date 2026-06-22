"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, isoWeek, MONTHS_SHORT, startOfWeekUtc } from "@/lib/dates";
import { WeekGrid } from "./week-grid";
import { ChildrenFilter, type ChildOption } from "./children-filter";
import type { Event, Schedule } from "@/generated/prisma";
import type { ChildSchoolHolidayItem, VertretungDay } from "./timesheet-shell";
import type { AssignmentsByWeekday } from "../weekday";

type Props = {
  anchorDate: Date;
  onAnchorDateChange: (d: Date) => void;
  today: Date;
  onSelectDay: (d: Date) => void;
  onRequestNewEntry: () => void;
  assignedChildren: ChildOption[];
  selectedChildIds: string[];
  onSelectedChildIdsChange: (ids: string[]) => void;
  events: Array<
    Pick<Event, "id" | "date" | "type" | "startTime" | "endTime" | "childId">
  >;
  schedules: Schedule[];
  childSchoolHolidays?: ChildSchoolHolidayItem[];
  assignmentsByWeekday: AssignmentsByWeekday;
  substituteOn?: VertretungDay[];
};

export function TabWoche({
  anchorDate,
  onAnchorDateChange,
  today,
  onSelectDay,
  onRequestNewEntry,
  assignedChildren,
  selectedChildIds,
  onSelectedChildIdsChange,
  events,
  schedules,
  childSchoolHolidays = [],
  assignmentsByWeekday,
  substituteOn = [],
}: Props) {
  const monday = startOfWeekUtc(anchorDate);
  const sunday = addDays(monday, 6);
  const rangeLabel =
    monday.getUTCMonth() === sunday.getUTCMonth()
      ? `${monday.getUTCDate()}.–${sunday.getUTCDate()}. ${MONTHS_SHORT[monday.getUTCMonth()]}`
      : `${monday.getUTCDate()}. ${MONTHS_SHORT[monday.getUTCMonth()]} – ${sunday.getUTCDate()}. ${MONTHS_SHORT[sunday.getUTCMonth()]}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            KW {isoWeek(anchorDate)} · {anchorDate.getUTCFullYear()}
          </p>
          <h1 className="text-xl font-semibold">{rangeLabel}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onAnchorDateChange(addDays(anchorDate, -7))}
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAnchorDateChange(today)}
          >
            Heute
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onAnchorDateChange(addDays(anchorDate, 7))}
            aria-label="Nächste Woche"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <ChildrenFilter
          options={assignedChildren}
          selected={selectedChildIds}
          onChange={onSelectedChildIdsChange}
        />
        <Button
          size="sm"
          onClick={onRequestNewEntry}
        >
          <Plus className="size-4" /> Neu
        </Button>
      </div>

      <WeekGrid
        anchorDate={anchorDate}
        today={today}
        childList={assignedChildren}
        selectedChildIds={selectedChildIds}
        events={events}
        schedules={schedules}
        assignmentsByWeekday={assignmentsByWeekday}
        onSelectDay={onSelectDay}
        childSchoolHolidays={childSchoolHolidays}
        substituteOn={substituteOn}
      />

      <p className="text-xs text-muted-foreground">
        Helle Blöcke = Stundenplan. Farbige Blöcke = erfasste Arbeitszeiten.
        Rote Bänder = ganztägige Krankheit. Grüne Tage = Schulferien.
      </p>
    </div>
  );
}
