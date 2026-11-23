import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InvalidInvitationReason } from "@/use-cases/get-onboarding-state";

// Each message says what to do next instead of just "invalid". The onboarding
// page sends "used" visitors straight to the login; its text here is a fallback.
const MESSAGES: Record<
  InvalidInvitationReason,
  { title: string; description: string }
> = {
  used: {
    title: "Einladung bereits angenommen",
    description:
      "Du hast diese Einladung bereits angenommen. Bitte melde dich mit deinem Konto an.",
  },
  replaced: {
    title: "Neuere Einladung vorhanden",
    description:
      "Dieser Link wurde durch eine neuere Einladung ersetzt. Bitte nutze den Link aus der neuesten Einladungs-E-Mail.",
  },
  revoked: {
    title: "Einladung zurückgezogen",
    description:
      "Diese Einladung wurde zurückgezogen. Wenn du einen Zugang brauchst, wende dich bitte an die Person, die dich eingeladen hat.",
  },
  expired: {
    title: "Einladung abgelaufen",
    description:
      "Einladungslinks sind 7 Tage gültig, dieser ist abgelaufen. Bitte wende dich an die Person, die dich eingeladen hat – sie kann dir mit einem Klick eine neue Einladung schicken.",
  },
  notfound: {
    title: "Einladung nicht gefunden",
    description:
      "Dieser Einladungslink ist ungültig – vielleicht wurde er beim Kopieren abgeschnitten. Bitte öffne den Link direkt aus der neuesten Einladungs-E-Mail.",
  },
  missing: {
    title: "Einladungslink unvollständig",
    description:
      "Diesem Link fehlt der Einladungscode. Bitte öffne den Link direkt aus der Einladungs-E-Mail.",
  },
};

export function InvalidInvitationCard({
  reason,
}: {
  reason: InvalidInvitationReason;
}) {
  const { title, description } = MESSAGES[reason];

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* A way out of every dead end. Signed-in visitors never get here
            (/onboard sends them to their start page), so for everyone who
            does, "/" leads on to the login. */}
        <Button
          asChild
          className="h-11 w-full text-base font-medium"
        >
          <Link href="/">Zur Startseite</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
