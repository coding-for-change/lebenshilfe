import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { randomUUID } from "crypto";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
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

export async function deleteUserById(id: string) {
  return prisma.user.delete({ where: { id } });
}
