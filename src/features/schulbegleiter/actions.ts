"use server";

import { revalidatePath } from "next/cache";
import { AuthFacade } from "@/features/auth/facade";
import { SchulbegleiterFacade } from "./facade";
import type {
  CreateSchulbegleiterInput,
  UpdateSchulbegleiterInput,
} from "./schemas";
import { createSchulbegleiterUseCase } from "@/use-cases/create-schulbegleiter";
import { resendSchulbegleiterInvitationUseCase } from "@/use-cases/resend-schulbegleiter-invitation";

const ROUTE = "/admin/schulbegleiter";

export async function createSchulbegleiterAction(
  input: CreateSchulbegleiterInput,
) {
  await createSchulbegleiterUseCase(input);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function updateSchulbegleiterAction(
  profileId: string,
  input: UpdateSchulbegleiterInput,
) {
  await AuthFacade.requireAdmin();
  await SchulbegleiterFacade.update(profileId, input);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function deleteSchulbegleiterAction(profileId: string) {
  await AuthFacade.requireAdmin();
  await SchulbegleiterFacade.delete(profileId);
  revalidatePath(ROUTE);
  return { success: true };
}

export async function resendSchulbegleiterInvitationAction(profileId: string) {
  await resendSchulbegleiterInvitationUseCase(profileId);
  revalidatePath(ROUTE);
  return { success: true };
}
