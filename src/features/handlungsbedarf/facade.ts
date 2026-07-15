import {
  findAllAssignments,
  findAllSchedulesWithHolidayPlan,
  findAssignmentsByUserIds,
  findChildAbsencesInRange,
  findChildrenMissingSchweigepflicht,
  findChildWorkEventsInRange,
  findSickEventsInRange,
  findVertretungenInRange,
  findWorkEventsForChildrenOnDates,
} from "./services";
import type {
  BookedHoursOverScheduleFlag,
  ChildAbsentInfoFlag,
  ChildAbsentWorkBookedFlag,
  MissingSchweigepflichtFlag,
  ProblemFlag,
  SbSickNoSubstituteFlag,
  ScheduleBlockUnassignedFlag,
  SubstituteAlsoSickFlag,
} from "./schemas";

// Tolerance applied to BOOKED_HOURS_OVER_SCHEDULE: only flag when daily booked
// minutes exceed scheduled minutes by more than this. Covers the routine
// vor-/nachviertelstunde without spamming the queue.
const BOOKED_OVER_SCHEDULE_TOLERANCE_MIN = 30;

function utcDateOnly(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ChildAssignment.weekday: Monday=0..Sunday=6.
function isoWeekday(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function enumerateDates(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(from.getTime());
  while (cur.getTime() <= to.getTime()) {
    out.push(new Date(cur.getTime()));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function isInHoliday(
  date: Date,
  ranges: { startDate: Date; endDate: Date }[],
): boolean {
  for (const r of ranges) {
    if (
      date.getTime() >= r.startDate.getTime() &&
      date.getTime() <= r.endDate.getTime()
    ) {
      return true;
    }
  }
  return false;
}

const sortByDateName = <T extends { date: string; childName: string }>(
  arr: T[],
): T[] =>
  arr.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.childName.localeCompare(b.childName),
  );

export const HandlungsbedarfFacade = {
  /**
   * Krankheits-Flags im [from, to]-Fenster (inklusive Endpunkt). Decken die
   * Top-Section auf /admin/handlungsbedarf ab.
   */
  async listKrankheitFlags({
    from,
    to,
  }: {
    from: Date;
    to: Date;
  }): Promise<ProblemFlag[]> {
    const f = utcDateOnly(from);
    const t = utcDateOnly(to);

    const [sickEvents, absences, vertretungen] = await Promise.all([
      findSickEventsInRange(f, t),
      findChildAbsencesInRange(f, t),
      findVertretungenInRange(f, t),
    ]);

    const sickUserIds = Array.from(new Set(sickEvents.map((e) => e.userId)));
    const [assignments, conflictingWork] = await Promise.all([
      findAssignmentsByUserIds(sickUserIds),
      findWorkEventsForChildrenOnDates(
        absences.map((a) => ({ childId: a.childId, date: a.date })),
      ),
    ]);

    const coverageKey = new Set(
      vertretungen.map((v) => `${v.childId}|${isoDate(v.date)}`),
    );

    const assignmentsByUser = new Map<string, typeof assignments>();
    for (const a of assignments) {
      const arr = assignmentsByUser.get(a.userId) ?? [];
      arr.push(a);
      assignmentsByUser.set(a.userId, arr);
    }

    const sbSickFlags: SbSickNoSubstituteFlag[] = [];
    for (const ev of sickEvents) {
      const weekday = isoWeekday(ev.date);
      const dayAssignments =
        assignmentsByUser
          .get(ev.userId)
          ?.filter((a) => a.weekday === weekday) ?? [];

      // Tandem produces two assignment rows for the same (user, weekday, child);
      // collapse to one flag per child.
      const seen = new Set<string>();
      for (const a of dayAssignments) {
        if (seen.has(a.child.id)) continue;
        seen.add(a.child.id);
        if (coverageKey.has(`${a.child.id}|${isoDate(ev.date)}`)) continue;
        sbSickFlags.push({
          kind: "SB_SICK_NO_SUBSTITUTE",
          date: isoDate(ev.date),
          sbUserId: ev.userId,
          sbName: ev.user.name,
          childId: a.child.id,
          childName: `${a.child.firstName} ${a.child.lastName}`,
        });
      }
    }

    const workByKey = new Map<string, typeof conflictingWork>();
    for (const w of conflictingWork) {
      const k = `${w.childId}|${isoDate(w.date)}`;
      const arr = workByKey.get(k) ?? [];
      arr.push(w);
      workByKey.set(k, arr);
    }

    const conflictFlags: ChildAbsentWorkBookedFlag[] = [];
    const infoFlags: ChildAbsentInfoFlag[] = [];
    for (const ab of absences) {
      const key = `${ab.childId}|${isoDate(ab.date)}`;
      const conflicts = workByKey.get(key) ?? [];
      const childName = `${ab.child.firstName} ${ab.child.lastName}`;
      if (conflicts.length > 0) {
        for (const w of conflicts) {
          conflictFlags.push({
            kind: "CHILD_ABSENT_BUT_WORK_BOOKED",
            date: isoDate(ab.date),
            childId: ab.childId,
            childName,
            workEventId: w.id,
            workUserId: w.userId,
            workUserName: w.user.name,
            workStart: w.startTime,
            workEnd: w.endTime,
            absenceNote: ab.note,
          });
        }
      } else {
        infoFlags.push({
          kind: "CHILD_ABSENT_INFO",
          date: isoDate(ab.date),
          childId: ab.childId,
          childName,
          absenceNote: ab.note,
        });
      }
    }

    // SUBSTITUTE_ALSO_SICK: ChildVertretung weist auf einen Vertreter, der am
    // gleichen Datum selbst SICK ist.
    const sickKey = new Set(
      sickEvents.map((e) => `${e.userId}|${isoDate(e.date)}`),
    );
    const substituteSickFlags: SubstituteAlsoSickFlag[] = [];
    const seenSubstitutePair = new Set<string>();
    for (const v of vertretungen) {
      const pairKey = `${v.childId}|${isoDate(v.date)}|${v.substituteUserId}`;
      if (seenSubstitutePair.has(pairKey)) continue;
      if (!sickKey.has(`${v.substituteUserId}|${isoDate(v.date)}`)) continue;
      seenSubstitutePair.add(pairKey);
      substituteSickFlags.push({
        kind: "SUBSTITUTE_ALSO_SICK",
        date: isoDate(v.date),
        childId: v.childId,
        childName: `${v.child.firstName} ${v.child.lastName}`,
        substituteUserId: v.substituteUserId,
        substituteName: v.substituteUser.name,
      });
    }

    return [
      ...sortByDateName(sbSickFlags),
      ...sortByDateName(substituteSickFlags),
      ...sortByDateName(conflictFlags),
      ...sortByDateName(infoFlags),
    ];
  },

  /**
   * Restliche problematische Fälle im Fenster (Stundenplan ohne SB, gebuchte
   * Stunden > Stundenplan) + statische Flags wie fehlende Schweigepflicht
   * (date-unabhängig, deshalb ohne Window-Bezug).
   */
  async listOtherFlags({
    from,
    to,
  }: {
    from: Date;
    to: Date;
  }): Promise<ProblemFlag[]> {
    const f = utcDateOnly(from);
    const t = utcDateOnly(to);

    const [schedules, assignments, vertretungen, workEvents, missingSchweige] =
      await Promise.all([
        findAllSchedulesWithHolidayPlan(),
        findAllAssignments(),
        findVertretungenInRange(f, t),
        findChildWorkEventsInRange(f, t),
        findChildrenMissingSchweigepflicht(),
      ]);

    const dates = enumerateDates(f, t);

    // assignedKey = `${childId}|${weekday}` for any (child, weekday) that has
    // at least one regular assignment.
    const assignedKey = new Set<string>();
    for (const a of assignments) {
      assignedKey.add(`${a.childId}|${a.weekday}`);
    }
    // covered (by Vertretung) for the day.
    const vertretungKey = new Set(
      vertretungen.map((v) => `${v.childId}|${isoDate(v.date)}`),
    );

    // Holiday ranges per child (collected from the school's HolidayPlan).
    const holidayRangesByChild = new Map<
      string,
      { startDate: Date; endDate: Date }[]
    >();
    for (const s of schedules) {
      if (holidayRangesByChild.has(s.childId)) continue;
      const ranges = s.child.school?.holidayPlan?.holidays ?? [];
      holidayRangesByChild.set(s.childId, ranges);
    }

    // SCHEDULE_BLOCK_UNASSIGNED
    const scheduleUnassignedFlags: ScheduleBlockUnassignedFlag[] = [];
    for (const s of schedules) {
      const childName = `${s.child.firstName} ${s.child.lastName}`;
      const ranges = holidayRangesByChild.get(s.childId) ?? [];
      for (const d of dates) {
        if (isoWeekday(d) !== s.weekday) continue;
        if (isInHoliday(d, ranges)) continue;
        if (assignedKey.has(`${s.childId}|${s.weekday}`)) continue;
        if (vertretungKey.has(`${s.childId}|${isoDate(d)}`)) continue;
        scheduleUnassignedFlags.push({
          kind: "SCHEDULE_BLOCK_UNASSIGNED",
          date: isoDate(d),
          childId: s.childId,
          childName,
          startTime: s.startTime,
          endTime: s.endTime,
        });
      }
    }

    // BOOKED_HOURS_OVER_SCHEDULE
    // Sum scheduled minutes per (childId, weekday).
    const scheduledMinutesByChildWeekday = new Map<string, number>();
    const childNameById = new Map<string, string>();
    for (const s of schedules) {
      const key = `${s.childId}|${s.weekday}`;
      const min =
        (scheduledMinutesByChildWeekday.get(key) ?? 0) +
        (timeToMin(s.endTime) - timeToMin(s.startTime));
      scheduledMinutesByChildWeekday.set(key, min);
      childNameById.set(s.childId, `${s.child.firstName} ${s.child.lastName}`);
    }

    // Sum booked WORK minutes per (childId, date). Events without explicit
    // times can't contribute to a duration comparison, so they're skipped.
    // Also backfill child names from WORK events: a child can have booked hours
    // without any Schedule row (scheduled = 0), and would otherwise fall back to
    // the raw childId when flagged below.
    const bookedMinutesByPair = new Map<string, number>();
    for (const w of workEvents) {
      if (!w.childId || !w.startTime || !w.endTime) continue;
      if (w.child && !childNameById.has(w.childId)) {
        childNameById.set(
          w.childId,
          `${w.child.firstName} ${w.child.lastName}`,
        );
      }
      const key = `${w.childId}|${isoDate(w.date)}`;
      const min =
        (bookedMinutesByPair.get(key) ?? 0) +
        (timeToMin(w.endTime) - timeToMin(w.startTime));
      bookedMinutesByPair.set(key, min);
    }

    const overScheduleFlags: BookedHoursOverScheduleFlag[] = [];
    for (const [key, booked] of bookedMinutesByPair) {
      const [childId, dateIso] = key.split("|");
      const weekday = isoWeekday(new Date(`${dateIso}T00:00:00Z`));
      const scheduled =
        scheduledMinutesByChildWeekday.get(`${childId}|${weekday}`) ?? 0;
      if (booked - scheduled <= BOOKED_OVER_SCHEDULE_TOLERANCE_MIN) continue;
      overScheduleFlags.push({
        kind: "BOOKED_HOURS_OVER_SCHEDULE",
        date: dateIso,
        childId,
        childName: childNameById.get(childId) ?? childId,
        bookedMinutes: booked,
        scheduledMinutes: scheduled,
      });
    }

    // MISSING_SCHWEIGEPFLICHT (static, no date)
    const missingSchweigeFlags: MissingSchweigepflichtFlag[] = missingSchweige
      .map((c) => ({
        kind: "MISSING_SCHWEIGEPFLICHT" as const,
        childId: c.id,
        childName: `${c.firstName} ${c.lastName}`,
      }))
      .sort((a, b) => a.childName.localeCompare(b.childName));

    return [
      ...sortByDateName(scheduleUnassignedFlags),
      ...sortByDateName(overScheduleFlags),
      ...missingSchweigeFlags,
    ];
  },
};
