import { formatIsoDateUtc } from "@/lib/utils";
import type { HolidayPlanWithRelations } from "./services";

export type SerializedHolidayEntry = {
  id: string;
  name: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

export type SerializedHolidayPlan = {
  id: string;
  name: string;
  schoolCount: number;
  holidays: SerializedHolidayEntry[];
};

export function serializeHolidayPlan(
  p: HolidayPlanWithRelations,
): SerializedHolidayPlan {
  return {
    id: p.id,
    name: p.name,
    schoolCount: p._count.schools,
    holidays: p.holidays.map((h) => ({
      id: h.id,
      name: h.name,
      startDate: formatIsoDateUtc(h.startDate),
      endDate: formatIsoDateUtc(h.endDate),
    })),
  };
}

// A plan's holiday range tagged with its plan — returned for the SB banner.
export type PlanHolidayRange = {
  id: string;
  planId: string;
  name: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};
