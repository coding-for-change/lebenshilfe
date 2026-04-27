import type { ChildWithRelations } from "../services";

export type SerializedAssignment = {
  id: string;
  userId: string;
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

export type SerializedKostentraeger = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
};

export type SerializedChild = {
  id: string;
  firstName: string;
  lastName: string;
  leosOne: boolean;
  bescheid: string | null;
  sbIb: string | null;
  schweigepflichtsentbindung: boolean;
  bemerkung: string | null;
  schoolName: string | null;
  schoolAddress: string | null;
  schoolPlaceId: string | null;
  schoolLat: number | null;
  schoolLng: number | null;
  kostentraeger: SerializedKostentraeger | null;
  assignments: SerializedAssignment[];
  schedules: SerializedSchedule[];
  absences: SerializedAbsence[];
};

function toIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function serializeChild(c: ChildWithRelations): SerializedChild {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    leosOne: c.leosOne,
    bescheid: c.bescheid,
    sbIb: c.sbIb,
    schweigepflichtsentbindung: c.schweigepflichtsentbindung,
    bemerkung: c.bemerkung,
    schoolName: c.schoolName,
    schoolAddress: c.schoolAddress,
    schoolPlaceId: c.schoolPlaceId,
    schoolLat: c.schoolLat == null ? null : Number(c.schoolLat),
    schoolLng: c.schoolLng == null ? null : Number(c.schoolLng),
    kostentraeger: c.kostentraeger
      ? {
          id: c.kostentraeger.id,
          name: c.kostentraeger.name,
          email: c.kostentraeger.email,
          address: c.kostentraeger.address,
        }
      : null,
    assignments: c.assignments.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
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
      date: toIso(a.date),
      note: a.note,
    })),
  };
}
