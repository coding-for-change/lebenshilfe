import type { SchulbegleiterStatus } from "@/generated/prisma";
import type { ProfileWithAttendances } from "../services";

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
  attendances: SerializedAttendance[];
};

function toIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
    introductionDay: p.introductionDay ? toIso(p.introductionDay) : null,
    attendances: p.attendances.map((a) => ({
      workshopId: a.workshopId,
      attendedOn: toIso(a.attendedOn),
    })),
  };
}
