import { Heading, Section, Text } from "@react-email/components";
import { Role } from "@/generated/prisma";
import { BrandButton } from "@/lib/email/components/button";
import { BrandLayout } from "@/lib/email/components/layout";
import { branding } from "@/lib/branding";
import {
  emailCallout,
  emailCtaWrap,
  emailHeading,
  emailLink,
  emailMeta,
  emailParagraph,
} from "@/lib/email/components/typography";

type Props = {
  inviteUrl: string;
  role: Role;
  /** True when this invitation closed an earlier, still open one (a resend). */
  replacesEarlier: boolean;
};

// What the invitation is for, in the words the app itself uses (the role badges
// say "Admin" and "Hauptadmin"). Admins must not be told they were invited as
// Schulbegleiter.
const ROLE_COPY: Record<Role, { invitedAs: string; youWill: string }> = {
  SCHOOL_ASSISTANT: {
    invitedAs: "als Schulbegleiter",
    youWill:
      "Über Ihren persönlichen Zugang verwalten Sie zukünftig Ihre Stundennachweise und alle organisatorischen Abläufe.",
  },
  ADMIN: {
    invitedAs: "als Admin",
    youWill:
      "Als Admin verwalten Sie Schulbegleiter, Kinder, Schulen und Stundennachweise.",
  },
  OWNER: {
    invitedAs: "als Hauptadmin",
    youWill:
      "Als Hauptadmin verwalten Sie Schulbegleiter, Kinder, Schulen und Stundennachweise sowie die Admins des Portals.",
  },
};

export function InvitationEmail({ inviteUrl, role, replacesEarlier }: Props) {
  const copy = ROLE_COPY[role];
  const needsTwoFactor = role !== Role.SCHOOL_ASSISTANT;

  return (
    <BrandLayout
      preview={`Willkommen bei der ${branding.name} – richten Sie Ihr Profil ein`}
    >
      <Heading style={emailHeading}>Willkommen bei der {branding.name}</Heading>
      <Text style={emailParagraph}>
        Sie wurden {copy.invitedAs} eingeladen, dem Portal der {branding.name}{" "}
        beizutreten. {copy.youWill}
      </Text>
      <Text style={emailParagraph}>
        Klicken Sie auf den folgenden Button, um Ihr Profil einzurichten und Ihr
        Passwort festzulegen.
      </Text>
      {needsTwoFactor && (
        <Text style={emailParagraph}>
          Bei der ersten Anmeldung richten Sie zusätzlich eine
          Zwei-Faktor-Anmeldung ein. Halten Sie dafür eine Authenticator-App auf
          Ihrem Smartphone bereit (z. B. Microsoft Authenticator oder Google
          Authenticator).
        </Text>
      )}
      <Section style={emailCtaWrap}>
        <BrandButton href={inviteUrl}>Profil einrichten</BrandButton>
      </Section>
      {replacesEarlier && (
        <Text style={emailCallout}>
          Diese Einladung ersetzt frühere Einladungen – ältere Links
          funktionieren nicht mehr.
        </Text>
      )}
      <Text style={emailMeta}>
        Falls der Button nicht funktioniert, kopieren Sie den folgenden Link in
        Ihren Browser:
      </Text>
      <Text style={emailLink}>{inviteUrl}</Text>
      <Text style={emailMeta}>
        Die Einladung ist 7 Tage gültig. Wenn Sie diese E-Mail unerwartet
        erhalten haben, können Sie sie ignorieren.
      </Text>
    </BrandLayout>
  );
}
