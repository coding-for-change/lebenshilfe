"use server";

import { InvitationFacade } from "./facade";

export async function consumeUsedToken(token: string) {
  const invite = await InvitationFacade.verifyToken(token);
  await InvitationFacade.consumeToken(invite.id);
  return true;
}
