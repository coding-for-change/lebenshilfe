import {
  AssignHolidayPlanSchema,
  CreateSchoolSchema,
  UpdateSchoolSchema,
  type AssignHolidayPlanInput,
  type SchoolInput,
  type UpdateSchoolInput,
} from "./schemas";
import {
  assignHolidayPlan,
  createSchool,
  deleteSchoolById,
  findSchoolById,
  listSchools,
  updateSchool,
} from "./services";

function schoolData(input: SchoolInput) {
  return {
    name: input.name,
    address: input.address ?? null,
    placeId: input.placeId ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    holidayPlanId: input.holidayPlanId ?? null,
  };
}

export const SchoolsFacade = {
  async list() {
    return listSchools();
  },

  async getById(id: string) {
    return findSchoolById(id);
  },

  async create(input: SchoolInput) {
    const parsed = CreateSchoolSchema.parse(input);
    return createSchool(schoolData(parsed));
  },

  async update(id: string, input: UpdateSchoolInput) {
    const parsed = UpdateSchoolSchema.parse(input);
    const existing = await findSchoolById(id);
    if (!existing) throw new Error("Schule nicht gefunden.");
    // Only write keys that were actually provided so a partial edit cannot
    // clear untouched columns.
    const data: Partial<ReturnType<typeof schoolData>> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.address !== undefined) data.address = parsed.address ?? null;
    if (parsed.placeId !== undefined) data.placeId = parsed.placeId ?? null;
    if (parsed.lat !== undefined) data.lat = parsed.lat ?? null;
    if (parsed.lng !== undefined) data.lng = parsed.lng ?? null;
    if (parsed.holidayPlanId !== undefined) {
      data.holidayPlanId = parsed.holidayPlanId ?? null;
    }
    return updateSchool(id, data);
  },

  async delete(id: string) {
    await deleteSchoolById(id);
  },

  // Batch (or single) assignment of a holiday plan to schools.
  async assignHolidayPlan(input: AssignHolidayPlanInput) {
    const parsed = AssignHolidayPlanSchema.parse(input);
    return assignHolidayPlan(parsed.schoolIds, parsed.holidayPlanId);
  },
};
