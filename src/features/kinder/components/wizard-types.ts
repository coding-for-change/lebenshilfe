import type { SchuleValue } from "./schule-autocomplete";

export type KostentraegerOption = {
  id: string;
  name: string;
};

export type KindWizardFormState = {
  firstName: string;
  lastName: string;
  schule: SchuleValue;
  leosOne: boolean;
  bescheid: string;
  sbIb: string;
  schweigepflichtsentbindung: boolean;
  bemerkung: string;
  kostentraegerId: string | null;
};

type ScalarFields = Exclude<keyof KindWizardFormState, "schule">;

export type KindWizardErrors = Partial<Record<ScalarFields | "schule", string>>;

export const KIND_STEP_LABELS = [
  "Stammdaten",
  "Verwaltung",
  "Übersicht",
] as const;

export const EMPTY_KIND_FORM: KindWizardFormState = {
  firstName: "",
  lastName: "",
  schule: {
    placeId: null,
    name: null,
    address: null,
    lat: null,
    lng: null,
  },
  leosOne: false,
  bescheid: "",
  sbIb: "",
  schweigepflichtsentbindung: false,
  bemerkung: "",
  kostentraegerId: null,
};
