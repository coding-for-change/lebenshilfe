// Header that carries the invitation token on a sign-up request. The onboarding
// form sets it, the user.create hook in src/lib/auth.ts reads it: a sign-up is
// only accepted for the invitation whose link was actually opened, and the role
// comes from that invitation (not from any other invitation for the same email).
// A header rather than a body field keeps Better Auth's typed sign-up body as is.
export const INVITE_TOKEN_HEADER = "x-invite-token";
