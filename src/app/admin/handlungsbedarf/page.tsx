import { ChildrenFacade, HandlungsbedarfDashboard } from "@/features/children";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { parseIsoDate, startOfWeekUtc, todayIsoBerlin } from "@/lib/dates";
import { formatIsoDateUtc } from "@/lib/utils";

export default async function HandlungsbedarfPage() {
  // Default to the current ISO week (Monday), evaluated in Europe/Berlin so the
  // server doesn't drift onto the wrong week late in the evening.
  const weekStartIso = formatIsoDateUtc(
    startOfWeekUtc(parseIsoDate(todayIsoBerlin())),
  );

  const [result, schoolAssistants] = await Promise.all([
    ChildrenFacade.getHandlungsbedarf(weekStartIso),
    SchoolAssistantsFacade.list(),
  ]);

  return (
    <HandlungsbedarfDashboard
      initialResult={result}
      initialWeekStartIso={weekStartIso}
      schoolAssistantOptions={schoolAssistants
        .filter((p) => !!p.userId)
        .map((p) => ({ id: p.userId as string, name: p.name }))}
    />
  );
}
