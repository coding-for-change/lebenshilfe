"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { downloadObject } from "@/lib/storage";
import { ChildrenFacade } from "./facade";
import type {
  AbsenceInput,
  AssignmentInput,
  CreateChildInput,
  ScheduleInput,
  UpdateChildInput,
  UpdateVertretungInput,
  VertretungInput,
  WorkEventInput,
  UpdateWorkEventInput,
} from "./schemas";

const ROUTE = "/admin/children";

// Search children assigned to the current Schulbegleiter. Lives in the
// children feature because it queries child data; the timesheet entry form
// calls it to pick a child for indirect work.
export async function searchAssignedChildrenAction(query: string) {
  const { id: userId } = await requireAuth();
  return ChildrenFacade.searchAssignedChildren(userId, query);
}

export async function createChildAction(input: CreateChildInput) {
  await requireAdmin();
  const created = await ChildrenFacade.create(input);
  revalidatePath(ROUTE);
  // Return only plain-serializable fields. The full Prisma row contains
  // Decimal (schoolLat / schoolLng) which Next.js refuses to send across
  // the server-action → client-component boundary.
  return {
    success: true as const,
    child: { id: created.id },
  };
}

export async function updateChildAction(id: string, input: UpdateChildInput) {
  await requireAdmin();
  await ChildrenFacade.update(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteChildAction(id: string) {
  await requireAdmin();
  await ChildrenFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function createAssignmentAction(input: AssignmentInput) {
  await requireAdmin();
  const created = await ChildrenFacade.createAssignment(input);
  revalidatePath(ROUTE);
  return { success: true as const, assignment: created };
}

export async function updateAssignmentAction(
  id: string,
  input: Partial<AssignmentInput>,
) {
  await requireAdmin();
  await ChildrenFacade.updateAssignment(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteAssignmentAction(id: string) {
  await requireAdmin();
  await ChildrenFacade.deleteAssignment(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function createScheduleAction(input: ScheduleInput) {
  await requireAdmin();
  const created = await ChildrenFacade.createSchedule(input);
  revalidatePath(ROUTE);
  return { success: true as const, schedule: created };
}

export async function updateScheduleAction(
  id: string,
  input: Partial<Omit<ScheduleInput, "childId">>,
) {
  await requireAdmin();
  await ChildrenFacade.updateSchedule(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteScheduleAction(id: string) {
  await requireAdmin();
  await ChildrenFacade.deleteSchedule(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function saveAbsenceAction(input: AbsenceInput) {
  await requireAdmin();
  await ChildrenFacade.saveAbsence(input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteAbsenceAction(id: string) {
  await requireAdmin();
  await ChildrenFacade.deleteAbsence(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function listWorkEventsForChildAction(childId: string) {
  await requireAdmin();
  const events = await ChildrenFacade.listWorkEventsForChild(childId);

  // Fetch each signed event's signature once, in parallel; failed/missing
  // fetches just leave the row without an image rather than aborting the
  // whole load.
  const signaturesByEventId = new Map<string, string>();
  await Promise.all(
    events
      .filter((e) => e.signatureKey)
      .map(async (e) => {
        try {
          const bytes = await downloadObject(e.signatureKey!);
          signaturesByEventId.set(e.id, bytes.toString("base64"));
        } catch {
          // skip
        }
      }),
  );

  return events.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    startTime: e.startTime,
    endTime: e.endTime,
    note: e.note,
    type: e.type,
    userName: e.user.name,
    userId: e.userId,
    deleted: e.deleted,
    signed: !!e.signatureKey,
    signatureBase64: signaturesByEventId.get(e.id) ?? null,
  }));
}

export async function createWorkEventAsAdminAction(input: WorkEventInput) {
  await requireAdmin();
  await ChildrenFacade.createWorkEventAsAdmin(input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function updateWorkEventAsAdminAction(
  id: string,
  input: UpdateWorkEventInput,
) {
  await requireAdmin();
  await ChildrenFacade.updateWorkEventAsAdmin(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteWorkEventAsAdminAction(id: string) {
  await requireAdmin();
  await ChildrenFacade.deleteWorkEventAsAdmin(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function restoreWorkEventAsAdminAction(id: string) {
  await requireAdmin();
  await ChildrenFacade.restoreWorkEventAsAdmin(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function listWorkEventsForChildInRangeAction(
  childId: string,
  weekStart: string,
) {
  await requireAdmin();
  const from = new Date(`${weekStart}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000);
  const events = await ChildrenFacade.listWorkEventsForChildInRange(
    childId,
    from,
    to,
  );
  return events.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    startTime: e.startTime,
    endTime: e.endTime,
    userName: e.user.name,
  }));
}

export async function createVertretungAction(input: VertretungInput) {
  await requireAdmin();
  await ChildrenFacade.createVertretung(input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function updateVertretungAction(
  childId: string,
  date: string,
  input: UpdateVertretungInput,
) {
  await requireAdmin();
  await ChildrenFacade.updateVertretung(childId, date, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteVertretungAction(childId: string, date: string) {
  await requireAdmin();
  await ChildrenFacade.deleteVertretung(childId, date);
  revalidatePath(ROUTE);
  return { success: true as const };
}
