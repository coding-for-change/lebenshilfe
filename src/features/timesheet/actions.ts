"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { TimesheetFacade } from "./facade";
import type {
  CreateEventInput,
  SignedEventSnapshot,
  SubmitMonthlyReportInput,
  UpdateEventInput,
} from "./schemas";

export async function createEventAction(input: CreateEventInput) {
  const { id: userId } = await requireAuth();
  const result = await TimesheetFacade.createEvent(userId, input);
  revalidatePath("/");
  return result;
}

export async function updateEventAction(
  eventId: string,
  input: UpdateEventInput,
) {
  const { id: userId } = await requireAuth();
  await TimesheetFacade.updateEvent(userId, eventId, input);
  revalidatePath("/");
}

export async function deleteEventAction(eventId: string) {
  const { id: userId } = await requireAuth();
  await TimesheetFacade.deleteEvent(userId, eventId);
  revalidatePath("/");
}

export async function submitMonthlyReportAction(
  input: SubmitMonthlyReportInput,
) {
  const { id: userId } = await requireAuth();
  await TimesheetFacade.submitMonthlyReport(userId, input);
  revalidatePath("/");
}

// ---------------- Admin override ----------------

function dateToIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type SerializedAdminEditEntry = {
  id: string;
  editedAt: string;
  editedByName: string;
  kind: "EDIT" | "DELETE";
  prevStartTime: string | null;
  prevEndTime: string | null;
  prevNote: string | null;
  nextStartTime: string | null;
  nextEndTime: string | null;
  nextNote: string | null;
};

export type SerializedAdminEvent = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  type: "WORK" | "SICK";
  childId: string | null;
  childName: string | null;
  userId: string;
  userName: string | null;
};

export type SerializedSignedMonth = {
  userId: string;
  year: number;
  month: number;
  supervisorName: string;
  signedAt: string;
};

export type SerializedAdminHistory = {
  events: SerializedAdminEvent[];
  editsByEventId: Record<string, SerializedAdminEditEntry[]>;
  signedMonths: SerializedSignedMonth[];
};

export async function listEventsForSchoolAssistantAction(
  userId: string,
): Promise<SerializedAdminHistory> {
  await requireAdmin();
  const { events, edits, reports } =
    await TimesheetFacade.listEventsForUserWithEdits(userId);

  const editsByEventId: Record<string, SerializedAdminEditEntry[]> = {};
  for (const e of edits) {
    if (!e.eventId) continue;
    const list = editsByEventId[e.eventId] ?? [];
    list.push({
      id: e.id,
      editedAt: e.editedAt.toISOString(),
      editedByName: e.editedBy.name,
      kind: e.kind,
      prevStartTime: e.prevStartTime,
      prevEndTime: e.prevEndTime,
      prevNote: e.prevNote,
      nextStartTime: e.nextStartTime,
      nextEndTime: e.nextEndTime,
      nextNote: e.nextNote,
    });
    editsByEventId[e.eventId] = list;
  }

  return {
    events: events.map((e) => ({
      id: e.id,
      date: dateToIso(e.date),
      startTime: e.startTime,
      endTime: e.endTime,
      note: e.note,
      type: e.type,
      childId: e.childId,
      childName: e.child
        ? `${e.child.firstName} ${e.child.lastName}`.trim()
        : null,
      userId,
      userName: null,
    })),
    editsByEventId,
    signedMonths: reports.map((r) => ({
      userId,
      year: r.year,
      month: r.month,
      supervisorName: r.supervisorName,
      signedAt: r.createdAt.toISOString(),
    })),
  };
}

export async function listEventsForChildAction(
  childId: string,
): Promise<SerializedAdminHistory> {
  await requireAdmin();
  const { events, edits, reports } =
    await TimesheetFacade.listEventsForChildWithEdits(childId);

  const editsByEventId: Record<string, SerializedAdminEditEntry[]> = {};
  for (const e of edits) {
    if (!e.eventId) continue;
    const list = editsByEventId[e.eventId] ?? [];
    list.push({
      id: e.id,
      editedAt: e.editedAt.toISOString(),
      editedByName: e.editedBy.name,
      kind: e.kind,
      prevStartTime: e.prevStartTime,
      prevEndTime: e.prevEndTime,
      prevNote: e.prevNote,
      nextStartTime: e.nextStartTime,
      nextEndTime: e.nextEndTime,
      nextNote: e.nextNote,
    });
    editsByEventId[e.eventId] = list;
  }

  return {
    events: events.map((e) => ({
      id: e.id,
      date: dateToIso(e.date),
      startTime: e.startTime,
      endTime: e.endTime,
      note: e.note,
      type: e.type,
      childId: e.childId,
      childName: null,
      userId: e.userId,
      userName: e.user?.name ?? null,
    })),
    editsByEventId,
    signedMonths: reports.map((r) => ({
      userId: r.userId,
      year: r.year,
      month: r.month,
      supervisorName: r.supervisorName,
      signedAt: r.createdAt.toISOString(),
    })),
  };
}

export async function adminUpdateEventAction(
  eventId: string,
  input: UpdateEventInput,
) {
  const { id: adminUserId } = await requireAdmin();
  await TimesheetFacade.adminUpdateEvent(adminUserId, eventId, input);
  revalidatePath("/admin/school-assistants");
  revalidatePath("/admin/children");
}

export async function adminDeleteEventAction(eventId: string) {
  const { id: adminUserId } = await requireAdmin();
  await TimesheetFacade.adminDeleteEvent(adminUserId, eventId);
  revalidatePath("/admin/school-assistants");
  revalidatePath("/admin/children");
}

export async function getMonthlyReportSnapshotAction(
  userId: string,
  year: number,
  month: number,
): Promise<{
  supervisorName: string;
  signedAt: string;
  snapshot: SignedEventSnapshot[];
} | null> {
  await requireAdmin();
  const report = await TimesheetFacade.getMonthlyReportSnapshot(
    userId,
    year,
    month,
  );
  if (!report) return null;
  return {
    supervisorName: report.supervisorName,
    signedAt: report.createdAt.toISOString(),
    snapshot: (report.signedSnapshot ?? []) as SignedEventSnapshot[],
  };
}
