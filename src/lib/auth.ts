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
    enabled: true,
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
        before: async (user) => {
          const invite = await prisma.invitation.findFirst({
            where: { email: user.email, isUsed: false },
          });
          if (!invite) {
            throw new Error(
              "Registration strictly requires an active invitation",
            );
          }
          return {
            data: {
              ...user,
              role: invite.role,
            },
          };
        },
        after: async (user) => {
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
