import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { EventEditKind } from "@/generated/prisma";
import {
  CreateEventSchema,
  SubmitMonthlyReportSchema,
  UpdateEventSchema,
  type CreateEventInput,
  type SignedEventSnapshot,
  type SubmitMonthlyReportInput,
  type UpdateEventInput,
} from "./schemas";
import {
  assertChildrenAssignedToUser,
  deleteEventById,
  findEventById,
  findMonthlyReport,
  findMonthlyReportSnapshot,
  getAssignedChildren,
  getAssignmentsByWeekday,
  getEventsForUserInMonth,
  getEventsForUserInRange,
  getSchedulesForChildren,
  insertMonthlyReport,
  insertSickEvent,
  insertWorkEvents,
  listAllEventsWithChildForUser,
  listEditsForEvents,
  listMonthlyReportsForUser,
  listMonthlyReportsForUserMonths,
  listMonthlyReportSummariesForUser,
  listWorkEventsForChildWithUser,
  updateEventFields,
  uploadSignature,
} from "./services";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(dateStr: string): Date {
  // "YYYY-MM-DD" -> UTC date (matches @db.Date semantics without TZ shift)
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function assertMonthNotLocked(
  report: Awaited<ReturnType<typeof findMonthlyReport>>,
) {
  if (report) {
    throw new Error(
      "Der Monat wurde bereits an den Vorgesetzten übergeben und ist gesperrt.",
    );
  }
}

function checkIsMonthFinished(year: number, month: number) {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    throw new Error(
      "Der Monat ist noch nicht abgeschlossen und kann erst nach Monatsende übergeben werden.",
    );
  }
}

function dateToIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function buildSignedSnapshot(
  userId: string,
  year: number,
  month: number,
): Promise<SignedEventSnapshot[]> {
  const events = await getEventsForUserInMonth(userId, year, month);
  return events.map((e) => ({
    eventId: e.id,
    type: e.type,
    date: dateToIso(e.date),
    startTime: e.startTime,
    endTime: e.endTime,
    note: e.note,
    childId: e.childId,
    signatureKey: e.signatureKey,
  }));
}

export const TimesheetFacade = {
  async listAssignedChildren(userId: string) {
    return getAssignedChildren(userId);
  },

  async getAssignmentsByWeekday(userId: string) {
    return getAssignmentsByWeekday(userId);
  },

  async getSchedulesForChildren(childIds: string[]) {
    return getSchedulesForChildren(childIds);
  },

  async getEventsForWeek(userId: string, mondayUtc: Date) {
    const end = new Date(mondayUtc);
    end.setUTCDate(end.getUTCDate() + 7);
    return getEventsForUserInRange(userId, mondayUtc, end);
  },

  async getEventsInRange(userId: string, start: Date, endExclusive: Date) {
    return getEventsForUserInRange(userId, start, endExclusive);
  },

  async getEventsForMonth(userId: string, year: number, month: number) {
    return getEventsForUserInMonth(userId, year, month);
  },

  async isMonthLocked(userId: string, year: number, month: number) {
    return Boolean(await findMonthlyReport(userId, year, month));
  },

  async listLockedMonthKeys(userId: string): Promise<string[]> {
    const reports = await listMonthlyReportsForUser(userId);
    return reports.map((r) => `${r.year}-${r.month}`);
  },

  async getMonthlyReport(userId: string, year: number, month: number) {
    return findMonthlyReport(userId, year, month);
  },

  async createEvent(userId: string, input: CreateEventInput) {
    const parsed = CreateEventSchema.parse(input);
    const date = parseDateOnly(parsed.date);

    const report = await findMonthlyReport(
      userId,
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
    );
    assertMonthNotLocked(report);

    if (parsed.type === "WORK") {
      await assertChildrenAssignedToUser(userId, parsed.childIds, date);
      const batchId = randomUUID();
      const signatureKey = `signatures/events/${userId}/${batchId}.png`;
      await uploadSignature(signatureKey, parsed.signaturePngBase64);
      await insertWorkEvents({
        userId,
        childIds: parsed.childIds,
        date,
        startTime: parsed.startTime!,
        endTime: parsed.endTime!,
        note: parsed.note ?? null,
        signatureKey,
      });
      return { createdCount: parsed.childIds.length, signatureKey };
    }

    const eventId = randomUUID();
    const signatureKey = `signatures/events/${userId}/${eventId}.png`;
    await uploadSignature(signatureKey, parsed.signaturePngBase64);
    await insertSickEvent({
      userId,
      date,
      note: parsed.note ?? null,
      signatureKey,
    });
    return { createdCount: 1, signatureKey };
  },

  async updateEvent(userId: string, eventId: string, input: UpdateEventInput) {
    const parsed = UpdateEventSchema.parse(input);
    const event = await findEventById(eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Eintrag nicht gefunden.");
    }
    if (Date.now() - event.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new Error(
        "Einträge können nur innerhalb von 24 Stunden bearbeitet werden.",
      );
    }
    const report = await findMonthlyReport(
      userId,
      event.date.getUTCFullYear(),
      event.date.getUTCMonth() + 1,
    );
    assertMonthNotLocked(report);

    if (event.type === "SICK" && (parsed.startTime || parsed.endTime)) {
      throw new Error("Krankheitseinträge haben keine Zeiten.");
    }

    return updateEventFields(eventId, {
      startTime: parsed.startTime ?? event.startTime,
      endTime: parsed.endTime ?? event.endTime,
      note: parsed.note === undefined ? event.note : parsed.note,
    });
  },

  async deleteEvent(userId: string, eventId: string) {
    const event = await findEventById(eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Eintrag nicht gefunden.");
    }
    if (Date.now() - event.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new Error(
        "Einträge können nur innerhalb von 24 Stunden gelöscht werden.",
      );
    }
    const report = await findMonthlyReport(
      userId,
      event.date.getUTCFullYear(),
      event.date.getUTCMonth() + 1,
    );
    assertMonthNotLocked(report);
    return deleteEventById(eventId);
  },

  async submitMonthlyReport(userId: string, input: SubmitMonthlyReportInput) {
    const parsed = SubmitMonthlyReportSchema.parse(input);

    checkIsMonthFinished(parsed.year, parsed.month);

    const existing = await findMonthlyReport(userId, parsed.year, parsed.month);
    if (existing) {
      throw new Error("Monat bereits freigegeben.");
    }

    const snapshot = await buildSignedSnapshot(
      userId,
      parsed.year,
      parsed.month,
    );

    const key = `signatures/monthly/${userId}/${parsed.year}-${String(
      parsed.month,
    ).padStart(2, "0")}.png`;
    await uploadSignature(key, parsed.signaturePngBase64);
    return insertMonthlyReport({
      userId,
      year: parsed.year,
      month: parsed.month,
      supervisorName: parsed.supervisorName,
      supervisorSignatureKey: key,
      signedSnapshot: snapshot,
    });
  },

  // ---------------- Admin override ----------------
  // Bypass the 24-hour edit window AND the month lock. Every change is
  // captured in EventEdit so the audit trail is append-only. The frozen
  // signed snapshot on MonthlyReport is never touched here.

  async adminUpdateEvent(
    adminUserId: string,
    eventId: string,
    input: UpdateEventInput,
  ) {
    const parsed = UpdateEventSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error("Eintrag nicht gefunden.");
      if (event.type === "SICK" && (parsed.startTime || parsed.endTime)) {
        throw new Error("Krankheitseinträge haben keine Zeiten.");
      }

      const nextStartTime = parsed.startTime ?? event.startTime;
      const nextEndTime = parsed.endTime ?? event.endTime;
      const nextNote = parsed.note === undefined ? event.note : parsed.note;

      const timeChanged =
        nextStartTime !== event.startTime || nextEndTime !== event.endTime;
      const noteChanged = nextNote !== event.note;

      if (!timeChanged && !noteChanged) return event;

      const updated = await tx.event.update({
        where: { id: eventId },
        data: {
          startTime: nextStartTime,
          endTime: nextEndTime,
          note: nextNote,
        },
      });

      // Audit only when times actually changed. Note-only edits update the
      // record but don't generate an EventEdit entry.
      if (timeChanged) {
        await tx.eventEdit.create({
          data: {
            eventId,
            editedByUserId: adminUserId,
            kind: EventEditKind.EDIT,
            prevDate: event.date,
            prevStartTime: event.startTime,
            prevEndTime: event.endTime,
            prevNote: event.note,
            prevChildId: event.childId,
            nextDate: updated.date,
            nextStartTime: updated.startTime,
            nextEndTime: updated.endTime,
            nextNote: updated.note,
            nextChildId: updated.childId,
          },
        });
      }

      return updated;
    });
  },

  async adminDeleteEvent(adminUserId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error("Eintrag nicht gefunden.");
      await tx.eventEdit.create({
        data: {
          eventId,
          editedByUserId: adminUserId,
          kind: EventEditKind.DELETE,
          prevDate: event.date,
          prevStartTime: event.startTime,
          prevEndTime: event.endTime,
          prevNote: event.note,
          prevChildId: event.childId,
        },
      });
      await tx.event.delete({ where: { id: eventId } });
    });
  },

  async listEventsForUserWithEdits(userId: string) {
    const events = await listAllEventsWithChildForUser(userId);
    const edits = await listEditsForEvents(events.map((e) => e.id));
    const reports = await listMonthlyReportSummariesForUser(userId);
    return { events, edits, reports };
  },

  async listEventsForChildWithEdits(childId: string) {
    const events = await listWorkEventsForChildWithUser(childId);
    const edits = await listEditsForEvents(events.map((e) => e.id));

    // Distinct (userId, year, month) tuples — needed to look up which months
    // have already been signed off by a supervisor across the SBs that
    // worked with this Kind.
    const seen = new Set<string>();
    const tuples: { userId: string; year: number; month: number }[] = [];
    for (const e of events) {
      const year = e.date.getUTCFullYear();
      const month = e.date.getUTCMonth() + 1;
      const key = `${e.userId}-${year}-${month}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tuples.push({ userId: e.userId, year, month });
    }
    const reports = await listMonthlyReportsForUserMonths(tuples);

    return { events, edits, reports };
  },

  async getMonthlyReportSnapshot(userId: string, year: number, month: number) {
    return findMonthlyReportSnapshot(userId, year, month);
  },
};
