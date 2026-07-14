import {
  ChildrenFacade,
  ChildrenTable,
  serializeChild,
} from "@/features/children";
import { CostBearersFacade } from "@/features/cost-bearers";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { SchoolsFacade } from "@/features/schools";

export default async function ChildrenPage() {
  const [children, costBearers, schoolAssistants, schools] = await Promise.all([
    ChildrenFacade.list(),
    CostBearersFacade.list(),
    SchoolAssistantsFacade.list(),
    SchoolsFacade.list(),
  ]);

  return (
    <ChildrenTable
      data={children.map(serializeChild)}
      costBearerOptions={costBearers.map((k) => ({
        id: k.id,
        name: k.name,
      }))}
      schoolAssistantOptions={schoolAssistants.map((p) => ({
        id: p.id,
        name: p.name,
      }))}
      schoolOptions={schools.map((s) => ({ id: s.id, name: s.name }))}
    />
  );
}
