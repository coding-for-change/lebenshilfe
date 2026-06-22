import { requireAdmin } from "@/lib/auth-guards";
import { VertretungRequestsFacade } from "@/features/vertretung-requests";
import { ChildrenFacade } from "@/features/children";
import { PendingRequestsTable } from "@/features/vertretung-requests/components/pending-requests-table";
import { PageSection } from "@/components/page-section";

export default async function HandlungsbedarfPage() {
  await requireAdmin();

  const [rawRequests, children] = await Promise.all([
    VertretungRequestsFacade.listPending(),
    ChildrenFacade.list(),
  ]);

  const requests = rawRequests.map((r) => ({
    id: r.id,
    childNameText: r.childNameText,
    date: r.date.toISOString().slice(0, 10),
    startTime: r.startTime,
    endTime: r.endTime,
    substituteUser: r.substituteUser,
  }));

  const childOptions = children.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
  }));

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Handlungsbedarf</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vertretungs-Anträge, die noch einem Kind zugeordnet werden müssen.
        </p>
      </div>

      <PageSection title={`Zuzuordnen (${requests.length})`}>
        <PendingRequestsTable
          requests={requests}
          childOptions={childOptions}
        />
      </PageSection>
    </div>
  );
}
