"use client";

import { useAutosave } from "@/components/use-autosave";
import { updateChildAction } from "../../actions";
import { parseHoursInput, type UpdateChildInput } from "../../schemas";
import type { SerializedChild } from "../../serialize";
import type { SchoolValue } from "../school-autocomplete";

export type GeneralFormState = {
  firstName: string;
  lastName: string;
  school: SchoolValue;
  leosOne: boolean;
  schweigepflichtsentbindung: boolean;
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
    school: {
      placeId: c.schoolPlaceId,
      name: c.schoolName,
      address: c.schoolAddress,
      lat: c.schoolLat,
      lng: c.schoolLng,
    },
    leosOne: c.leosOne,
    schweigepflichtsentbindung: c.schweigepflichtsentbindung,
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
  if (
    next.school.placeId !== base.school.placeId ||
    next.school.name !== base.school.name ||
    next.school.address !== base.school.address ||
    next.school.lat !== base.school.lat ||
    next.school.lng !== base.school.lng
  ) {
    patch.school = next.school;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

export function useAutosaveGeneral(child: SerializedChild) {
  return useAutosave({
    entity: child,
    entityKey: child.id,
    toForm: fromChild,
    diff,
    persist: async (patch) => {
      await updateChildAction(child.id, patch);
    },
  });
}
