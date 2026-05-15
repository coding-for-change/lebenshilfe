import {
  CreateKostentraegerSchema,
  UpdateKostentraegerSchema,
  type CostBearerInput,
} from "./schemas";
import {
  createKostentraeger,
  deleteKostentraegerById,
  findKostentraegerById,
  listKostentraeger,
  updateKostentraeger,
} from "./services";

function normalize(input: CostBearerInput) {
  return {
    name: input.name,
    email: input.email ?? null,
    address: input.address ?? null,
  };
}

export const CostBearersFacade = {
  async list() {
    return listKostentraeger();
  },

  async getById(id: string) {
    return findKostentraegerById(id);
  },

  async create(input: CostBearerInput) {
    const parsed = CreateKostentraegerSchema.parse(input);
    return createKostentraeger(normalize(parsed));
  },

  async update(id: string, input: CostBearerInput) {
    const parsed = UpdateKostentraegerSchema.parse(input);
    const existing = await findKostentraegerById(id);
    if (!existing) throw new Error("Kostenträger nicht gefunden.");
    return updateKostentraeger(id, normalize(parsed));
  },

  async delete(id: string) {
    await deleteKostentraegerById(id);
  },
};
