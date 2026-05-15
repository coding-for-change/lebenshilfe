"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { CostBearersFacade } from "./facade";
import type { CostBearerInput } from "./schemas";

const ROUTE = "/admin/children";

export async function createCostBearerAction(input: CostBearerInput) {
  await requireAdmin();
  const created = await CostBearersFacade.create(input);
  revalidatePath(ROUTE);
  return { success: true as const, costBearer: created };
}

export async function updateCostBearerAction(
  id: string,
  input: CostBearerInput,
) {
  await requireAdmin();
  await CostBearersFacade.update(id, input);
  revalidatePath(ROUTE);
  return { success: true as const };
}

export async function deleteCostBearerAction(id: string) {
  await requireAdmin();
  await CostBearersFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
}
