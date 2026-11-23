"use server";

import { serverAction } from "@/lib/server-action";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { WorkshopsFacade } from "./facade";
import type { UpdateWorkshopInput, WorkshopInput } from "./schemas";

const ROUTE = "/admin/workshops";

export const createWorkshopAction = serverAction(
  async (input: WorkshopInput) => {
    await requireAdmin();
    await WorkshopsFacade.create(input);
    revalidatePath(ROUTE);
    revalidatePath("/admin/school-assistants");
    return { success: true };
  },
);

export const updateWorkshopAction = serverAction(
  async (id: string, input: UpdateWorkshopInput) => {
    await requireAdmin();
    await WorkshopsFacade.update(id, input);
    revalidatePath(ROUTE);
    revalidatePath("/admin/school-assistants");
    return { success: true };
  },
);

export const deleteWorkshopAction = serverAction(async (id: string) => {
  await requireAdmin();
  await WorkshopsFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true };
});
