import { requireAdmin } from "@/lib/auth-guards";
import {
  ChildrenFacade,
  ChildrenTable,
  serializeChild,
} from "@/features/children";
import { CostBearersFacade } from "@/features/cost-bearers";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { SchoolsFacade } from "@/features/schools";

export default async function ChildrenPage() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

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
