"use server";

import { revalidatePath } from "next/cache";
import { AuthFacade } from "@/features/auth/facade";
import { WorkshopsFacade } from "./facade";
import type { WorkshopInput } from "./schemas";

const ROUTE = "/admin/workshops";

export async function createWorkshopAction(input: WorkshopInput) {
  await AuthFacade.requireAdmin();
  await WorkshopsFacade.create(input);
  revalidatePath(ROUTE);
  revalidatePath("/admin/schulbegleiter");
  return { success: true };
}

export async function updateWorkshopAction(id: string, input: WorkshopInput) {
  await AuthFacade.requireAdmin();
  await WorkshopsFacade.update(id, input);
  revalidatePath(ROUTE);
  revalidatePath("/admin/schulbegleiter");
  return { success: true };
}

export async function deleteWorkshopAction(id: string) {
  await AuthFacade.requireAdmin();
  await WorkshopsFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true };
}
