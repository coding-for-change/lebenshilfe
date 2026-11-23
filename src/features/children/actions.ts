"use server";

import { serverAction } from "@/lib/server-action";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { downloadObject } from "@/lib/storage";
import { ChildrenFacade } from "./facade";
import type {
  AbsenceInput,
  AssignmentInput,
  CreateChildInput,
  ScheduleInput,
  UpdateChildInput,
  UpdateVertretungInput,
  VertretungInput,
  WorkEventInput,
  UpdateWorkEventInput,
  HistoryQuery,
} from "./schemas";
import { HistoryQuerySchema } from "./schemas";
import { resolveHistoryPeriod, historyRange } from "./history-period";
import { UserError } from "@/lib/action-result";

const ROUTE = "/admin/children";

// Search children assigned to the current Schulbegleiter. Lives in the
// children feature because it queries child data; the timesheet entry form
// calls it to pick a child for indirect work.
export const searchAssignedChildrenAction = serverAction(
  async (query: string) => {
    const { id: userId } = await requireAuth();
    return ChildrenFacade.searchAssignedChildren(userId, query);
  },
);

export const createChildAction = serverAction(
  async (input: CreateChildInput) => {
    await requireAdmin();
    const created = await ChildrenFacade.create(input);
    revalidatePath(ROUTE);

    return {
      success: true as const,
      child: { id: created.id },
    };
  },
);

export const updateChildAction = serverAction(
  async (id: string, input: UpdateChildInput) => {
    await requireAdmin();
    await ChildrenFacade.update(id, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deleteChildAction = serverAction(async (id: string) => {
  await requireAdmin();
  await ChildrenFacade.delete(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const createAssignmentAction = serverAction(
  async (input: AssignmentInput) => {
    await requireAdmin();
    const created = await ChildrenFacade.createAssignment(input);
    revalidatePath(ROUTE);
    return { success: true as const, assignment: created };
  },
);

export const updateAssignmentAction = serverAction(
  async (id: string, input: Partial<AssignmentInput>) => {
    await requireAdmin();
    await ChildrenFacade.updateAssignment(id, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deleteAssignmentAction = serverAction(async (id: string) => {
  await requireAdmin();
  await ChildrenFacade.deleteAssignment(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const createScheduleAction = serverAction(
  async (input: ScheduleInput) => {
    await requireAdmin();
    const created = await ChildrenFacade.createSchedule(input);
    revalidatePath(ROUTE);
    return { success: true as const, schedule: created };
  },
);

export const updateScheduleAction = serverAction(
  async (id: string, input: Partial<Omit<ScheduleInput, "childId">>) => {
    await requireAdmin();
    await ChildrenFacade.updateSchedule(id, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deleteScheduleAction = serverAction(async (id: string) => {
  await requireAdmin();
  await ChildrenFacade.deleteSchedule(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const saveAbsenceAction = serverAction(async (input: AbsenceInput) => {
  await requireAdmin();
  await ChildrenFacade.saveAbsence(input);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const deleteAbsenceAction = serverAction(async (id: string) => {
  await requireAdmin();
  await ChildrenFacade.deleteAbsence(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const listWorkEventsForChildAction = serverAction(
  async (childId: string, query?: HistoryQuery) => {
    await requireAdmin();

    const parsedQuery = query ? HistoryQuerySchema.parse(query) : undefined;
    const bounds = await ChildrenFacade.getEventDateBoundsForChild(childId);
    const period = resolveHistoryPeriod(parsedQuery, bounds);

    const events = await ChildrenFacade.listWorkEventsForChild(
      childId,
      historyRange(period),
      period.order,
    );

    // Fetch each signed event's signature once, in parallel; failed/missing
    // fetches just leave the row without an image rather than aborting the
    // whole load. Bounded to the selected period, so this never fans out across
    // a child's entire history.
    const signaturesByEventId = new Map<string, string>();
    await Promise.all(
      events
        .filter((e) => e.signatureKey)
        .map(async (e) => {
          try {
            const bytes = await downloadObject(e.signatureKey!);
            signaturesByEventId.set(e.id, bytes.toString("base64"));
          } catch {
            // skip
          }
        }),
    );

    return {
      year: period.year,
      month: period.month,
      // Earliest month with data (null when the child has none). Drives the
      // picker's selectable range (everything before it is disabled, like the
      // future) and the export dialog's year floor.
      earliest: bounds
        ? {
            year: bounds.earliest.getUTCFullYear(),
            month: bounds.earliest.getUTCMonth() + 1,
          }
        : null,
      events: events.map((e) => ({
        id: e.id,
        date: e.date.toISOString().slice(0, 10),
        startTime: e.startTime,
        endTime: e.endTime,
        note: e.note,
        type: e.type,
        userName: e.user.name,
        userId: e.userId,
        deleted: e.deleted,
        signed: !!e.signatureKey,
        signatureBase64: signaturesByEventId.get(e.id) ?? null,
      })),
    };
  },
);

export const createWorkEventAsAdminAction = serverAction(
  async (input: WorkEventInput) => {
    await requireAdmin();
    await ChildrenFacade.createWorkEventAsAdmin(input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const updateWorkEventAsAdminAction = serverAction(
  async (id: string, input: UpdateWorkEventInput) => {
    await requireAdmin();
    await ChildrenFacade.updateWorkEventAsAdmin(id, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deleteWorkEventAsAdminAction = serverAction(async (id: string) => {
  await requireAdmin();
  await ChildrenFacade.deleteWorkEventAsAdmin(id);
  revalidatePath(ROUTE);
  return { success: true as const };
});

export const restoreWorkEventAsAdminAction = serverAction(
  async (id: string) => {
    await requireAdmin();
    await ChildrenFacade.restoreWorkEventAsAdmin(id);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const listWorkEventsForChildInRangeAction = serverAction(
  async (childId: string, weekStart: string) => {
    await requireAdmin();
    const from = new Date(`${weekStart}T00:00:00.000Z`);
    const to = new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000);
    const events = await ChildrenFacade.listWorkEventsForChildInRange(
      childId,
      from,
      to,
    );
    return events.map((e) => ({
      id: e.id,
      date: e.date.toISOString().slice(0, 10),
      startTime: e.startTime,
      endTime: e.endTime,
      userName: e.user.name,
    }));
  },
);

export const createVertretungAction = serverAction(
  async (input: VertretungInput) => {
    await requireAdmin();
    await ChildrenFacade.createVertretung(input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const updateVertretungAction = serverAction(
  async (childId: string, date: string, input: UpdateVertretungInput) => {
    await requireAdmin();
    await ChildrenFacade.updateVertretung(childId, date, input);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const deleteVertretungAction = serverAction(
  async (childId: string, date: string) => {
    await requireAdmin();
    await ChildrenFacade.deleteVertretung(childId, date);
    revalidatePath(ROUTE);
    return { success: true as const };
  },
);

export const reportChildSickAction = serverAction(
  async (input: { childId: string; date: string; note?: string }) => {
    const { id: userId } = await requireAuth();
    const date = new Date(`${input.date}T00:00:00.000Z`);

    await ChildrenFacade.assertChildrenAccessForUser(
      userId,
      [input.childId],
      date,
    );

    await ChildrenFacade.saveAbsence(
      { childId: input.childId, date: input.date, note: input.note },
      userId,
    );

    revalidatePath("/");
    return { success: true as const };
  },
);

export const cancelChildSickAction = serverAction(async (absenceId: string) => {
  const { id: userId } = await requireAuth();

  const absence = await ChildrenFacade.getAbsenceByIdForCreator(
    absenceId,
    userId,
  );
  if (!absence) {
    throw new UserError(
      "Krankmeldung nicht gefunden oder nicht von dir erstellt.",
    );
  }

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  if (absence.createdAt.getTime() < todayUtc.getTime()) {
    throw new UserError("Rücknahme ist nur am Tag der Meldung möglich.");
  }

  await ChildrenFacade.deleteAbsence(absenceId);
  revalidatePath("/");
  return { success: true as const };
});
