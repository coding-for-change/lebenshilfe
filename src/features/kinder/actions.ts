"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { KinderFacade } from "./facade";
import type {
  AbsenceInput,
  AssignmentInput,
  CreateKindInput,
  ScheduleInput,
  UpdateKindInput,
} from "./schemas";

const ROUTE = "/admin/kinder";

export async function createKindAction(input: CreateKindInput) {
  await requireAdmin();
  const created = await KinderFacade.create(input);
  revalidatePath(ROUTE);
  // Return only plain-serializable fields. The full Prisma row contains
  // Decimal (schoolLat / schoolLng) which Next.js refuses to send across
  // the server-action → client-component boundary.
  return {
    success: true as const,
    child: { id: created.id },
  };
}

export async function updateKindAction(id: string, input: UpdateKindInput) {
  await requireAdmin();
  await KinderFacade.update(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteKindAction(id: string) {
  await requireAdmin();
  await KinderFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function createAssignmentAction(input: AssignmentInput) {
  await requireAdmin();
  const created = await KinderFacade.createAssignment(input);
  revalidatePath(ROUTE);
  return { success: true as const, assignment: created };
}

export async function updateAssignmentAction(
  id: string,
  input: Partial<AssignmentInput>,
) {
  await requireAdmin();
  await KinderFacade.updateAssignment(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteAssignmentAction(id: string) {
  await requireAdmin();
  await KinderFacade.deleteAssignment(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function createScheduleAction(input: ScheduleInput) {
  await requireAdmin();
  const created = await KinderFacade.createSchedule(input);
  revalidatePath(ROUTE);
  return { success: true as const, schedule: created };
}

export async function updateScheduleAction(
  id: string,
  input: Partial<Omit<ScheduleInput, "childId">>,
) {
  await requireAdmin();
  await KinderFacade.updateSchedule(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteScheduleAction(id: string) {
  await requireAdmin();
  await KinderFacade.deleteSchedule(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function saveAbsenceAction(input: AbsenceInput) {
  await requireAdmin();
  await KinderFacade.saveAbsence(input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteAbsenceAction(id: string) {
  await requireAdmin();
  await KinderFacade.deleteAbsence(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function listWorkEventsForChildAction(childId: string) {
  await requireAdmin();
  const events = await KinderFacade.listWorkEventsForChild(childId);
  return events.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    startTime: e.startTime,
    endTime: e.endTime,
    note: e.note,
    userName: e.user.name,
  }));
}
