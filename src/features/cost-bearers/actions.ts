"use server";

import { serverAction } from "@/lib/server-action";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { CostBearersFacade } from "./facade";
import type { CostBearerInput } from "./schemas";

const ROUTE = "/admin/children";

export const createCostBearerAction = serverAction(
  async (input: CostBearerInput) => {
    await requireAdmin();
    const created = await CostBearersFacade.create(input);
    revalidatePath(ROUTE);
    return { success: true as const, costBearer: created };
  },
);

export const updateCostBearerAction = serverAction(
  async (id: string, input: CostBearerInput) => {
    await requireAdmin();
    await CostBearersFacade.update(id, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deleteCostBearerAction = serverAction(async (id: string) => {
  await requireAdmin();
  await CostBearersFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});
