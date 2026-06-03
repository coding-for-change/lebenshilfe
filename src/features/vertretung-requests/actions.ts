"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { VertretungRequestsFacade } from "./facade";
import { submitVertretungRequest } from "@/use-cases/submit-vertretung-request";
import { resolveVertretungRequest } from "@/use-cases/resolve-vertretung-request";
import type {
  RejectVertretungRequestInput,
  ResolveVertretungRequestInput,
  SubmitVertretungRequestInput,
} from "./schemas";

/** Schulbegleiter reports a Vertretung for a child they are not assigned to. */
export async function submitVertretungRequestAction(
  input: SubmitVertretungRequestInput,
) {
  const { id: userId } = await requireAuth();
  await submitVertretungRequest(userId, input);
  revalidatePath("/");
}

/** Admin lists all pending reports awaiting child assignment. */
export async function listPendingVertretungRequestsAction() {
  await requireAdmin();
  return VertretungRequestsFacade.listPending();
}

/** Admin confirms a report by assigning the correct child. */
export async function confirmVertretungRequestAction(
  input: ResolveVertretungRequestInput,
) {
  const { id: adminId } = await requireAdmin();
  await resolveVertretungRequest(adminId, input);
  revalidatePath("/admin/children");
  revalidatePath("/");
}

/** Admin rejects a report (single-feature → facade directly per AGENTS.md). */
export async function rejectVertretungRequestAction(
  input: RejectVertretungRequestInput,
) {
  const { id: adminId } = await requireAdmin();
  await VertretungRequestsFacade.markRejected(input.requestId, {
    resolvedByUserId: adminId,
    reason: input.reason?.trim() || null,
  });
  revalidatePath("/admin/children");
}
