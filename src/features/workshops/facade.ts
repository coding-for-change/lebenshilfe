import {
  WorkshopSchema,
  UpdateWorkshopSchema,
  type UpdateWorkshopInput,
  type WorkshopInput,
} from "./schemas";
import {
  countAttendancesForWorkshop,
  deleteWorkshopById,
  findWorkshopById,
  insertWorkshop,
  listWorkshops,
  updateWorkshopPartial,
} from "./services";
import { logBusinessEvent } from "@/lib/logger";

function normaliseDescription(description: string | null | undefined) {
  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

export const WorkshopsFacade = {
  async list() {
    return listWorkshops();
  },

  async getById(id: string) {
    return findWorkshopById(id);
  },

  async create(input: WorkshopInput) {
    const parsed = WorkshopSchema.parse(input);
    logBusinessEvent("WORKSHOP_CREATED", { name: parsed.name });
    return insertWorkshop(
      parsed.name,
      normaliseDescription(parsed.description),
    );
  },

  async update(id: string, input: UpdateWorkshopInput) {
    const parsed = UpdateWorkshopSchema.parse(input);
    const existing = await findWorkshopById(id);
    if (!existing) throw new Error("Workshop nicht gefunden.");

    const patch: { name?: string; description?: string | null } = {};
    if (parsed.name !== undefined) patch.name = parsed.name;
    if (parsed.description !== undefined) {
      patch.description = normaliseDescription(parsed.description);
    }
    if (Object.keys(patch).length === 0) return existing;
    return updateWorkshopPartial(id, patch);
  },

  async delete(id: string) {
    const attendanceCount = await countAttendancesForWorkshop(id);
    if (attendanceCount > 0) {
      throw new Error(
        "Workshop kann nicht gelöscht werden, da Teilnahmen existieren.",
      );
    }
    return deleteWorkshopById(id);
  },
};
