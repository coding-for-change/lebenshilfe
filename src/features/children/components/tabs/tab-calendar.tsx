"use client";

import { useRouter } from "next/navigation";
import { KinderWeekCalendar } from "../calendar/week-calendar";
import type { SerializedChild } from "../../serialize";

type Props = {
  child: SerializedChild;
  schoolAssistantOptions: { id: string; name: string }[];
};

export function TabCalendar({ child, schoolAssistantOptions }: Props) {
  const router = useRouter();

  return (
    <KinderWeekCalendar
      childId={child.id}
      childLabel={`${child.firstName} ${child.lastName}`}
      schedules={child.schedules}
      assignments={child.assignments}
      absences={child.absences}
      vertretungen={child.vertretungen}
      schoolAssistantOptions={schoolAssistantOptions}
      onChanged={() => router.refresh()}
    />
  );
}
