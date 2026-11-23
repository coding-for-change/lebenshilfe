import { requireAdmin } from "@/lib/auth-guards";
import { Suspense } from "react";
import { PoolsFacade, PoolsTable, serializePool } from "@/features/pools";
import { ChildrenFacade } from "@/features/children";
import { CostBearersFacade } from "@/features/cost-bearers";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { SchoolsFacade } from "@/features/schools";

export default async function PoolsPage() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  const [pools, schools, costBearers, children, assistants] = await Promise.all(
    [
      PoolsFacade.list(),
      SchoolsFacade.list(),
      CostBearersFacade.list(),
      ChildrenFacade.list(),
      SchoolAssistantsFacade.list(),
    ],
  );

  return (
    <Suspense>
      <PoolsTable
        data={pools.map(serializePool)}
        schoolOptions={schools.map((s) => ({ id: s.id, name: s.name }))}
        costBearerOptions={costBearers.map((k) => ({ id: k.id, name: k.name }))}
        childOptions={children.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          schoolId: c.schoolId,
        }))}
        assistantOptions={assistants.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
        }))}
      />
    </Suspense>
  );
}
