import { getSession } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/roles";
import { TimesheetFacade, SchoolAssistantApp } from "@/features/timesheet";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { ChildrenFacade } from "@/features/children";
import { VertretungRequestsFacade } from "@/features/vertretung-requests";
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
    pendingVertretungRequests,
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
    VertretungRequestsFacade.listForUser(user.id, rangeStart, rangeEnd),
  ]);

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
      substituteOn={vertretungenAsSubstitute.map((v) => {
        const sbRequest = pendingVertretungRequests.find(
          (r) =>
            r.date.getTime() === v.date.getTime() &&
            (r.matchedChildId === v.childId || r.resolvedChildId === v.childId),
        );
        return {
          id: v.id,
          date: v.date.toISOString().slice(0, 10),
          childId: v.childId,
          childName: `${v.child.firstName} ${v.child.lastName}`,
          startTime: v.startTime,
          endTime: v.endTime,
          sbRequestId: sbRequest?.id ?? null,
        };
      })}
      pendingVertretungRequests={pendingVertretungRequests.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        childNameText: r.childNameText,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status as "PENDING" | "RESOLVED",
      }))}
    />
  );
}
