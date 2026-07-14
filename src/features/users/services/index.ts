import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { randomUUID } from "crypto";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(email: string, name: string, role: Role) {
  return prisma.user.create({
    data: {
      id: randomUUID(), // Standard string ID matching Auth setups
      email,
      name,
      role,
    },
  });
}

export async function getAllSchoolAssistants() {
  return prisma.user.findMany({ where: { role: Role.SCHOOL_ASSISTANT } });
}

export async function listAdminUsers() {
  return prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.OWNER] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
    },
  });
}

export async function countOwners() {
  return prisma.user.count({ where: { role: Role.OWNER } });
}

export async function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function deleteUserById(id: string) {
  return prisma.user.delete({ where: { id } });
}

// Clears a user's 2FA enrollment so they must set up a fresh authenticator on
// next sign-in (admin recovery for a user who lost their device and codes).
export async function resetUserTwoFactor(id: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("Benutzer nicht gefunden.");
    }
    await tx.twoFactor.deleteMany({ where: { userId: id } });
    await tx.user.update({ where: { id }, data: { twoFactorEnabled: false } });
    return user;
  });
}

// Atomically delete a user, refusing to remove the final OWNER.
export async function deleteUserWithLastOwnerGuard(id: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("Benutzer nicht gefunden.");
    }
    if (user.role === Role.OWNER) {
      const owners = await tx.user.count({ where: { role: Role.OWNER } });
      if (owners <= 1) {
        throw new Error("Der letzte Owner kann nicht entfernt werden.");
      }
    }
    await tx.user.delete({ where: { id } });
    return user;
  });
}
