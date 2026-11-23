// Neutral hints the login page can show above the form, selected by the
// `?notice=` query parameter. A fixed list, so the URL can only pick one of
// these texts rather than inject its own (unlike `?error=`, which is shown as is).
export const LOGIN_NOTICE = {
  INVITATION_ACCEPTED: "einladung-angenommen",
} as const;

const TEXTS: Record<string, string> = {
  [LOGIN_NOTICE.INVITATION_ACCEPTED]:
    "Du hast deine Einladung bereits angenommen. Melde dich mit deiner E-Mail-Adresse und deinem Passwort an.",
};

export function loginNoticeText(key: unknown): string | undefined {
  return typeof key === "string" ? TEXTS[key] : undefined;
}
