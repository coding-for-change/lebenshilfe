"use client";

import { useDetailEditor } from "@/components/use-detail-editor";
import { updateChildAction } from "../../actions";
import { parseHoursInput, type UpdateChildInput } from "../../schemas";
import type { SerializedChild } from "../../serialize";

export type GeneralFormState = {
  firstName: string;
  lastName: string;
  schoolId: string | null;
  leosOne: boolean;
  schweigepflichtsentbindung: boolean;
  vorviertelstunde: boolean;
  nachviertelstunde: boolean;
  ausflugSchullandheim: boolean;
  bescheid: string;
  sbIb: string;
  approvedDirectHours: string;
  approvedIndirectHours: string;
  bemerkung: string;
  kostentraegerId: string | null;
};

function fromChild(c: SerializedChild): GeneralFormState {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    schoolId: c.school?.id ?? null,
    leosOne: c.leosOne,
    schweigepflichtsentbindung: c.schweigepflichtsentbindung,
    vorviertelstunde: c.vorviertelstunde,
    nachviertelstunde: c.nachviertelstunde,
    ausflugSchullandheim: c.ausflugSchullandheim,
    bescheid: c.bescheid ?? "",
    sbIb: c.sbIb ?? "",
    approvedDirectHours:
      c.approvedDirectHours == null ? "" : String(c.approvedDirectHours),
    approvedIndirectHours:
      c.approvedIndirectHours == null ? "" : String(c.approvedIndirectHours),
    bemerkung: c.bemerkung ?? "",
    kostentraegerId: c.costBearer?.id ?? null,
  };
}

function diff(
  base: GeneralFormState,
  next: GeneralFormState,
): UpdateChildInput | null {
  const patch: UpdateChildInput = {};
  if (next.firstName !== base.firstName) patch.firstName = next.firstName;
  if (next.lastName !== base.lastName) patch.lastName = next.lastName;
  if (next.leosOne !== base.leosOne) patch.leosOne = next.leosOne;
  if (next.schweigepflichtsentbindung !== base.schweigepflichtsentbindung) {
    patch.schweigepflichtsentbindung = next.schweigepflichtsentbindung;
  }
  if (next.vorviertelstunde !== base.vorviertelstunde) {
    patch.vorviertelstunde = next.vorviertelstunde;
  }
  if (next.nachviertelstunde !== base.nachviertelstunde) {
    patch.nachviertelstunde = next.nachviertelstunde;
  }
  if (next.ausflugSchullandheim !== base.ausflugSchullandheim) {
    patch.ausflugSchullandheim = next.ausflugSchullandheim;
  }
  if ((next.bescheid || null) !== (base.bescheid || null)) {
    patch.bescheid = next.bescheid || null;
  }
  if ((next.sbIb || null) !== (base.sbIb || null)) {
    patch.sbIb = next.sbIb || null;
  }
  if (next.approvedDirectHours !== base.approvedDirectHours) {
    patch.approvedDirectHours = parseHoursInput(next.approvedDirectHours);
  }
  if (next.approvedIndirectHours !== base.approvedIndirectHours) {
    patch.approvedIndirectHours = parseHoursInput(next.approvedIndirectHours);
  }
  if ((next.bemerkung || null) !== (base.bemerkung || null)) {
    patch.bemerkung = next.bemerkung || null;
  }
  if (next.kostentraegerId !== base.kostentraegerId) {
    patch.kostentraegerId = next.kostentraegerId;
  }
  if (next.schoolId !== base.schoolId) {
    patch.schoolId = next.schoolId;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

export function useGeneralEditor(child: SerializedChild | null) {
  return useDetailEditor({
    entity: child,
    entityKey: child?.id,
    toForm: fromChild,
    diff,
    persist: async (patch) => {
      if (!child) return;
      await updateChildAction(child.id, patch);
    },
  });
}
