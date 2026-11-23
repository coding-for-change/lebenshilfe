"use server";

import { serverAction } from "@/lib/server-action";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { SchoolsFacade } from "./facade";
import type {
  AssignHolidayPlanInput,
  SchoolInput,
  UpdateSchoolInput,
} from "./schemas";

const SCHOOLS_ROUTE = "/admin/schools";
const CHILDREN_ROUTE = "/admin/children";
const SB_ROUTE = "/"; // Schulbegleiter landing — holiday banner depends on this.

export const createSchoolAction = serverAction(async (input: SchoolInput) => {
  await requireAdmin();
  const created = await SchoolsFacade.create(input);
  revalidatePath(SCHOOLS_ROUTE);
  revalidatePath(CHILDREN_ROUTE);
  revalidatePath(SB_ROUTE);
  // `created` carries Decimal lat/lng which can't cross the action boundary.
  return {
    success: true as const,
    school: { id: created.id, name: created.name },
  };
});

export const updateSchoolAction = serverAction(
  async (id: string, input: UpdateSchoolInput) => {
    await requireAdmin();
    await SchoolsFacade.update(id, input);
    revalidatePath(SCHOOLS_ROUTE);
    revalidatePath(CHILDREN_ROUTE);
    revalidatePath(SB_ROUTE);
    return { success: true as const };
  },
);

export const deleteSchoolAction = serverAction(async (id: string) => {
  await requireAdmin();
  await SchoolsFacade.delete(id);
  revalidatePath(SCHOOLS_ROUTE);
  revalidatePath(CHILDREN_ROUTE);
  return { success: true as const };
});

export const assignHolidayPlanAction = serverAction(
  async (input: AssignHolidayPlanInput) => {
    await requireAdmin();
    await SchoolsFacade.assignHolidayPlan(input);
    revalidatePath(SCHOOLS_ROUTE);
    revalidatePath(SB_ROUTE);
    return { success: true as const };
  },
);
