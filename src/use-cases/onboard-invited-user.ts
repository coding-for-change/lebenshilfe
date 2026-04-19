"use server";

import { InvitationFacade } from "@/features/invitations/facade";

export async function fetchEmailFromToken(token: string) {
  const invite = await InvitationFacade.verifyToken(token);
  return invite.email;
}

export async function consumeUsedToken(token: string) {
  const invite = await InvitationFacade.verifyToken(token);
  await InvitationFacade.consumeToken(invite.id);
  return true;
}
