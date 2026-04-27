import {
  CreateKostentraegerSchema,
  UpdateKostentraegerSchema,
  type KostentraegerInput,
} from "./schemas";
import {
  createKostentraeger,
  deleteKostentraegerById,
  findKostentraegerById,
  listKostentraeger,
  updateKostentraeger,
} from "./services";

function normalize(input: KostentraegerInput) {
  return {
    name: input.name,
    email: input.email ?? null,
    address: input.address ?? null,
  };
}

export const KostentraegerFacade = {
  async list() {
    return listKostentraeger();
  },

  async getById(id: string) {
    return findKostentraegerById(id);
  },

  async create(input: KostentraegerInput) {
    const parsed = CreateKostentraegerSchema.parse(input);
    return createKostentraeger(normalize(parsed));
  },

  async update(id: string, input: KostentraegerInput) {
    const parsed = UpdateKostentraegerSchema.parse(input);
    const existing = await findKostentraegerById(id);
    if (!existing) throw new Error("Kostenträger nicht gefunden.");
    return updateKostentraeger(id, normalize(parsed));
  },

  async delete(id: string) {
    await deleteKostentraegerById(id);
  },
};
