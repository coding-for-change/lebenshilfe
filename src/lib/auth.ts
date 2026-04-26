import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { transporter } from "./mail";
import { Role, SchulbegleiterStatus } from "@/generated/prisma";
import { sendMail } from "./mail";

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
      await sendMail({
        to: user.email,
        subject: "Passwort zurücksetzen – Lebenshilfe",
        text: `Hallo,\n\ndu hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.\n\nKlicke auf den folgenden Link, um dein neues Passwort festzulegen:\n${url}\n\nDer Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.\n\nDein Lebenshilfe-Team`,
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
