"use server";

import { InvitationFacade } from "./facade";
import { fetchInviteDetailsUseCase } from "@/use-cases/fetch-invite-details";

export async function fetchInviteDetails(token: string) {
  return fetchInviteDetailsUseCase(token);
}

export async function consumeUsedToken(token: string) {
  const invite = await InvitationFacade.verifyToken(token);
  await InvitationFacade.consumeToken(invite.id);
  return true;
}
