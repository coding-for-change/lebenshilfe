"use server";

import { revalidatePath } from "next/cache";
import { AuthFacade } from "@/features/auth/facade";
import { TimesheetFacade } from "./facade";
import type {
  CreateEventInput,
  SubmitMonthlyReportInput,
  UpdateEventInput,
} from "./schemas";

async function requireUserId(): Promise<string> {
  const session = await AuthFacade.getSession();
  if (!session) throw new Error("Nicht angemeldet.");
  return session.user.id;
}

export async function createEventAction(input: CreateEventInput) {
  const userId = await requireUserId();
  const result = await TimesheetFacade.createEvent(userId, input);
  revalidatePath("/");
  return result;
}

export async function updateEventAction(
  eventId: string,
  input: UpdateEventInput,
) {
  const userId = await requireUserId();
  await TimesheetFacade.updateEvent(userId, eventId, input);
  revalidatePath("/");
}

export async function deleteEventAction(eventId: string) {
  const userId = await requireUserId();
  await TimesheetFacade.deleteEvent(userId, eventId);
  revalidatePath("/");
}

export async function submitMonthlyReportAction(
  input: SubmitMonthlyReportInput,
) {
  const userId = await requireUserId();
  await TimesheetFacade.submitMonthlyReport(userId, input);
  revalidatePath("/");
}
