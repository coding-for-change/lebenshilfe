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
