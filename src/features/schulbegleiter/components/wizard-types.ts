export type WorkshopOption = {
  id: string;
  name: string;
  description: string | null;
};

export type WizardWorkshopRow = {
  workshopId: string;
  selected: boolean;
  attendedOn: string; // YYYY-MM-DD
};

export type WizardFormState = {
  name: string;
  email: string;
  leosOne: boolean;
  outlook: boolean;
  weeklyHours: string; // text input; converted to number on submit
  zvNeuNachBescheid: boolean;
  zvNeuNote: string;
  introductionDay: string; // YYYY-MM-DD or ""
  workshops: WizardWorkshopRow[];
};

type ScalarFields = Exclude<keyof WizardFormState, "workshops">;

export type WizardErrors = Partial<Record<ScalarFields, string>> & {
  workshops?: Record<string, string>;
};

export const STEP_LABELS = [
  "Stammdaten",
  "Vertrag",
  "Workshops",
  "Übersicht",
] as const;
