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
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.OWNER] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
      // Surface whether a two_factor row exists at all — a stale/partially
      // enrolled row can linger with twoFactorEnabled=false and block a fresh
      // setup (better-auth's enable() inherits its `verified` flag), so admins
      // need to be able to reset it even when 2FA reads as disabled.
      _count: { select: { twoFactors: true } },
    },
  });
  return users.map(({ _count, ...user }) => ({
    ...user,
    hasTwoFactorRow: _count.twoFactors > 0,
  }));
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

// Drops any leftover two_factor row for a user who has NOT completed 2FA setup
// (twoFactorEnabled=false). An interrupted enrollment leaves a stale row behind;
// better-auth's enable() then inherits that row's `verified` flag onto the fresh
// secret, so every code the user enters reads as invalid. Clearing it first lets
// a new setup start clean. Deliberately a no-op when 2FA is actually enabled, so
// it can never wipe a working enrollment.
export async function clearUnverifiedTwoFactor(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { twoFactorEnabled: true },
  });
  if (!user || user.twoFactorEnabled) return;
  await prisma.twoFactor.deleteMany({ where: { userId: id } });
}

// Lifts a temporary 2FA lockout (better-auth's accountLockout) without deleting
// the enrollment: resets the failed-attempt counter and clears lockedUntil, so
// the user can enter a valid code again immediately instead of waiting it out.
export async function unlockUserTwoFactor(id: string) {
  return prisma.twoFactor.updateMany({
    where: { userId: id },
    data: { failedVerificationCount: 0, lockedUntil: null },
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
