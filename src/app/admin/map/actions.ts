"use server";

import { requireAdmin } from "@/lib/auth-guards";
import { parseIsoDate, weekdayIndex } from "@/lib/dates";
import { ChildrenFacade, serializeChild } from "@/features/children";
import type { MapChild, MapPayload, MapSchool } from "./types";

export async function getMapDataForDate(date: string): Promise<MapPayload> {
  await requireAdmin();

  const parsed = parseIsoDate(date);
  const weekday = weekdayIndex(parsed);

  const childrenRaw = await ChildrenFacade.list();
  const childIds = childrenRaw.map((c) => c.id);
  const absences = childIds.length
    ? await ChildrenFacade.listAbsencesForChildrenInRange(
        childIds,
        parsed,
        parsed,
      )
    : [];
  const absentIds = new Set(absences.map((a) => a.childId));

  const groups = new Map<string, MapSchool>();
  for (const raw of childrenRaw) {
    const child = serializeChild(raw);
    const school = child.school;
    // Only children assigned to a geocoded school can be placed on the map.
    if (!school || school.lat == null || school.lng == null) continue;
    if (absentIds.has(child.id)) continue;

    const dayAssignments = child.assignments.filter(
      (a) => a.weekday === weekday,
    );
    if (dayAssignments.length === 0) continue;

    const key = `school:${school.id}`;
    const mapChild: MapChild = {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      assistants: dayAssignments.map((a) => ({
        profileId: a.profileId,
        name: a.userName,
        tandem: a.tandem,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    };

    const existing = groups.get(key);
    if (existing) {
      existing.children.push(mapChild);
    } else {
      groups.set(key, {
        key,
        name: school.name,
        address: school.address ?? "",
        lat: school.lat,
        lng: school.lng,
        children: [mapChild],
      });
    }
  }

  for (const school of groups.values()) {
    school.children.sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
        "de",
      ),
    );
  }

  const schools = Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );

  return { date, weekday, schools };
}
