"use client";

import { DAY_LABELS_DE, hoursToTime } from "./week-utils";
import type { EventKind } from "./week-calendar";
import { EventFormAssignment } from "./event-form-assignment";
import { EventFormSchedule } from "./event-form-schedule";
import { EventFormAbsence } from "./event-form-absence";
import type { SchoolAssistantOption } from "./school-assistant-combobox";

type Props = {
  kind: EventKind;
  childId: string;
  weekStart: Date;
  weekday: number;
  startHour: number;
  endHour: number;
  schoolAssistantOptions: SchoolAssistantOption[];
  onSaved: () => void;
  onCancel: () => void;
};

// Inline form rendered inside a Popover. State is initialised from the drag
// selection on first mount; the parent remounts (via a fresh `key`) when a
// new drag completes, so we don't need internal reset logic.
export function EventCreateForm({
  kind,
  childId,
  weekStart,
  weekday,
  startHour,
  endHour,
  schoolAssistantOptions,
  onSaved,
  onCancel,
}: Props) {
  const subtitle =
    kind === "absence"
      ? `${DAY_LABELS_DE[weekday]} · Ganzer Tag`
      : `${DAY_LABELS_DE[weekday]} · ${hoursToTime(startHour)} – ${hoursToTime(endHour)}`;

  if (kind === "assignment") {
    return (
      <EventFormAssignment
        childId={childId}
        weekday={weekday}
        startHour={startHour}
        endHour={endHour}
        schoolAssistantOptions={schoolAssistantOptions}
        subtitle={subtitle}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    );
  }
  if (kind === "schedule") {
    return (
      <EventFormSchedule
        childId={childId}
        weekday={weekday}
        startHour={startHour}
        endHour={endHour}
        subtitle={subtitle}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    );
  }
  return (
    <EventFormAbsence
      childId={childId}
      weekStart={weekStart}
      weekday={weekday}
      subtitle={subtitle}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
