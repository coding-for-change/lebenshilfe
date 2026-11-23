"use server";

import { serverAction } from "@/lib/server-action";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guards";
import { TimesheetFacade } from "./facade";
import { createTimesheetEvent } from "@/use-cases/create-timesheet-event";
import { createIndirectEventByName } from "@/use-cases/create-indirect-event-by-name";
import type {
  ConfirmWorkEventsInput,
  CreateEventInput,
  CreateIndirectByNameInput,
  CreatePoolWorkEventInput,
  SubmitMonthlyReportInput,
  UpdateEventInput,
} from "./schemas";

export const createEventAction = serverAction(
  async (input: CreateEventInput) => {
    const { id: userId } = await requireAuth();
    const result = await createTimesheetEvent(userId, input);
    revalidatePath("/");
    return result;
  },
);

export const createPoolWorkEventAction = serverAction(
  async (input: CreatePoolWorkEventInput) => {
    const { id: userId } = await requireAuth();
    const result = await TimesheetFacade.createPoolWorkEvent(userId, input);
    revalidatePath("/");
    return result;
  },
);

export const createIndirectEventByNameAction = serverAction(
  async (input: CreateIndirectByNameInput) => {
    const { id: userId } = await requireAuth();
    const result = await createIndirectEventByName(userId, input);
    revalidatePath("/");
    return result;
  },
);

export const updateEventAction = serverAction(
  async (eventId: string, input: UpdateEventInput) => {
    const { id: userId } = await requireAuth();
    await TimesheetFacade.updateEvent(userId, eventId, input);
    revalidatePath("/");
  },
);

export const deleteEventAction = serverAction(async (eventId: string) => {
  const { id: userId } = await requireAuth();
  await TimesheetFacade.deleteEvent(userId, eventId);
  revalidatePath("/");
});

export const submitMonthlyReportAction = serverAction(
  async (input: SubmitMonthlyReportInput) => {
    const { id: userId } = await requireAuth();
    await TimesheetFacade.submitMonthlyReport(userId, input);
    revalidatePath("/");
  },
);

export const confirmWorkEventsAction = serverAction(
  async (input: ConfirmWorkEventsInput) => {
    const { id: userId } = await requireAuth();
    const result = await TimesheetFacade.confirmWorkEvents(userId, input);
    revalidatePath("/");
    return result;
  },
);
