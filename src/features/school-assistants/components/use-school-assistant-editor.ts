"use client";

import { useCallback } from "react";
import { useDetailEditor } from "@/components/use-detail-editor";
import { updateSchoolAssistantAction } from "../actions";
import type { UpdateSchoolAssistantInput } from "../schemas";
import type { SerializedProfile } from "../serialize";
import type { WizardWorkshopRow, WorkshopOption } from "./wizard-types";

export type DetailFormState = {
  name: string;
  leosOne: boolean;
  outlook: boolean;
  weeklyHours: string;
  zvNeuNachBescheid: boolean;
  zvNeuNote: string;
  introductionDay: string;
  workshops: WizardWorkshopRow[];
};

function fromProfile(
  profile: SerializedProfile,
  workshops: WorkshopOption[],
): DetailFormState {
  const attendanceMap = new Map(
    profile.attendances.map((a) => [a.workshopId, a]),
  );
  return {
    name: profile.name,
    leosOne: profile.leosOne,
    outlook: profile.outlook,
    weeklyHours: profile.weeklyHours == null ? "" : String(profile.weeklyHours),
    zvNeuNachBescheid: profile.zvNeuNachBescheid,
    zvNeuNote: profile.zvNeuNote ?? "",
    introductionDay: profile.introductionDay ?? "",
    workshops: workshops.map((w) => {
      const found = attendanceMap.get(w.id);
      return {
        workshopId: w.id,
        selected: !!found,
        attendedOn: found ? found.attendedOn : "",
      };
    }),
  };
}

function parseHours(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function workshopsEqual(a: WizardWorkshopRow[], b: WizardWorkshopRow[]) {
  if (a.length !== b.length) return false;
  const byId = new Map(a.map((row) => [row.workshopId, row]));
  for (const row of b) {
    const other = byId.get(row.workshopId);
    if (!other) return false;
    if (other.selected !== row.selected) return false;
    if (other.attendedOn !== row.attendedOn) return false;
  }
  return true;
}

function diff(
  base: DetailFormState,
  next: DetailFormState,
): UpdateSchoolAssistantInput | null {
  const patch: UpdateSchoolAssistantInput = {};

  if (next.name.trim() !== base.name.trim()) patch.name = next.name.trim();
  if (next.leosOne !== base.leosOne) patch.leosOne = next.leosOne;
  if (next.outlook !== base.outlook) patch.outlook = next.outlook;

  const baseHours = parseHours(base.weeklyHours);
  const nextHours = parseHours(next.weeklyHours);
  if (baseHours !== nextHours) patch.weeklyHours = nextHours;

  if (next.zvNeuNachBescheid !== base.zvNeuNachBescheid) {
    patch.zvNeuNachBescheid = next.zvNeuNachBescheid;
  }
  const baseNote = base.zvNeuNote.trim() || null;
  const nextNote = next.zvNeuNote.trim() || null;
  if (baseNote !== nextNote) patch.zvNeuNote = nextNote;

  const baseDay = base.introductionDay || null;
  const nextDay = next.introductionDay || null;
  if (baseDay !== nextDay) patch.introductionDay = nextDay;

  if (!workshopsEqual(base.workshops, next.workshops)) {
    // Unselected or date-less rows represent "not attended" — drop them so
    // we don't emit attendance records for them.
    patch.workshops = next.workshops
      .filter((w) => w.selected && w.attendedOn)
      .map((w) => ({ workshopId: w.workshopId, attendedOn: w.attendedOn }));
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function useSchoolAssistantEditor(
  profile: SerializedProfile | null,
  workshops: WorkshopOption[],
) {
  const toForm = useCallback(
    (p: SerializedProfile) => fromProfile(p, workshops),
    [workshops],
  );

  return useDetailEditor({
    entity: profile,
    entityKey: profile?.id,
    toForm,
    diff,
    persist: async (patch) => {
      if (!profile) return;
      await updateSchoolAssistantAction(profile.id, patch);
    },
  });
}
