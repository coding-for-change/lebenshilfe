import { prisma } from "@/lib/prisma";
import { EventType, type Prisma } from "@/generated/prisma";
import type { WorkEventInput, UpdateWorkEventInput } from "../schemas";

export type ChildWorkEvent = Prisma.EventGetPayload<{
  include: { user: true };
}>;

export async function listWorkEventsForChild(
  childId: string,
): Promise<ChildWorkEvent[]> {
  return prisma.event.findMany({
    where: { childId, type: EventType.WORK },
    include: { user: true },
    orderBy: { date: "desc" },
  });
}

export async function createWorkEventAsAdmin(input: WorkEventInput) {
  return prisma.event.create({
    data: {
      childId: input.childId,
      userId: input.userId,
      type: EventType.WORK,
      date: new Date(`${input.date}T00:00:00.000Z`),
      startTime: input.startTime,
      endTime: input.endTime,
      note: input.note ?? null,
      modifiedByAdmin: true,
    },
  });
}

export async function updateWorkEventAsAdmin(
  id: string,
  input: UpdateWorkEventInput,
) {
  const data: Prisma.EventUpdateInput = { modifiedByAdmin: true };
  if (input.userId !== undefined) data.user = { connect: { id: input.userId } };
  if (input.date !== undefined)
    data.date = new Date(`${input.date}T00:00:00.000Z`);
  if (input.startTime !== undefined) data.startTime = input.startTime;
  if (input.endTime !== undefined) data.endTime = input.endTime;
  if (input.note !== undefined) data.note = input.note ?? null;

  return prisma.event.update({
    where: { id },
    data,
  });
}

export async function deleteWorkEventAsAdmin(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}
