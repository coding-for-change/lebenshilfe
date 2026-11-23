"use server";

import { serverAction } from "@/lib/server-action";

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

export const createVertretungRequestAction = serverAction(
  async (input: CreateVertretungRequestInput) => {
    const user = await requireAuth();
    await VertretungRequestsFacade.create(user.id, input);
    revalidateVertretungPaths();
  },
);

export const lookupVertretungPrefillAction = serverAction(
  async (input: VertretungPrefillLookupInput) => {
    await requireAuth();
    return VertretungRequestsFacade.lookupPrefill(input);
  },
);

export const resolveVertretungRequestAction = serverAction(
  async (id: string, input: ResolveVertretungRequestInput) => {
    const admin = await requireAdmin();
    await VertretungRequestsFacade.resolve(id, admin.id, input);
    revalidateVertretungPaths();
  },
);

export const rejectVertretungRequestAction = serverAction(
  async (id: string) => {
    const admin = await requireAdmin();
    await VertretungRequestsFacade.reject(id, admin.id);
    revalidateVertretungPaths();
  },
);

export const deleteOwnVertretungRequestAction = serverAction(
  async (id: string) => {
    const user = await requireAuth();
    await VertretungRequestsFacade.deleteOwn(id, user.id);
    revalidateVertretungPaths();
  },
);

export const deleteOwnVertretungAction = serverAction(async (id: string) => {
  const user = await requireAuth();
  await VertretungRequestsFacade.deleteOwnVertretung(id, user.id);
  revalidateVertretungPaths();
});

export const resolveIndirectRequestAction = serverAction(
  async (id: string, input: ResolveIndirectRequestInput) => {
    const admin = await requireAdmin();
    await VertretungRequestsFacade.resolveIndirect(id, admin.id, input);
    revalidateVertretungPaths();
  },
);

export const rejectIndirectRequestAction = serverAction(async (id: string) => {
  const admin = await requireAdmin();
  await VertretungRequestsFacade.reject(id, admin.id);
  revalidateVertretungPaths();
});
