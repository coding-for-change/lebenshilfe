"use server";

import { revalidatePath } from "next/cache";
import { AuthFacade } from "@/features/auth/facade";
import { KostentraegerFacade } from "./facade";
import type { KostentraegerInput } from "./schemas";

const ROUTE = "/admin/kinder";

export async function createKostentraegerAction(input: KostentraegerInput) {
  await AuthFacade.requireAdmin();
  const created = await KostentraegerFacade.create(input);
  revalidatePath(ROUTE);
  return { success: true as const, kostentraeger: created };
}

export async function updateKostentraegerAction(
  id: string,
  input: KostentraegerInput,
) {
  await AuthFacade.requireAdmin();
  await KostentraegerFacade.update(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteKostentraegerAction(id: string) {
  await AuthFacade.requireAdmin();
  await KostentraegerFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}
