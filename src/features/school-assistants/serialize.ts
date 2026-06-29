import type { SchulbegleiterStatus } from "@/generated/prisma";
import { formatIsoDateUtc } from "@/lib/utils";
import type { ProfileWithAttendances } from "./services";

export type SerializedAttendance = {
  workshopId: string;
  attendedOn: string; // YYYY-MM-DD
};

export type SerializedProfile = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  status: SchulbegleiterStatus;
  leosOne: boolean;
  outlook: boolean;
  weeklyHours: number | null;
  zvNeuNachBescheid: boolean;
  zvNeuNote: string | null;
  introductionDay: string | null; // YYYY-MM-DD
  pool: { id: string; name: string } | null;
  attendances: SerializedAttendance[];
};

export function serializeProfile(p: ProfileWithAttendances): SerializedProfile {
  return {
    id: p.id,
    userId: p.userId,
    email: p.email,
    name: p.name,
    status: p.status,
    leosOne: p.leosOne,
    outlook: p.outlook,
    weeklyHours: p.weeklyHours == null ? null : Number(p.weeklyHours),
    zvNeuNachBescheid: p.zvNeuNachBescheid,
    zvNeuNote: p.zvNeuNote,
    introductionDay: p.introductionDay
      ? formatIsoDateUtc(p.introductionDay)
      : null,
    pool: p.pool ? { id: p.pool.id, name: p.pool.name } : null,
    attendances: p.attendances.map((a) => ({
      workshopId: a.workshopId,
      attendedOn: formatIsoDateUtc(a.attendedOn),
    })),
  };
}
