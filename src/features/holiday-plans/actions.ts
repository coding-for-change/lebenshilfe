"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { HolidayPlansFacade } from "./facade";
import type {
  CreateHolidayPlanInput,
  HolidayEntryInput,
  UpdateHolidayEntryInput,
  UpdateHolidayPlanInput,
} from "./schemas";

const PLANS_ROUTE = "/admin/holiday-plans";
const SCHOOLS_ROUTE = "/admin/schools";
const SB_ROUTE = "/"; // Schulbegleiter landing — holiday banner depends on this.

function revalidateAll() {
  revalidatePath(PLANS_ROUTE);
  revalidatePath(SCHOOLS_ROUTE);
  revalidatePath(SB_ROUTE);
}

export async function createHolidayPlanAction(input: CreateHolidayPlanInput) {
  await requireAdmin();
  const created = await HolidayPlansFacade.create(input);
  revalidateAll();
  return {
    success: true as const,
    plan: { id: created.id, name: created.name },
  };
}

export async function updateHolidayPlanAction(
  id: string,
  input: UpdateHolidayPlanInput,
) {
  await requireAdmin();
  await HolidayPlansFacade.update(id, input);
  revalidateAll();
  return { success: true as const };
}

export async function deleteHolidayPlanAction(id: string) {
  await requireAdmin();
  await HolidayPlansFacade.delete(id);
  revalidateAll();
  return { success: true as const };
}

export async function addHolidayEntryAction(input: HolidayEntryInput) {
  await requireAdmin();
  await HolidayPlansFacade.addEntry(input);
  revalidateAll();
  return { success: true as const };
}

export async function updateHolidayEntryAction(
  id: string,
  input: UpdateHolidayEntryInput,
) {
  await requireAdmin();
  await HolidayPlansFacade.updateEntry(id, input);
  revalidateAll();
  return { success: true as const };
}

export async function deleteHolidayEntryAction(id: string) {
  await requireAdmin();
  await HolidayPlansFacade.deleteEntry(id);
  revalidateAll();
  return { success: true as const };
}
