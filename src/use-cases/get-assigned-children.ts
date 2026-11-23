/**
 * Use case: Get the full list of children assigned to a Schulbegleiter.
 *
 * Coordinates two feature facades:
 *  1. TimesheetFacade.listAssignedChildren — children via recurring weekday
 *     assignments (pure timesheet domain).
 *  2. ChildrenFacade.listVertretungenForUserAsSubstitute — children the user
 *     covers as substitute within the given date window.
 *
 * The merge lives here because TimesheetFacade cannot call ChildrenFacade
 * (facades are single-domain) and the page should not contain merge logic.
 *
 * Children the user only covers as substitute come back in
 * `substituteOnlyDays` with the dates of their Vertretungen. For those
 * children the Schulbegleiter gets nothing beyond what the Vertretung itself
 * needs: no Stundenplan, and absences or holidays only on those dates.
 *
 * NOTE: The time window for Vertretung children is a known limitation; a
 * Vertretung outside [substituteFrom, substituteTo] will not appear in the
 * returned list. This is tracked separately for improvement.
 */

import { ChildrenFacade } from "@/features/children/facade";
import { TimesheetFacade } from "@/features/timesheet/facade";

type AssignedChild = {
  id: string;
  firstName: string;
  lastName: string;
  vorviertelstunde: boolean;
  nachviertelstunde: boolean;
};

export async function getAssignedChildrenForUser(
  userId: string,
  substituteFrom: Date,
  substituteTo: Date,
) {
  const [regular, vertretungen] = await Promise.all([
    TimesheetFacade.listAssignedChildren(userId),
    ChildrenFacade.listVertretungenForUserAsSubstitute(
      userId,
      substituteFrom,
      substituteTo,
    ),
  ]);

  const seen = new Set(regular.map((c) => c.id));
  const children: AssignedChild[] = regular.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    vorviertelstunde: c.vorviertelstunde,
    nachviertelstunde: c.nachviertelstunde,
  }));

  // childId → ISO dates (YYYY-MM-DD) of the Vertretungen, for children the
  // user has no regular assignment with.
  const substituteOnlyDays = new Map<string, Set<string>>();
  for (const v of vertretungen) {
    if (seen.has(v.childId) && !substituteOnlyDays.has(v.childId)) continue;
    if (!seen.has(v.childId)) {
      seen.add(v.childId);
      children.push({
        id: v.child.id,
        firstName: v.child.firstName,
        lastName: v.child.lastName,
        vorviertelstunde: v.child.vorviertelstunde,
        nachviertelstunde: v.child.nachviertelstunde,
      });
    }
    const days = substituteOnlyDays.get(v.childId) ?? new Set<string>();
    days.add(v.date.toISOString().slice(0, 10));
    substituteOnlyDays.set(v.childId, days);
  }

  return { children, vertretungen, substituteOnlyDays };
}
