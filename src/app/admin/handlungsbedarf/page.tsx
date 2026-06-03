import { ChildrenFacade, HandlungsbedarfDashboard } from "@/features/children";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import {
  VertretungQueue,
  VertretungRequestsFacade,
} from "@/features/vertretung-requests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseIsoDate, startOfWeekUtc, todayIsoBerlin } from "@/lib/dates";
import { formatIsoDateUtc } from "@/lib/utils";

export default async function HandlungsbedarfPage() {
  // Default to the current ISO week (Monday), evaluated in Europe/Berlin so the
  // server doesn't drift onto the wrong week late in the evening.
  const weekStartIso = formatIsoDateUtc(
    startOfWeekUtc(parseIsoDate(todayIsoBerlin())),
  );

  const [result, schoolAssistants, pendingRequests, children] =
    await Promise.all([
      ChildrenFacade.getHandlungsbedarf(weekStartIso),
      SchoolAssistantsFacade.list(),
      VertretungRequestsFacade.listPending(),
      ChildrenFacade.list(),
    ]);

  // Roster for the admin's child picker — admin-only, never sent to the
  // reporting Schulbegleiter (Datenschutz). Map to plain fields so no Prisma
  // Decimal/relation reaches the client component.
  const childOptions = children.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
  }));

  return (
    <div className="space-y-6">
      <HandlungsbedarfDashboard
        initialResult={result}
        initialWeekStartIso={weekStartIso}
        schoolAssistantOptions={schoolAssistants
          .filter((p) => !!p.userId)
          .map((p) => ({ id: p.userId as string, name: p.name }))}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Zuzuordnen{" "}
            <span className="text-muted-foreground">
              ({pendingRequests.length})
            </span>
          </CardTitle>
          <CardDescription>
            Von Schulbegleitern gemeldete Vertretungen mit Freitext-Kind. Das
            korrekte Kind zuordnen, um den Eintrag zu bestätigen — erst danach
            zählt er zur Abrechnung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VertretungQueue
            requests={pendingRequests}
            childOptions={childOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
