import { SchulbegleiterStatus } from "@/generated/prisma";
import {
  CreateSchulbegleiterSchema,
  UpdateSchulbegleiterSchema,
  type CreateSchulbegleiterInput,
  type UpdateSchulbegleiterInput,
} from "./schemas";
import {
  createProfileWithAttendances,
  deleteProfileById,
  findProfileByEmail,
  findProfileById,
  linkUserToProfileByEmail,
  listProfiles,
  updateProfileWithAttendances,
} from "./services";

function toFields(
  input: CreateSchulbegleiterInput | UpdateSchulbegleiterInput,
) {
  return {
    leosOne: input.leosOne,
    outlook: input.outlook,
    weeklyHours: input.weeklyHours ?? null,
    zvNeuNachBescheid: input.zvNeuNachBescheid,
    zvNeuNote: input.zvNeuNachBescheid ? (input.zvNeuNote ?? null) : null,
    introductionDay: input.introductionDay
      ? new Date(`${input.introductionDay}T00:00:00.000Z`)
      : null,
  };
}

function toAttendances(
  input: CreateSchulbegleiterInput | UpdateSchulbegleiterInput,
) {
  return input.workshops.map((w) => ({
    workshopId: w.workshopId,
    attendedOn: new Date(`${w.attendedOn}T00:00:00.000Z`),
  }));
}

export const SchulbegleiterFacade = {
  async list() {
    return listProfiles();
  },

  async getById(id: string) {
    return findProfileById(id);
  },

  async getByEmail(email: string) {
    return findProfileByEmail(email);
  },

  async create(input: CreateSchulbegleiterInput) {
    const parsed = CreateSchulbegleiterSchema.parse(input);

    const existing = await findProfileByEmail(parsed.email);
    if (existing) {
      throw new Error(
        "Ein Schulbegleiter mit dieser E-Mail existiert bereits.",
      );
    }

    return createProfileWithAttendances({
      email: parsed.email,
      name: parsed.name,
      fields: toFields(parsed),
      attendances: toAttendances(parsed),
    });
  },

  async update(profileId: string, input: UpdateSchulbegleiterInput) {
    const parsed = UpdateSchulbegleiterSchema.parse(input);
    const existing = await findProfileById(profileId);
    if (!existing) {
      throw new Error("Schulbegleiter nicht gefunden.");
    }

    return updateProfileWithAttendances({
      profileId,
      name: parsed.name,
      fields: toFields(parsed),
      attendances: toAttendances(parsed),
    });
  },

  async delete(profileId: string) {
    await deleteProfileById(profileId);
  },

  async getEmailForResend(profileId: string) {
    const profile = await findProfileById(profileId);
    if (!profile) throw new Error("Schulbegleiter nicht gefunden.");
    if (profile.status === SchulbegleiterStatus.ACCEPTED) {
      throw new Error(
        "Einladung kann nicht erneut gesendet werden — bereits angenommen.",
      );
    }
    return profile.email;
  },

  async linkUserToProfile(userId: string, email: string) {
    return linkUserToProfileByEmail(userId, email);
  },
};
