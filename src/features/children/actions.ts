"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { ChildrenFacade } from "./facade";
import type {
  AbsenceInput,
  AssignmentInput,
  CreateChildInput,
  ScheduleInput,
  UpdateChildInput,
  UpdateVertretungInput,
  VertretungInput,
} from "./schemas";

const ROUTE = "/admin/children";

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
  return events.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    startTime: e.startTime,
    endTime: e.endTime,
    note: e.note,
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
