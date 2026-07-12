"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth-guards";
import { VertretungRequestsFacade } from "./facade";
import type {
  CreateVertretungRequestInput,
  ResolveIndirectRequestInput,
  ResolveVertretungRequestInput,
  VertretungPrefillLookupInput,
} from "./schemas";

const VERTRETUNG_REVALIDATE_PATHS = [
  "/",
  "/admin/handlungsbedarf",
  "/admin/children",
];

function revalidateVertretungPaths() {
  for (const p of VERTRETUNG_REVALIDATE_PATHS) revalidatePath(p);
}

export async function createVertretungRequestAction(
  input: CreateVertretungRequestInput,
) {
  const user = await requireAuth();
  await VertretungRequestsFacade.create(user.id, input);
  revalidateVertretungPaths();
}

export async function lookupVertretungPrefillAction(
  input: VertretungPrefillLookupInput,
) {
  await requireAuth();
  return VertretungRequestsFacade.lookupPrefill(input);
}

export async function resolveVertretungRequestAction(
  id: string,
  input: ResolveVertretungRequestInput,
) {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.resolve(id, admin.id, input);
  revalidateVertretungPaths();
}

export async function rejectVertretungRequestAction(id: string) {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.reject(id, admin.id);
  revalidateVertretungPaths();
}

export async function deleteOwnVertretungRequestAction(id: string) {
  const user = await requireAuth();
  await VertretungRequestsFacade.deleteOwn(id, user.id);
  revalidateVertretungPaths();
}

export async function deleteOwnVertretungAction(id: string) {
  const user = await requireAuth();
  await VertretungRequestsFacade.deleteOwnVertretung(id, user.id);
  revalidateVertretungPaths();
}

export async function resolveIndirectRequestAction(
  id: string,
  input: ResolveIndirectRequestInput,
) {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.resolveIndirect(id, admin.id, input);
  revalidateVertretungPaths();
}

export async function rejectIndirectRequestAction(id: string) {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.reject(id, admin.id);
  revalidateVertretungPaths();
}
