import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createElement } from "react";
import { prisma } from "./prisma";
import { Role, SchulbegleiterStatus } from "@/generated/prisma";
import { sendMail } from "./mail";
import { renderEmail } from "./email/render";
import { ResetPasswordEmail } from "./email/templates/reset-password-email";
import { logger } from "@/lib/logger";
import { haveIBeenPwned } from "better-auth/plugins";

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
  ],
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
              { error, email: user.email },
              "[auth] could not link Schulbegleiter profile",
            );
          }
        },
      },
    },
  },
});
