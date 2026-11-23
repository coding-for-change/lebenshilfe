import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createElement } from "react";
import { prisma } from "./prisma";
import { Role, SchulbegleiterStatus } from "@/generated/prisma";
import { sendMail } from "./mail";
import { renderEmail } from "./email/render";
import { ResetPasswordEmail } from "./email/templates/reset-password-email";
import { logger } from "@/lib/logger";
import { haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { INVITE_TOKEN_HEADER } from "./invite-token";

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
      issuer: "Lebenshilfe München",
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
      "/forget-password": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // Invalidate all existing sessions on password reset, so resetting a
    // compromised account actually logs out an attacker holding a live session.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ url, user }) => {
      const { html, text } = await renderEmail(
        createElement(ResetPasswordEmail, { resetUrl: url }),
      );
      await sendMail({
        to: user.email,
        subject: "Passwort zurücksetzen – Lebenshilfe München",
        html,
        text,
      });
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
  },
  databaseHooks: {
    user: {
      create: {
        // Registration requires the invitation whose link was opened: it must
        // exist, be unused, not be expired or withdrawn, and belong to this
        // email. The role is taken from exactly that invitation.
        before: async (user, ctx) => {
          const token = inviteTokenOf(ctx);
          const invite = token
            ? await prisma.invitation.findUnique({ where: { token } })
            : null;
          if (
            !invite ||
            invite.isUsed ||
            invite.expiresAt <= new Date() ||
            invite.email.toLowerCase() !== user.email.toLowerCase()
          ) {
            throw new APIError("FORBIDDEN", {
              message:
                "Diese Einladung ist nicht mehr gültig. Bitte öffne den Link aus der neuesten Einladungs-E-Mail.",
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
