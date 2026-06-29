import { SchulbegleiterStatus } from "@/generated/prisma";
import {
  CreateSchulbegleiterSchema,
  UpdateSchulbegleiterSchema,
  type CreateSchoolAssistantInput,
  type UpdateSchoolAssistantInput,
} from "./schemas";
import {
  createProfileWithAttendances,
  deleteProfileById,
  findProfileByEmail,
  findProfileById,
  linkUserToProfileByEmail,
  listProfiles,
  updateProfilePartial,
  listWorkEventsForUser,
} from "./services";
import { logBusinessEvent } from "@/lib/logger";

function toFields(input: CreateSchoolAssistantInput) {
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

function toAttendances(input: CreateSchoolAssistantInput) {
  return input.workshops.map((w) => ({
    workshopId: w.workshopId,
    attendedOn: new Date(`${w.attendedOn}T00:00:00.000Z`),
  }));
}

export const SchoolAssistantsFacade = {
  async list() {
    return listProfiles();
  },

  async getById(id: string) {
    return findProfileById(id);
  },

  async getByEmail(email: string) {
    return findProfileByEmail(email);
  },

  async create(input: CreateSchoolAssistantInput) {
    const parsed = CreateSchulbegleiterSchema.parse(input);

    const existing = await findProfileByEmail(parsed.email);
    if (existing) {
      throw new Error(
        "Ein Schulbegleiter mit dieser E-Mail existiert bereits.",
      );
    }

    logBusinessEvent("SCHOOL_ASSISTANT_CREATED", { email: parsed.email });

    return createProfileWithAttendances({
      email: parsed.email,
      name: parsed.name,
      fields: toFields(parsed),
      attendances: toAttendances(parsed),
    });
  },

  async update(profileId: string, input: UpdateSchoolAssistantInput) {
    const parsed = UpdateSchulbegleiterSchema.parse(input);
    const existing = await findProfileById(profileId);
    if (!existing) {
      throw new Error("Schulbegleiter nicht gefunden.");
    }

    const patch: Parameters<typeof updateProfilePartial>[0]["patch"] = {};
    if (parsed.name !== undefined) patch.name = parsed.name;
    if (parsed.leosOne !== undefined) patch.leosOne = parsed.leosOne;
    if (parsed.outlook !== undefined) patch.outlook = parsed.outlook;
    if (parsed.weeklyHours !== undefined) {
      patch.weeklyHours = parsed.weeklyHours ?? null;
    }
    if (parsed.zvNeuNachBescheid !== undefined) {
      patch.zvNeuNachBescheid = parsed.zvNeuNachBescheid;
      // Toggling off must clear the note so stale text doesn't linger.
      if (parsed.zvNeuNachBescheid === false) patch.zvNeuNote = null;
    }
    if (parsed.zvNeuNote !== undefined) {
      const isActive = parsed.zvNeuNachBescheid ?? existing.zvNeuNachBescheid;
      patch.zvNeuNote = isActive ? (parsed.zvNeuNote ?? null) : null;
    }
    if (parsed.introductionDay !== undefined) {
      patch.introductionDay = parsed.introductionDay
        ? new Date(`${parsed.introductionDay}T00:00:00.000Z`)
        : null;
    }

    const attendances =
      parsed.workshops !== undefined
        ? parsed.workshops.map((w) => ({
            workshopId: w.workshopId,
            attendedOn: new Date(`${w.attendedOn}T00:00:00.000Z`),
          }))
        : undefined;

    return updateProfilePartial({ profileId, patch, attendances });
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

  async listWorkEventsForUser(userId: string) {
    return listWorkEventsForUser(userId);
  },
};
