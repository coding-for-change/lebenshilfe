import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createElement } from "react";
import { prisma } from "./prisma";
import { Role, SchulbegleiterStatus } from "@/generated/prisma";
import { sendMail } from "./mail";
import { renderEmail } from "./email/render";
import { ResetPasswordEmail } from "./email/templates/reset-password-email";
import { logger } from "@/lib/logger";
import { branding } from "@/lib/branding";
import { haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { INVITE_TOKEN_HEADER } from "./invite-token";

const INVALID_INVITATION_MESSAGE =
  "Diese Einladung ist nicht mehr gültig. Bitte öffne den Link aus der neuesten Einladungs-E-Mail.";

// The invitation a sign-up may use: the one whose link was opened (token),
// unused, not expired or withdrawn, and for this email. Null otherwise.
async function findUsableInvitation(token: string | null, email: string) {
  if (!token) return null;
  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (
    !invite ||
    invite.isUsed ||
    invite.expiresAt <= new Date() ||
    invite.email.toLowerCase() !== email.toLowerCase()
  ) {
    return null;
  }
  return invite;
}

// Rendering and sending are not awaited by the reset request (see
// sendResetPassword below). The server is a long-running Node process, so the
// mail still goes out; a failure is logged instead of reaching the caller.
function sendResetPasswordMail(to: string, resetUrl: string) {
  void (async () => {
    const { html, text } = await renderEmail(
      createElement(ResetPasswordEmail, { resetUrl }),
    );
    await sendMail({
      to,
      subject: `Passwort zurücksetzen – ${branding.name}`,
      html,
      text,
    });
  })().catch((error) => {
    logger.error({ err: error }, "[auth] could not send the reset mail");
  });
}

// The invitation a sign-up request was made with, or null. Read from the
// request header, never derived from the email: an email can have several
// invitations (an old Schulbegleiter one and a newer Admin one), and only the
// link that was actually opened may decide the role.
function inviteTokenOf(
  ctx: { headers?: Headers } | null | undefined,
): string | null {
  return ctx?.headers?.get(INVITE_TOKEN_HEADER) ?? null;
}

// Rate limiting protects the auth endpoints (brute force / credential stuffing)
// in production. Outside production it is off by default so local scripts that
// fire many auth requests in a row aren't throttled — e.g. `npm run db:seed`,
// which signs up every seed user in a loop through auth.handler. Set
// RATE_LIMIT_ENABLED to override in either direction (RATE_LIMIT_ENABLED=true to
// exercise the limits locally, =false to disable them anywhere).
const rateLimitEnabled =
  process.env.RATE_LIMIT_ENABLED !== undefined
    ? process.env.RATE_LIMIT_ENABLED === "true"
    : process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  // Better Auth endpoints this app never calls. Profiles are not self-service
  // here (names and roles are managed by admins in the app), so the update
  // endpoint stays off instead of exposing every client-settable user field.
  // /verify-password checks a password for the signed-in user; nothing here
  // uses it, and with a stolen session it would be a password-guessing oracle.
  disabledPaths: ["/update-user", "/verify-password"],
  hooks: {
    // Runs before Better Auth looks the email up (user hooks run before the
    // plugins', so also before the breach check). Without it, a sign-up
    // without a valid invitation answered 422 "user already exists" for
    // registered emails and 403 for all others, so anyone could test which
    // addresses have an account. Now every such attempt gets the same 403.
    // The user.create hook below checks the same again for its own path.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (!(await findUsableInvitation(inviteTokenOf(ctx), email))) {
        throw new APIError("FORBIDDEN", {
          message: INVALID_INVITATION_MESSAGE,
        });
      }
    }),
  },
  plugins: [
    // Reject breached passwords (HIBP k-anonymity: only a hashed SHA-1 prefix leaves the server).
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "Dieses Passwort taucht in bekannten Datenlecks auf. Bitte wähle ein anderes.",
    }),
    // TOTP (authenticator app) as the only second factor — no email/SMS OTP.
    // better-auth encrypts the TOTP secret at rest with BETTER_AUTH_SECRET; backup
    // codes default to plaintext, so encrypt them too.
    twoFactor({
      issuer: branding.name,
      backupCodeOptions: { storeBackupCodes: "encrypted" },
    }),
  ],
  rateLimit: {
    enabled: rateLimitEnabled,
    storage: "database",
    // Tightened per-IP limits on top of better-auth's defaults. Uses the
    // RateLimit table (prisma/schema.prisma) so counters survive restarts and
    // are shared across replicas — the default in-process Map does not.
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      // The reset request. (This rule was keyed "/forget-password", a path
      // Better Auth no longer has, so only its looser default applied.)
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        // Never accepted from a request body. Without this, Better Auth's
        // built-in /update-user (and /sign-up/email) take `role` from the
        // client, so any signed-in user could set their own role. Roles are
        // assigned only server-side: by the invitation in the create hook
        // below, and by the users feature (promote to owner).
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // Invalidate all existing sessions on password reset, so resetting a
    // compromised account actually logs out an attacker holding a live session.
    revokeSessionsOnPasswordReset: true,
    // Only called for registered emails. Awaiting the mail here made those
    // requests ~20x slower than for unknown emails, so the response time
    // revealed which addresses have an account. The mail is sent in the
    // background instead.
    sendResetPassword: async ({ url, user }) => {
      sendResetPasswordMail(user.email, url);
    },
  },
  session: {
    // Sliding session: expires 7 days after last use (idle timeout); active
    // sessions refresh at most once per day. Every admin login is additionally
    // gated by 2FA, and the cookie is Secure/HttpOnly/SameSite.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    // Pin the Secure cookie flag to production rather than relying on inferred
    // protocol/URL. NODE_ENV=production is set in the Dockerfile; local dev runs
    // over http (incl. dev:local on a LAN IP), where a Secure cookie is rejected.
    useSecureCookies: process.env.NODE_ENV === "production",
    // Rate limits are per client IP, read from X-Forwarded-For (Better Auth's
    // default). That is trustworthy only because Caddy, our only ingress,
    // replaces any client-sent X-Forwarded-For with the real peer address
    // (verified: a forged header is ignored). If a CDN or load balancer is ever
    // put in front, set advanced.ipAddress.trustedProxies to its ranges, or all
    // clients end up in one shared "no-trusted-ip" bucket.
  },
  databaseHooks: {
    user: {
      create: {
        // Registration requires the invitation whose link was opened: it must
        // exist, be unused, not be expired or withdrawn, and belong to this
        // email. The role is taken from exactly that invitation.
        before: async (user, ctx) => {
          const invite = await findUsableInvitation(
            inviteTokenOf(ctx),
            user.email,
          );
          if (!invite) {
            throw new APIError("FORBIDDEN", {
              message: INVALID_INVITATION_MESSAGE,
            });
          }
          return {
            data: {
              ...user,
              role: invite.role,
            },
          };
        },
        after: async (user, ctx) => {
          // Consume the invitation as part of the sign-up itself, and close any
          // other open invitation for this email: the person has an account now,
          // so no other link may create a second one or a different role.
          const token = inviteTokenOf(ctx);
          if (token) {
            try {
              const invite = await prisma.invitation.update({
                where: { token },
                data: { isUsed: true },
              });
              await prisma.invitation.updateMany({
                where: { email: invite.email, isUsed: false },
                data: { expiresAt: new Date(0) },
              });
            } catch (error) {
              // The account exists at this point; failing the request now would
              // only tell the person their sign-up failed when it did not.
              logger.error(
                { err: error, userId: user.id },
                "[auth] could not consume the invitation after sign-up",
              );
            }
          }

          if (user.role !== Role.SCHOOL_ASSISTANT) return;
          try {
            await prisma.schoolAssistantProfile.update({
              where: { email: user.email },
              data: {
                userId: user.id,
                status: SchulbegleiterStatus.ACCEPTED,
              },
            });
          } catch (error) {
            // No matching profile (e.g. legacy invite without wizard data) — log and continue.
            logger.error(
              { err: error, userId: user.id },
              "[auth] could not link Schulbegleiter profile",
            );
          }
        },
      },
    },
  },
});
