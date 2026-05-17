"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { SchoolAssistantsFacade } from "./facade";
import type {
  CreateSchoolAssistantInput,
  UpdateSchoolAssistantInput,
} from "./schemas";
import { createSchoolAssistantUseCase } from "@/use-cases/create-school-assistant";
import { resendSchoolAssistantInvitationUseCase } from "@/use-cases/resend-school-assistant-invitation";

const ROUTE = "/admin/school-assistants";

export async function createSchoolAssistantAction(
  input: CreateSchoolAssistantInput,
) {
  await createSchoolAssistantUseCase(input);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function updateSchoolAssistantAction(
  profileId: string,
  input: UpdateSchoolAssistantInput,
) {
  await requireAdmin();
  await SchoolAssistantsFacade.update(profileId, input);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function deleteSchoolAssistantAction(profileId: string) {
  await requireAdmin();
  await SchoolAssistantsFacade.delete(profileId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function resendSchoolAssistantInvitationAction(profileId: string) {
  await resendSchoolAssistantInvitationUseCase(profileId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function listWorkEventsForUserAction(userId: string) {
  await requireAdmin();
  const events = await SchoolAssistantsFacade.listWorkEventsForUser(userId);
  return events.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    startTime: e.startTime,
    endTime: e.endTime,
    note: e.note,
    childName: e.child
      ? `${e.child.firstName} ${e.child.lastName}`
      : "Unbekannt",
    childId: e.childId,
    deleted: e.deleted,
  }));
}
