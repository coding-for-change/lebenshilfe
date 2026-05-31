import { getSession } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/roles";
import { TimesheetFacade, SchoolAssistantApp } from "@/features/timesheet";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { ChildrenFacade, serializeChild } from "@/features/children";
import { getAssignedChildrenForUser } from "@/use-cases/get-assigned-children";

export default async function LandingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (isAdmin(user.role)) {
    redirect("/admin");
  }

  const today = new Date();
  const rangeStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 6, 1),
  );
  const rangeEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 1),
  );

  const assignedChildren = await getAssignedChildrenForUser(
    user.id,
    rangeStart,
    rangeEnd,
  );
  const childIds = assignedChildren.map((c) => c.id);

  const [
    events,
    schedules,
    lockedMonthKeys,
    profile,
    childAbsences,
    assignmentsByWeekday,
    vertretungenAsSubstitute,
    allChildren,
  ] = await Promise.all([
    TimesheetFacade.getEventsInRange(user.id, rangeStart, rangeEnd),
    TimesheetFacade.getSchedulesForChildren(childIds),
    TimesheetFacade.listLockedMonthKeys(user.id),
    SchoolAssistantsFacade.getByEmail(user.email),
    ChildrenFacade.listAbsencesForChildrenInRange(
      childIds,
      rangeStart,
      rangeEnd,
    ),
    TimesheetFacade.getAssignmentsByWeekday(user.id),
    ChildrenFacade.listVertretungenForUserAsSubstitute(
      user.id,
      rangeStart,
      rangeEnd,
    ),
    ChildrenFacade.list(),
  ]);

  // Resolve each assigned child's school holiday-plan ranges so the day view can
  // show "Heute sind Schulferien" when their school is closed.
  const holidaysByChildId = new Map<
    string,
    { name: string | null; startDate: string; endDate: string }[]
  >();
  for (const raw of allChildren) {
    const c = serializeChild(raw);
    if (c.school && c.school.holidays.length > 0) {
      holidaysByChildId.set(c.id, c.school.holidays);
    }
  }
  const childSchoolHolidays = assignedChildren.flatMap((c) =>
    (holidaysByChildId.get(c.id) ?? []).map((h) => ({
      childId: c.id,
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
    })),
  );

  return (
    <SchoolAssistantApp
      currentUser={{
        id: user.id,
        name: profile?.name ?? "",
        email: user.email,
      }}
      assignedChildren={assignedChildren}
      events={events}
      schedules={schedules}
      lockedMonthKeys={lockedMonthKeys}
      childAbsences={childAbsences.map((a) => ({
        childId: a.childId,
        date: a.date.toISOString().slice(0, 10),
        note: a.note,
      }))}
      assignmentsByWeekday={assignmentsByWeekday}
      childSchoolHolidays={childSchoolHolidays}
      substituteOn={vertretungenAsSubstitute.map((v) => ({
        id: v.id,
        date: v.date.toISOString().slice(0, 10),
        childId: v.childId,
        childName: `${v.child.firstName} ${v.child.lastName}`,
        startTime: v.startTime,
        endTime: v.endTime,
      }))}
    />
  );
}
