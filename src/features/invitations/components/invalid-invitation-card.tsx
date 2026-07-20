import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type InvalidInvitationReason =
  | "used"
  | "expired"
  | "notfound"
  | "missing";

const MESSAGES: Record<
  InvalidInvitationReason,
  { title: string; description: string }
> = {
  used: {
    title: "Einladung bereits angenommen",
    description:
      "Diese Einladung wurde bereits angenommen. Bitte melde dich mit deinem Konto an.",
  },
  expired: {
    title: "Einladung ungültig",
    description: "Dieser Einladungslink ist ungültig oder abgelaufen.",
  },
  notfound: {
    title: "Einladung ungültig",
    description: "Dieser Einladungslink ist ungültig oder abgelaufen.",
  },
  missing: {
    title: "Einladung ungültig",
    description: "Dieser Einladungslink ist ungültig oder abgelaufen.",
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
        <CardTitle className="text-xl font-semibold text-destructive">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          className="h-11 w-full text-base font-medium"
        >
          <Link href="/">Zurück zur Startseite</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
