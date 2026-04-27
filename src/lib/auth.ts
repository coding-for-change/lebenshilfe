import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createElement } from "react";
import { prisma } from "./prisma";
import { Role, SchulbegleiterStatus } from "@/generated/prisma";
import { sendMail } from "./mail";
import { renderEmail } from "./email/render";
import { ResetPasswordEmail } from "./email/templates/reset-password-email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
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
            console.warn(
              `[auth] could not link Schulbegleiter profile for ${user.email}:`,
              error,
            );
          }
        },
      },
    },
  },
});
