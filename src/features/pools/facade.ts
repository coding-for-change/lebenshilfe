import {
  CreatePoolSchema,
  UpdatePoolSchema,
  type CreatePoolInput,
  type UpdatePoolInput,
} from "./schemas";
import {
  createPool,
  deletePoolById,
  findPoolById,
  listPools,
  setPoolAssistants,
  setPoolChildren,
  updatePool,
} from "./services";

export const PoolsFacade = {
  async list() {
    return listPools();
  },

  async getById(id: string) {
    return findPoolById(id);
  },

  async create(input: CreatePoolInput) {
    const parsed = CreatePoolSchema.parse(input);
    return createPool(parsed);
  },

  async update(id: string, input: UpdatePoolInput) {
    const parsed = UpdatePoolSchema.parse(input);
    const existing = await findPoolById(id);
    if (!existing) throw new Error("Pool nicht gefunden.");
    return updatePool(id, parsed);
  },

  async delete(id: string) {
    await deletePoolById(id);
  },

  async setChildren(poolId: string, childIds: string[]) {
    const existing = await findPoolById(poolId);
    if (!existing) throw new Error("Pool nicht gefunden.");
    await setPoolChildren(poolId, childIds);
  },

  async setAssistants(poolId: string, profileIds: string[]) {
    const existing = await findPoolById(poolId);
    if (!existing) throw new Error("Pool nicht gefunden.");
    await setPoolAssistants(poolId, profileIds);
  },
};
