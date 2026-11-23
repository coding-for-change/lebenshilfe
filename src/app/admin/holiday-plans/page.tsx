import { requireAdmin } from "@/lib/auth-guards";
import {
  HolidayPlansFacade,
  HolidayPlansTable,
  serializeHolidayPlan,
} from "@/features/holiday-plans";

export default async function HolidayPlansPage() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  const plans = await HolidayPlansFacade.list();

  return <HolidayPlansTable plans={plans.map(serializeHolidayPlan)} />;
}
