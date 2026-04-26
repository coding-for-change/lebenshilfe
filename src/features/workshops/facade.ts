import { WorkshopSchema, type WorkshopInput } from "./schemas";
import {
  countAttendancesForWorkshop,
  deleteWorkshopById,
  findWorkshopById,
  insertWorkshop,
  listWorkshops,
  updateWorkshopFields,
} from "./services";

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
    return insertWorkshop(
      parsed.name,
      normaliseDescription(parsed.description),
    );
  },

  async update(id: string, input: WorkshopInput) {
    const parsed = WorkshopSchema.parse(input);
    const existing = await findWorkshopById(id);
    if (!existing) throw new Error("Workshop nicht gefunden.");
    return updateWorkshopFields(
      id,
      parsed.name,
      normaliseDescription(parsed.description),
    );
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
