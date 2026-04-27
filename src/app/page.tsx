import { AuthFacade } from "@/features/auth/facade";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/roles";
import { TimesheetFacade, SchulbegleiterApp } from "@/features/timesheet";
import { KinderFacade } from "@/features/kinder";

export default async function LandingPage() {
  const session = await AuthFacade.getSession();

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

  const [events, schedules, lockedMonthKeys, childAbsences] = await Promise.all(
    [
      TimesheetFacade.getEventsInRange(user.id, rangeStart, rangeEnd),
      TimesheetFacade.getSchedulesForChildren(childIds),
      TimesheetFacade.listLockedMonthKeys(user.id),
      KinderFacade.listAbsencesForChildrenInRange(
        childIds,
        rangeStart,
        rangeEnd,
      ),
    ],
  );

  return (
    <SchulbegleiterApp
      currentUser={{ id: user.id, name: user.name, email: user.email }}
      assignedChildren={assignedChildren.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
      }))}
      events={events}
      schedules={schedules}
      lockedMonthKeys={lockedMonthKeys}
      childAbsences={childAbsences.map((a) => ({
        childId: a.childId,
        date: a.date.toISOString().slice(0, 10),
        note: a.note,
      }))}
    />
  );
}
