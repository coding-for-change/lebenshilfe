import { AuthFacade } from "@/features/auth/facade";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma";
import { TimesheetFacade, SchulbegleiterApp } from "@/features/timesheet";
import { KinderFacade } from "@/features/kinder";

export default async function LandingPage() {
  const session = await AuthFacade.getSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-border shadow-xl rounded-2xl p-8 text-center space-y-6">
          <h1 className="text-3xl font-bold text-primary">
            Willkommen bei Lebenshilfe
          </h1>
          <p className="text-muted-foreground">
            Dieses Portal ist ausschließlich für geladene Mitglieder zugänglich.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button className="w-full h-12 text-lg">Zum Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user } = session;

  if (user.role === Role.ADMIN) {
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
