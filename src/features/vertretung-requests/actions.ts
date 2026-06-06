"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth-guards";
import { VertretungRequestsFacade } from "./facade";
import type {
  CreateVertretungRequestInput,
  ResolveVertretungRequestInput,
} from "./schemas";

export async function createVertretungRequestAction(
  input: CreateVertretungRequestInput,
) {
  const user = await requireAuth();
  await VertretungRequestsFacade.create(user.id, input);
  revalidatePath("/");
}

export async function resolveVertretungRequestAction(
  id: string,
  input: ResolveVertretungRequestInput,
) {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.resolve(id, admin.id, input);
  revalidatePath("/admin/handlungsbedarf");
  revalidatePath("/admin/children");
}

export async function rejectVertretungRequestAction(id: string) {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.reject(id, admin.id);
  revalidatePath("/admin/handlungsbedarf");
}

export async function deleteOwnVertretungRequestAction(id: string) {
  const user = await requireAuth();
  await VertretungRequestsFacade.deleteOwn(id, user.id);
  revalidatePath("/");
}
