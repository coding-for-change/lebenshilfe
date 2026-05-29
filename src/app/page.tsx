import { getSession } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/roles";
import { TimesheetFacade, SchoolAssistantApp } from "@/features/timesheet";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { ChildrenFacade } from "@/features/children";

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

  const assignedChildren = await TimesheetFacade.listAssignedChildren(user.id);
  const childIds = assignedChildren.map((c) => c.id);

  const [
    events,
    schedules,
    lockedMonthKeys,
    profile,
    childAbsences,
    assignmentsByWeekday,
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
  ]);

  return (
    <SchoolAssistantApp
      currentUser={{
        id: user.id,
        name: profile?.name ?? "",
        email: user.email,
      }}
      assignedChildren={assignedChildren.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
      }))}
      events={events.map((e) => ({
        ...e,
        child: e.child
          ? { firstName: e.child.firstName, lastName: e.child.lastName }
          : null,
      }))}
      schedules={schedules}
      lockedMonthKeys={lockedMonthKeys}
      childAbsences={childAbsences.map((a) => ({
        childId: a.childId,
        date: a.date.toISOString().slice(0, 10),
        note: a.note,
      }))}
      assignmentsByWeekday={assignmentsByWeekday}
    />
  );
}
