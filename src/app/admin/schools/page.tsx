import { requireAdmin } from "@/lib/auth-guards";
import {
  SchoolsFacade,
  SchoolsTable,
  serializeSchool,
} from "@/features/schools";
import {
  HolidayPlansFacade,
  serializeHolidayPlan,
} from "@/features/holiday-plans";

export default async function SchoolsPage() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  const [schools, plans] = await Promise.all([
    SchoolsFacade.list(),
    HolidayPlansFacade.list(),
  ]);

  return (
    <SchoolsTable
      schools={schools.map(serializeSchool)}
      holidayPlans={plans.map(serializeHolidayPlan)}
    />
  );
}
