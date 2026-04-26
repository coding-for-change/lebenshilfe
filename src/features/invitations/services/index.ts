import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/mail";

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

export async function markInvitationUsed(id: string) {
  return prisma.invitation.update({
    where: { id },
    data: { isUsed: true },
  });
}

export async function processNewInvitation(email: string, role: Role) {
  const token = randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await insertInvitation(email, token, role, expiresAt);

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/onboard?token=${token}`;

  await sendMail({
    to: email,
    subject: "Einladung: Willkommen bei Lebenshilfe",
    text: `Du wurdest eingeladen. Klicke hier, um dein Profil einzurichten: ${inviteUrl}`,
  });

  return invitation;
}

export async function getAllInvitations() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });
}
