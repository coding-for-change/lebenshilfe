import { formatIsoDateUtc } from "@/lib/utils";
import type { SchoolWithRelations } from "./services";

export type SerializedHoliday = {
  id: string;
  name: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

export type SerializedSchoolHolidayPlan = {
  id: string;
  name: string;
  holidays: SerializedHoliday[];
};

export type SerializedSchool = {
  id: string;
  name: string;
  address: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  childrenCount: number;
  holidayPlan: SerializedSchoolHolidayPlan | null;
};

export function serializeSchool(s: SchoolWithRelations): SerializedSchool {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    placeId: s.placeId,
    lat: s.lat == null ? null : Number(s.lat),
    lng: s.lng == null ? null : Number(s.lng),
    childrenCount: s._count.children,
    holidayPlan: s.holidayPlan
      ? {
          id: s.holidayPlan.id,
          name: s.holidayPlan.name,
          holidays: s.holidayPlan.holidays.map((h) => ({
            id: h.id,
            name: h.name,
            startDate: formatIsoDateUtc(h.startDate),
            endDate: formatIsoDateUtc(h.endDate),
          })),
        }
      : null,
  };
}
