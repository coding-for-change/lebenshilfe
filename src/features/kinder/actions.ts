"use server";

import { revalidatePath } from "next/cache";
import { AuthFacade } from "@/features/auth/facade";
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
  await AuthFacade.requireAdmin();
  const created = await KinderFacade.create(input);
  revalidatePath(ROUTE);
  return { success: true as const, child: created };
}

export async function updateKindAction(id: string, input: UpdateKindInput) {
  await AuthFacade.requireAdmin();
  await KinderFacade.update(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteKindAction(id: string) {
  await AuthFacade.requireAdmin();
  await KinderFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function createAssignmentAction(input: AssignmentInput) {
  await AuthFacade.requireAdmin();
  const created = await KinderFacade.createAssignment(input);
  revalidatePath(ROUTE);
  return { success: true as const, assignment: created };
}

export async function updateAssignmentAction(
  id: string,
  input: Partial<AssignmentInput>,
) {
  await AuthFacade.requireAdmin();
  await KinderFacade.updateAssignment(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteAssignmentAction(id: string) {
  await AuthFacade.requireAdmin();
  await KinderFacade.deleteAssignment(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function createScheduleAction(input: ScheduleInput) {
  await AuthFacade.requireAdmin();
  const created = await KinderFacade.createSchedule(input);
  revalidatePath(ROUTE);
  return { success: true as const, schedule: created };
}

export async function updateScheduleAction(
  id: string,
  input: Partial<Omit<ScheduleInput, "childId">>,
) {
  await AuthFacade.requireAdmin();
  await KinderFacade.updateSchedule(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteScheduleAction(id: string) {
  await AuthFacade.requireAdmin();
  await KinderFacade.deleteSchedule(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function saveAbsenceAction(input: AbsenceInput) {
  await AuthFacade.requireAdmin();
  await KinderFacade.saveAbsence(input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteAbsenceAction(id: string) {
  await AuthFacade.requireAdmin();
  await KinderFacade.deleteAbsence(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function listWorkEventsForChildAction(childId: string) {
  await AuthFacade.requireAdmin();
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
