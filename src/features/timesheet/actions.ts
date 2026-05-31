"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guards";
import { TimesheetFacade } from "./facade";
import { createTimesheetEvent } from "@/use-cases/create-timesheet-event";
import type {
  ConfirmWorkEventsInput,
  CreateEventInput,
  SubmitMonthlyReportInput,
  UpdateEventInput,
} from "./schemas";

export async function createEventAction(input: CreateEventInput) {
  const { id: userId } = await requireAuth();
  const result = await createTimesheetEvent(userId, input);
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

export async function searchChildrenForSubstituteAction(query: string) {
  const { id: userId } = await requireAuth();
  return TimesheetFacade.searchChildren(userId, query);
}

export async function confirmWorkEventsAction(input: ConfirmWorkEventsInput) {
  const { id: userId } = await requireAuth();
  const result = await TimesheetFacade.confirmWorkEvents(userId, input);
  revalidatePath("/");
  return result;
}
