import {
  AbsenceSchema,
  AssignmentSchema,
  CreateChildSchema,
  ScheduleSchema,
  UpdateChildSchema,
  UpdateVertretungSchema,
  VertretungSchema,
  type AbsenceInput,
  type AssignmentInput,
  type CreateChildInput,
  type ScheduleInput,
  type UpdateChildInput,
  WorkEventSchema,
  UpdateWorkEventSchema,
  type UpdateVertretungInput,
  type VertretungInput,
  type WorkEventInput,
  type UpdateWorkEventInput,
} from "./schemas";
import {
  createAssignment,
  createChild,
  createSchedule,
  createVertretungBlocks,
  deleteAbsenceById,
  deleteAssignmentById,
  deleteChildById,
  deleteScheduleById,
  deleteVertretungByChildAndDate,
  updateVertretungSubstituteForDate,
  childExists,
  findChildById,
  searchAssignedChildrenByName,
  getAssignmentCoverage,
  getVertretungCoverage,
  listAbsencesForChild,
  listAbsencesForChildrenInRange,
  listAssignmentsForChild,
  listAssignmentsForUser,
  listChildren,
  listSchedulesForChild,
  listSchedulesForChildren,
  listVertretungenForUserAsSubstitute,
  listWorkEventsForChild,
  syncVertretungBlocksForChildWeekday,
  listWorkEventsForChildInRange,
  updateAssignment,
  updateChild,
  updateSchedule,
  upsertAbsence,
  createWorkEventAsAdmin,
  updateWorkEventAsAdmin,
  deleteWorkEventAsAdmin,
  restoreWorkEventAsAdmin,
} from "./services";

function childFieldsFromCreate(input: CreateChildInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    leosOne: input.leosOne ?? false,
    bescheid: input.bescheid ?? null,
    sbIb: input.sbIb ?? null,
    approvedDirectHours: input.approvedDirectHours ?? null,
    approvedIndirectHours: input.approvedIndirectHours ?? null,
    vorviertelstunde: input.vorviertelstunde ?? false,
    nachviertelstunde: input.nachviertelstunde ?? false,
    ausflugSchullandheim: input.ausflugSchullandheim ?? false,
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
  if (input.approvedDirectHours !== undefined) {
    out.approvedDirectHours = input.approvedDirectHours;
  }
  if (input.approvedIndirectHours !== undefined) {
    out.approvedIndirectHours = input.approvedIndirectHours;
  }
  if (input.vorviertelstunde !== undefined) {
    out.vorviertelstunde = input.vorviertelstunde;
  }
  if (input.nachviertelstunde !== undefined) {
    out.nachviertelstunde = input.nachviertelstunde;
  }
  if (input.ausflugSchullandheim !== undefined) {
    out.ausflugSchullandheim = input.ausflugSchullandheim;
  }
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

  async assertChildExists(childId: string) {
    if (!(await childExists(childId))) {
      throw new Error("Kind nicht gefunden.");
    }
  },

  // Search children currently assigned to a given Schulbegleiter (used by the
  // timesheet entry form to pick a child for Einspringen/indirect work).
  async searchAssignedChildren(userId: string, query: string) {
    return searchAssignedChildrenByName(userId, query);
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
    const created = await createSchedule(parsed);
    await syncVertretungBlocksForChildWeekday(created.childId, created.weekday);
    return created;
  },

  async updateSchedule(
    id: string,
    input: Partial<Omit<ScheduleInput, "childId">>,
  ) {
    const updated = await updateSchedule(id, input);
    await syncVertretungBlocksForChildWeekday(updated.childId, updated.weekday);
    return updated;
  },

  async deleteSchedule(id: string) {
    const deleted = await deleteScheduleById(id);
    await syncVertretungBlocksForChildWeekday(deleted.childId, deleted.weekday);
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

  async createVertretung(input: VertretungInput) {
    const parsed = VertretungSchema.parse(input);
    const date = new Date(`${parsed.date}T00:00:00.000Z`);
    // Mon=0..Sun=6, matching Schedule.weekday convention.
    const weekday = (date.getUTCDay() + 6) % 7;

    // Copy each Stundenplan block for this child+weekday exactly as-is.
    // The Schedule (Stundenplan) is the source of truth for WHEN the
    // Schulbegleiter works — the Zuweisung only records WHO.
    const allSchedules = await listSchedulesForChild(parsed.childId);
    const dayBlocks = allSchedules
      .filter((s) => s.weekday === weekday)
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));

    // Fallback: if no schedule rows exist, create a single whole-day block.
    const timeBlocks =
      dayBlocks.length > 0
        ? dayBlocks
        : [{ startTime: "00:00", endTime: "23:59" }];

    await createVertretungBlocks({
      childId: parsed.childId,
      substituteUserId: parsed.substituteUserId,
      date,
      timeBlocks,
    });
  },

  async updateVertretung(
    childId: string,
    date: string,
    input: UpdateVertretungInput,
  ) {
    const parsed = UpdateVertretungSchema.parse(input);
    await updateVertretungSubstituteForDate(
      childId,
      new Date(`${date}T00:00:00.000Z`),
      parsed.substituteUserId,
    );
  },

  async deleteVertretung(childId: string, date: string) {
    await deleteVertretungByChildAndDate(
      childId,
      new Date(`${date}T00:00:00.000Z`),
    );
  },

  async listVertretungenForUserAsSubstitute(
    userId: string,
    from: Date,
    to: Date,
  ) {
    return listVertretungenForUserAsSubstitute(userId, from, to);
  },

  /**
   * Cross-feature access guard: verifies that every childId in the list is
   * either regularly assigned to userId on that weekday OR covered by a
   * Vertretung for that specific date. Throws if any child is uncovered.
   *
   * Called from the create-timesheet-event use case so that this validation
   * stays within the children domain and off the timesheet service layer.
   */
  async assertChildrenAccessForUser(
    userId: string,
    childIds: string[],
    date: Date,
  ) {
    if (childIds.length === 0) return;

    // Mon=0..Sun=6, matching Schedule.weekday convention.
    const weekday = (date.getUTCDay() + 6) % 7;
    const coveredByAssignment = await getAssignmentCoverage(
      userId,
      childIds,
      weekday,
    );

    const uncovered = childIds.filter((id) => !coveredByAssignment.has(id));
    if (uncovered.length === 0) return;

    // Normalise to UTC midnight to match @db.Date semantics.
    const dateOnly = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const coveredByVertretung = await getVertretungCoverage(
      userId,
      uncovered,
      dateOnly,
    );

    const stillUncovered = uncovered.filter(
      (id) => !coveredByVertretung.has(id),
    );
    if (stillUncovered.length > 0) {
      throw new Error("Ein Kind ist diesem Konto nicht zugewiesen.");
    }
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

  async restoreWorkEventAsAdmin(id: string) {
    return restoreWorkEventAsAdmin(id);
  },

  async listWorkEventsForChildInRange(childId: string, from: Date, to: Date) {
    return listWorkEventsForChildInRange(childId, from, to);
  },
};
