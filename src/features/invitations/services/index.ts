import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma";
import { randomBytes } from "crypto";
import { createElement } from "react";
import { sendMail } from "@/lib/mail";
import { renderEmail } from "@/lib/email/render";
import { InvitationEmail } from "@/lib/email/templates/invitation-email";
import { branding } from "@/lib/branding";

export async function insertInvitation(
  email: string,
  token: string,
  role: Role,
  expiresAt: Date,
) {
  return prisma.invitation.create({
    data: { email, token, role, expiresAt, isUsed: false },
  });
}

export async function findInvitationByToken(token: string) {
  return prisma.invitation.findUnique({ where: { token } });
}

export async function findInvitationById(id: string) {
  return prisma.invitation.findUnique({ where: { id } });
}

export async function expireInvitationById(id: string) {
  return prisma.invitation.update({
    where: { id },
    data: { expiresAt: new Date(0) },
  });
}

const SUBJECTS: Record<Role, string> = {
  SCHOOL_ASSISTANT: `Einladung: Willkommen bei der ${branding.name}`,
  ADMIN: `Einladung als Admin – ${branding.name}`,
  OWNER: `Einladung als Hauptadmin – ${branding.name}`,
};

export async function processNewInvitation(
  email: string,
  role: Role,
  { replacesEarlier }: { replacesEarlier: boolean },
) {
  const token = randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await insertInvitation(email, token, role, expiresAt);

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/onboard?token=${token}`;

  const { html, text } = await renderEmail(
    createElement(InvitationEmail, { inviteUrl, role, replacesEarlier }),
  );

  await sendMail({
    to: email,
    subject: SUBJECTS[role],
    html,
    text,
  });

  return invitation;
}

export async function findOpenInvitationsByEmail(email: string) {
  return prisma.invitation.findMany({
    where: { email, isUsed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

// The most recent invitation for the same email created after `createdAt`, if
// any. Tells "this link was replaced by a resend" apart from "withdrawn": both
// set expiresAt to the epoch.
export async function findNewerInvitationForEmail(
  email: string,
  createdAt: Date,
) {
  return prisma.invitation.findFirst({
    where: { email, createdAt: { gt: createdAt } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllInvitations() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingInvitationsByRoles(roles: Role[]) {
  return prisma.invitation.findMany({
    where: {
      isUsed: false,
      role: { in: roles },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function expireUnusedInvitationsForEmail(email: string) {
  return prisma.invitation.updateMany({
    where: { email, isUsed: false },
    data: { expiresAt: new Date(0) },
  });
}
