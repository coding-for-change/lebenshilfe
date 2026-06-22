import {
  HolidayPlansFacade,
  HolidayPlansTable,
  serializeHolidayPlan,
} from "@/features/holiday-plans";

export default async function HolidayPlansPage() {
  const plans = await HolidayPlansFacade.list();

  return <HolidayPlansTable plans={plans.map(serializeHolidayPlan)} />;
}
