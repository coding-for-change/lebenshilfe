import {
  ChildrenFacade,
  ChildrenTable,
  serializeChild,
} from "@/features/children";
import { CostBearersFacade } from "@/features/cost-bearers";
import { SchoolAssistantsFacade } from "@/features/school-assistants";

export default async function ChildrenPage() {
  const [children, costBearers, schoolAssistants] = await Promise.all([
    ChildrenFacade.list(),
    CostBearersFacade.list(),
    SchoolAssistantsFacade.list(),
  ]);

  return (
    <ChildrenTable
      data={children.map(serializeChild)}
      costBearerOptions={costBearers.map((k) => ({
        id: k.id,
        name: k.name,
      }))}
      schoolAssistantOptions={schoolAssistants
        .filter((p) => !!p.userId)
        .map((p) => ({ id: p.userId as string, name: p.name }))}
    />
  );
}
