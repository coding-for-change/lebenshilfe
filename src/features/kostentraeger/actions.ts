"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { KostentraegerFacade } from "./facade";
import type { KostentraegerInput } from "./schemas";

const ROUTE = "/admin/kinder";

export async function createKostentraegerAction(input: KostentraegerInput) {
  await requireAdmin();
  const created = await KostentraegerFacade.create(input);
  revalidatePath(ROUTE);
  return { success: true as const, kostentraeger: created };
}

export async function updateKostentraegerAction(
  id: string,
  input: KostentraegerInput,
) {
  await requireAdmin();
  await KostentraegerFacade.update(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteKostentraegerAction(id: string) {
  await requireAdmin();
  await KostentraegerFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}
