import { Heading, Section, Text } from "@react-email/components";
import { BrandButton } from "@/lib/email/components/button";
import { BrandLayout } from "@/lib/email/components/layout";
import {
  emailCtaWrap,
  emailHeading,
  emailLink,
  emailMeta,
  emailParagraph,
} from "@/lib/email/components/typography";

type Props = {
  inviteUrl: string;
};

export function InvitationEmail({ inviteUrl }: Props) {
  return (
    <BrandLayout preview="Willkommen bei der Lebenshilfe München – richten Sie Ihr Profil ein">
      <Heading style={emailHeading}>
        Willkommen bei der Lebenshilfe München
      </Heading>
      <Text style={emailParagraph}>
        Sie wurden als Schulbegleiter eingeladen, dem Portal der Lebenshilfe
        München beizutreten. Über Ihren persönlichen Zugang verwalten Sie
        zukünftig Ihre Stundennachweise und alle organisatorischen Abläufe.
      </Text>
      <Text style={emailParagraph}>
        Klicken Sie auf den folgenden Button, um Ihr Profil einzurichten und Ihr
        Passwort festzulegen.
      </Text>
      <Section style={emailCtaWrap}>
        <BrandButton href={inviteUrl}>Profil einrichten</BrandButton>
      </Section>
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
