// Known consent types recorded in the ConsentEvent log. String-based (not a DB
// enum) so new consents can be added without a migration.
export const ConsentType = {
  GOOGLE_MAPS: "google_maps",
} as const;

export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];
