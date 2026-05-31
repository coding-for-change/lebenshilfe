import { parseIsoDate } from "@/lib/dates";
import { formatIsoDateUtc } from "@/lib/utils";
import {
  CreateHolidayPlanSchema,
  HolidayEntrySchema,
  UpdateHolidayEntrySchema,
  UpdateHolidayPlanSchema,
  type CreateHolidayPlanInput,
  type HolidayEntryInput,
  type UpdateHolidayEntryInput,
  type UpdateHolidayPlanInput,
} from "./schemas";
import {
  createEntry,
  createHolidayPlan,
  deleteEntryById,
  deleteHolidayPlanById,
  findHolidayPlanById,
  listEntriesForPlanIds,
  listHolidayPlans,
  updateEntryById,
  updateHolidayPlan,
} from "./services";
import type { PlanHolidayRange } from "./serialize";

export const HolidayPlansFacade = {
  async list() {
    return listHolidayPlans();
  },

  async getById(id: string) {
    return findHolidayPlanById(id);
  },

  async create(input: CreateHolidayPlanInput) {
    const parsed = CreateHolidayPlanSchema.parse(input);
    const entries = (parsed.entries ?? []).map((e) => ({
      name: e.name ?? null,
      startDate: parseIsoDate(e.startDate),
      endDate: parseIsoDate(e.endDate),
    }));
    return createHolidayPlan(parsed.name, entries);
  },

  async update(id: string, input: UpdateHolidayPlanInput) {
    const parsed = UpdateHolidayPlanSchema.parse(input);
    const existing = await findHolidayPlanById(id);
    if (!existing) throw new Error("Ferienplan nicht gefunden.");
    if (parsed.name === undefined) return existing;
    return updateHolidayPlan(id, { name: parsed.name });
  },

  async delete(id: string) {
    await deleteHolidayPlanById(id);
  },

  async addEntry(input: HolidayEntryInput) {
    const parsed = HolidayEntrySchema.parse(input);
    return createEntry({
      planId: parsed.planId,
      name: parsed.name ?? null,
      startDate: parseIsoDate(parsed.startDate),
      endDate: parseIsoDate(parsed.endDate),
    });
  },

  async updateEntry(id: string, input: UpdateHolidayEntryInput) {
    const parsed = UpdateHolidayEntrySchema.parse(input);
    return updateEntryById(id, {
      name: parsed.name ?? null,
      startDate: parseIsoDate(parsed.startDate),
      endDate: parseIsoDate(parsed.endDate),
    });
  },

  async deleteEntry(id: string) {
    await deleteEntryById(id);
  },

  // For the Schulbegleiter day view: holiday ranges (as ISO strings) for the
  // given plans that overlap the requested window.
  async listEntriesForPlanIds(
    planIds: string[],
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<PlanHolidayRange[]> {
    const rows = await listEntriesForPlanIds(planIds, rangeStart, rangeEnd);
    return rows.map((h) => ({
      id: h.id,
      planId: h.planId,
      name: h.name,
      startDate: formatIsoDateUtc(h.startDate),
      endDate: formatIsoDateUtc(h.endDate),
    }));
  },
};
