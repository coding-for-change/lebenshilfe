"use server";

import { serverAction } from "@/lib/server-action";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { PoolsFacade } from "./facade";
import {
  SetPoolAssistantsSchema,
  SetPoolChildrenSchema,
  type CreatePoolInput,
  type UpdatePoolInput,
} from "./schemas";

const ROUTE = "/admin/pools";

export const createPoolAction = serverAction(async (input: CreatePoolInput) => {
  await requireAdmin();
  const created = await PoolsFacade.create(input);
  revalidatePath(ROUTE);
  return { success: true as const, pool: created };
});

export const updatePoolAction = serverAction(
  async (id: string, input: UpdatePoolInput) => {
    await requireAdmin();
    await PoolsFacade.update(id, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deletePoolAction = serverAction(async (id: string) => {
  await requireAdmin();
  await PoolsFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const setPoolChildrenAction = serverAction(
  async (input: { poolId: string; childIds: string[] }) => {
    await requireAdmin();
    const parsed = SetPoolChildrenSchema.parse(input);
    await PoolsFacade.setChildren(parsed.poolId, parsed.childIds);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const setPoolAssistantsAction = serverAction(
  async (input: { poolId: string; profileIds: string[] }) => {
    await requireAdmin();
    const parsed = SetPoolAssistantsSchema.parse(input);
    await PoolsFacade.setAssistants(parsed.poolId, parsed.profileIds);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);
