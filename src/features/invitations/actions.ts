"use server";

import { InvitationFacade } from "./facade";
import { SchulbegleiterFacade } from "@/features/schulbegleiter/facade";

export async function fetchInviteDetails(token: string) {
  const invite = await InvitationFacade.verifyToken(token);
  const profile = await SchulbegleiterFacade.getByEmail(invite.email);
  if (!profile) {
    throw new Error("Kein Schulbegleiter-Profil für diese Einladung gefunden.");
  }
  return { email: invite.email, name: profile.name };
}

export async function consumeUsedToken(token: string) {
  const invite = await InvitationFacade.verifyToken(token);
  await InvitationFacade.consumeToken(invite.id);
  return true;
}
