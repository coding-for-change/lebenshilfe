import {
  AbsenceSchema,
  AssignmentSchema,
  CreateChildSchema,
  ScheduleSchema,
  UpdateChildSchema,
  type AbsenceInput,
  type AssignmentInput,
  type CreateChildInput,
  type ScheduleInput,
  type UpdateChildInput,
  WorkEventSchema,
  UpdateWorkEventSchema,
  type WorkEventInput,
  type UpdateWorkEventInput,
} from "./schemas";
import {
  createAssignment,
  createChild,
  createSchedule,
  deleteAbsenceById,
  deleteAssignmentById,
  deleteChildById,
  deleteScheduleById,
  findChildById,
  listAbsencesForChild,
  listAbsencesForChildrenInRange,
  listAssignmentsForChild,
  listAssignmentsForUser,
  listChildren,
  listSchedulesForChild,
  listSchedulesForChildren,
  listWorkEventsForChild,
  updateAssignment,
  updateChild,
  updateSchedule,
  upsertAbsence,
  createWorkEventAsAdmin,
  updateWorkEventAsAdmin,
  deleteWorkEventAsAdmin,
} from "./services";

function childFieldsFromCreate(input: CreateChildInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    leosOne: input.leosOne ?? false,
    bescheid: input.bescheid ?? null,
    sbIb: input.sbIb ?? null,
    schweigepflichtsentbindung: input.schweigepflichtsentbindung ?? false,
    bemerkung: input.bemerkung ?? null,
    kostentraegerId: input.kostentraegerId ?? null,
    schoolName: input.school?.name ?? null,
    schoolAddress: input.school?.address ?? null,
    schoolPlaceId: input.school?.placeId ?? null,
    schoolLat: input.school?.lat ?? null,
    schoolLng: input.school?.lng ?? null,
  };
}

function childFieldsFromUpdate(input: UpdateChildInput) {
  const out: Record<string, unknown> = {};
  if (input.firstName !== undefined) out.firstName = input.firstName;
  if (input.lastName !== undefined) out.lastName = input.lastName;
  if (input.leosOne !== undefined) out.leosOne = input.leosOne;
  if (input.bescheid !== undefined) out.bescheid = input.bescheid;
  if (input.sbIb !== undefined) out.sbIb = input.sbIb;
  if (input.schweigepflichtsentbindung !== undefined) {
    out.schweigepflichtsentbindung = input.schweigepflichtsentbindung;
  }
  if (input.bemerkung !== undefined) out.bemerkung = input.bemerkung;
  if (input.kostentraegerId !== undefined) {
    out.kostentraegerId = input.kostentraegerId;
  }
  if (input.school !== undefined) {
    out.schoolName = input.school?.name ?? null;
    out.schoolAddress = input.school?.address ?? null;
    out.schoolPlaceId = input.school?.placeId ?? null;
    out.schoolLat = input.school?.lat ?? null;
    out.schoolLng = input.school?.lng ?? null;
  }
  return out;
}

export const ChildrenFacade = {
  async list() {
    return listChildren();
  },

  async getById(id: string) {
    return findChildById(id);
  },

  async create(input: CreateChildInput) {
    const parsed = CreateChildSchema.parse(input);
    return createChild(childFieldsFromCreate(parsed));
  },

  async update(id: string, input: UpdateChildInput) {
    const parsed = UpdateChildSchema.parse(input);
    const existing = await findChildById(id);
    if (!existing) throw new Error("Kind nicht gefunden.");
    return updateChild(id, childFieldsFromUpdate(parsed));
  },

  async delete(id: string) {
    await deleteChildById(id);
  },

  async listAssignments(childId: string) {
    return listAssignmentsForChild(childId);
  },

  async listAssignmentsForUser(userId: string) {
    return listAssignmentsForUser(userId);
  },

  async createAssignment(input: AssignmentInput) {
    const parsed = AssignmentSchema.parse(input);
    return createAssignment(parsed);
  },

  async updateAssignment(id: string, input: Partial<AssignmentInput>) {
    return updateAssignment(id, input);
  },

  async deleteAssignment(id: string) {
    await deleteAssignmentById(id);
  },

  async listSchedules(childId: string) {
    return listSchedulesForChild(childId);
  },

  async listSchedulesForChildren(childIds: string[]) {
    return listSchedulesForChildren(childIds);
  },

  async createSchedule(input: ScheduleInput) {
    const parsed = ScheduleSchema.parse(input);
    return createSchedule(parsed);
  },

  async updateSchedule(
    id: string,
    input: Partial<Omit<ScheduleInput, "childId">>,
  ) {
    return updateSchedule(id, input);
  },

  async deleteSchedule(id: string) {
    await deleteScheduleById(id);
  },

  async listAbsences(childId: string) {
    return listAbsencesForChild(childId);
  },

  async listAbsencesForChildrenInRange(
    childIds: string[],
    from: Date,
    to: Date,
  ) {
    return listAbsencesForChildrenInRange(childIds, from, to);
  },

  async saveAbsence(input: AbsenceInput) {
    const parsed = AbsenceSchema.parse(input);
    return upsertAbsence({
      childId: parsed.childId,
      date: new Date(`${parsed.date}T00:00:00.000Z`),
      note: parsed.note ?? null,
    });
  },

  async deleteAbsence(id: string) {
    await deleteAbsenceById(id);
  },

  async listWorkEventsForChild(childId: string) {
    return listWorkEventsForChild(childId);
  },

  async createWorkEventAsAdmin(input: WorkEventInput) {
    const parsed = WorkEventSchema.parse(input);
    return createWorkEventAsAdmin(parsed);
  },

  async updateWorkEventAsAdmin(id: string, input: UpdateWorkEventInput) {
    const parsed = UpdateWorkEventSchema.parse(input);
    return updateWorkEventAsAdmin(id, parsed);
  },

  async deleteWorkEventAsAdmin(id: string) {
    return deleteWorkEventAsAdmin(id);
  },
};
