import { formatIsoDateUtc } from "@/lib/utils";
import type { ChildWithRelations } from "./services";

export type SerializedAssignment = {
  id: string;
  profileId: string;
  userName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  tandem: boolean;
};

export type SerializedSchedule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
};

export type SerializedAbsence = {
  id: string;
  date: string; // YYYY-MM-DD
  note: string | null;
};

export type SerializedVertretung = {
  id: string;
  substituteUserId: string;
  substituteUserName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
};

export type SerializedWorkEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
  userName: string;
};

export type SerializedCostBearer = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
};

export type SerializedSchoolHoliday = {
  id: string;
  name: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

export type SerializedChildSchool = {
  id: string;
  name: string;
  address: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  // Holiday ranges from the school's assigned plan (empty when no plan).
  holidays: SerializedSchoolHoliday[];
};

export type SerializedChild = {
  id: string;
  firstName: string;
  lastName: string;
  leosOne: boolean;
  bescheid: string | null;
  sbIb: string | null;
  approvedDirectHours: number | null;
  approvedIndirectHours: number | null;
  vorviertelstunde: boolean;
  nachviertelstunde: boolean;
  ausflugSchullandheim: boolean;
  schweigepflichtsentbindung: boolean;
  bemerkung: string | null;
  school: SerializedChildSchool | null;
  costBearer: SerializedCostBearer | null;
  pool: { id: string; name: string } | null;
  assignments: SerializedAssignment[];
  schedules: SerializedSchedule[];
  absences: SerializedAbsence[];
  vertretungen: SerializedVertretung[];
};

export function serializeChild(c: ChildWithRelations): SerializedChild {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    leosOne: c.leosOne,
    bescheid: c.bescheid,
    sbIb: c.sbIb,
    approvedDirectHours:
      c.approvedDirectHours == null ? null : Number(c.approvedDirectHours),
    approvedIndirectHours:
      c.approvedIndirectHours == null ? null : Number(c.approvedIndirectHours),
    vorviertelstunde: c.vorviertelstunde,
    nachviertelstunde: c.nachviertelstunde,
    ausflugSchullandheim: c.ausflugSchullandheim,
    schweigepflichtsentbindung: c.schweigepflichtsentbindung,
    bemerkung: c.bemerkung,
    school: c.school
      ? {
          id: c.school.id,
          name: c.school.name,
          address: c.school.address,
          placeId: c.school.placeId,
          lat: c.school.lat == null ? null : Number(c.school.lat),
          lng: c.school.lng == null ? null : Number(c.school.lng),
          holidays: (c.school.holidayPlan?.holidays ?? []).map((h) => ({
            id: h.id,
            name: h.name,
            startDate: formatIsoDateUtc(h.startDate),
            endDate: formatIsoDateUtc(h.endDate),
          })),
        }
      : null,
    costBearer: c.kostentraeger
      ? {
          id: c.kostentraeger.id,
          name: c.kostentraeger.name,
          email: c.kostentraeger.email,
          address: c.kostentraeger.address,
        }
      : null,
    pool: c.pool ? { id: c.pool.id, name: c.pool.name } : null,
    assignments: c.assignments.map((a) => ({
      id: a.id,
      profileId: a.profileId,
      userName: a.profile.name,
      weekday: a.weekday,
      startTime: a.startTime,
      endTime: a.endTime,
      tandem: a.tandem,
    })),
    schedules: c.schedules.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    absences: c.absences.map((a) => ({
      id: a.id,
      date: formatIsoDateUtc(a.date),
      note: a.note,
    })),
    vertretungen: c.vertretungen.map((v) => ({
      id: v.id,
      substituteUserId: v.substituteUserId,
      substituteUserName: v.substituteUser.name,
      date: formatIsoDateUtc(v.date),
      startTime: v.startTime,
      endTime: v.endTime,
    })),
  };
}
