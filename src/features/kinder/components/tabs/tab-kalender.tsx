"use client";

import { useRouter } from "next/navigation";
import { KinderWeekCalendar } from "../calendar/week-calendar";
import type { SerializedChild } from "../serialize";

type Props = {
  child: SerializedChild;
  schulbegleiterOptions: { id: string; name: string }[];
};

export function TabKalender({ child, schulbegleiterOptions }: Props) {
  const router = useRouter();

  return (
    <KinderWeekCalendar
      childId={child.id}
      childLabel={`${child.firstName} ${child.lastName}`}
      schedules={child.schedules}
      assignments={child.assignments}
      absences={child.absences}
      schulbegleiterOptions={schulbegleiterOptions}
      onChanged={() => router.refresh()}
    />
  );
}
