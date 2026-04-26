import { randomUUID } from "crypto";
import {
  CreateEventSchema,
  SubmitMonthlyReportSchema,
  UpdateEventSchema,
  type CreateEventInput,
  type SubmitMonthlyReportInput,
  type UpdateEventInput,
} from "./schemas";
import {
  assertChildrenAssignedToUser,
  deleteEventById,
  findEventById,
  findMonthlyReport,
  getAssignedChildren,
  getEventsForUserInMonth,
  getEventsForUserInRange,
  getSchedulesForChildren,
  insertMonthlyReport,
  insertSickEvent,
  insertWorkEvents,
  listMonthlyReportsForUser,
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

export const TimesheetFacade = {
  async listAssignedChildren(userId: string) {
    return getAssignedChildren(userId);
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
      await assertChildrenAssignedToUser(userId, parsed.childIds);
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

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;
    if (
      parsed.year > currentYear ||
      (parsed.year === currentYear && parsed.month >= currentMonth)
    ) {
      throw new Error(
        "Der Monat ist noch nicht abgeschlossen und kann erst nach Monatsende übergeben werden.",
      );
    }

    const existing = await findMonthlyReport(userId, parsed.year, parsed.month);
    if (existing) {
      throw new Error("Monat bereits freigegeben.");
    }
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
    });
  },
};
