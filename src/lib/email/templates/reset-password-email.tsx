import { Heading, Section, Text } from "@react-email/components";
import { BrandButton } from "@/lib/email/components/button";
import { BrandLayout } from "@/lib/email/components/layout";
import {
  emailCallout,
  emailCtaWrap,
  emailHeading,
  emailLink,
  emailMeta,
  emailParagraph,
} from "@/lib/email/components/typography";

type Props = {
  resetUrl: string;
};

export function ResetPasswordEmail({ resetUrl }: Props) {
  return (
    <BrandLayout preview="Setzen Sie Ihr Passwort für das Portal der Lebenshilfe München zurück">
      <Heading style={emailHeading}>Passwort zurücksetzen</Heading>
      <Text style={emailParagraph}>
        Sie haben angefragt, Ihr Passwort für das Portal der Lebenshilfe München
        zurückzusetzen. Klicken Sie auf den folgenden Button, um ein neues
        Passwort festzulegen.
      </Text>
      <Section style={emailCtaWrap}>
        <BrandButton href={resetUrl}>Neues Passwort festlegen</BrandButton>
      </Section>
      <Text style={emailMeta}>
        Falls der Button nicht funktioniert, kopieren Sie den folgenden Link in
        Ihren Browser:
      </Text>
      <Text style={emailLink}>{resetUrl}</Text>
      <Text style={emailCallout}>
        Aus Sicherheitsgründen ist dieser Link nur 1 Stunde gültig.
      </Text>
      <Text style={emailMeta}>
        Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail
        ignorieren – Ihr Passwort bleibt unverändert.
      </Text>
    </BrandLayout>
  );
}
