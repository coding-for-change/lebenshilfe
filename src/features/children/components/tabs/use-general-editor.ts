"use client";

import { useDetailEditor } from "@/components/use-detail-editor";
import { updateChildAction } from "../../actions";
import type { UpdateChildInput } from "../../schemas";
import type { SerializedChild } from "../../serialize";

export type GeneralFormState = {
  firstName: string;
  lastName: string;
  schoolId: string | null;
  leosOne: boolean;
  schweigepflichtsentbindung: boolean;
  bescheid: string;
  sbIb: string;
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
    bescheid: c.bescheid ?? "",
    sbIb: c.sbIb ?? "",
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
  if ((next.bescheid || null) !== (base.bescheid || null)) {
    patch.bescheid = next.bescheid || null;
  }
  if ((next.sbIb || null) !== (base.sbIb || null)) {
    patch.sbIb = next.sbIb || null;
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
