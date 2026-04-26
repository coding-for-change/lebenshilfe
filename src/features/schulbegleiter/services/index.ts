import { prisma } from "@/lib/prisma";
import { Prisma, SchulbegleiterStatus } from "@/generated/prisma";

export type ProfileWithAttendances = Prisma.SchoolAssistantProfileGetPayload<{
  include: { attendances: { include: { workshop: true } } };
}>;

export async function listProfiles(): Promise<ProfileWithAttendances[]> {
  return prisma.schoolAssistantProfile.findMany({
    include: { attendances: { include: { workshop: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function findProfileById(id: string) {
  return prisma.schoolAssistantProfile.findUnique({
    where: { id },
    include: { attendances: { include: { workshop: true } } },
  });
}

export async function findProfileByEmail(email: string) {
  return prisma.schoolAssistantProfile.findUnique({
    where: { email },
  });
}

type ProfileFields = {
  leosOne: boolean;
  outlook: boolean;
  weeklyHours: number | null;
  zvNeuNachBescheid: boolean;
  zvNeuNote: string | null;
  introductionDay: Date | null;
};

export async function createProfileWithAttendances(args: {
  email: string;
  name: string;
  fields: ProfileFields;
  attendances: Array<{ workshopId: string; attendedOn: Date }>;
}) {
  return prisma.schoolAssistantProfile.create({
    data: {
      email: args.email,
      name: args.name,
      ...args.fields,
      attendances: {
        create: args.attendances.map((a) => ({
          workshopId: a.workshopId,
          attendedOn: a.attendedOn,
        })),
      },
    },
  });
}

export async function updateProfileWithAttendances(args: {
  profileId: string;
  name: string;
  fields: ProfileFields;
  attendances: Array<{ workshopId: string; attendedOn: Date }>;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.workshopAttendance.deleteMany({
      where: { profileId: args.profileId },
    });
    return tx.schoolAssistantProfile.update({
      where: { id: args.profileId },
      data: {
        name: args.name,
        ...args.fields,
        attendances: {
          create: args.attendances.map((a) => ({
            workshopId: a.workshopId,
            attendedOn: a.attendedOn,
          })),
        },
      },
    });
  });
}

export async function deleteProfileById(profileId: string) {
  const profile = await prisma.schoolAssistantProfile.findUnique({
    where: { id: profileId },
    select: { userId: true },
  });
  if (!profile) return;
  await prisma.schoolAssistantProfile.delete({ where: { id: profileId } });
  if (profile.userId) {
    await prisma.user.delete({ where: { id: profile.userId } });
  }
}

export async function linkUserToProfileByEmail(userId: string, email: string) {
  return prisma.schoolAssistantProfile.update({
    where: { email },
    data: { userId, status: SchulbegleiterStatus.ACCEPTED },
  });
}
