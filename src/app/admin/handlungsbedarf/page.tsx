import { requireAdmin } from "@/lib/auth-guards";
import { VertretungRequestsFacade } from "@/features/vertretung-requests";
import { ChildrenFacade } from "@/features/children";
import { SchoolAssistantsFacade } from "@/features/school-assistants";
import { HandlungsbedarfFacade } from "@/features/handlungsbedarf";
import { PendingRequestsTable } from "@/features/vertretung-requests/components/pending-requests-table";
import { PendingIndirectRequestsTable } from "@/features/vertretung-requests/components/pending-indirect-requests-table";
import { SickFlagsList } from "@/features/handlungsbedarf/components/sick-flags-list";
import { OtherFlagsList } from "@/features/handlungsbedarf/components/other-flags-list";
import { PageSection } from "@/components/page-section";

const WINDOW_DAYS = 7;

export default async function HandlungsbedarfPage() {
  await requireAdmin();

  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = new Date(from.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [
    rawRequests,
    rawIndirectRequests,
    children,
    schoolAssistants,
    krankheitFlags,
    otherFlags,
  ] = await Promise.all([
    VertretungRequestsFacade.listPending(),
    VertretungRequestsFacade.listPendingIndirect(),
    ChildrenFacade.list(),
    SchoolAssistantsFacade.list(),
    HandlungsbedarfFacade.listKrankheitFlags({ from, to }),
    HandlungsbedarfFacade.listOtherFlags({ from, to }),
  ]);

  const requests = rawRequests.map((r) => ({
    id: r.id,
    childNameText: r.childNameText,
    date: r.date.toISOString().slice(0, 10),
    startTime: r.startTime,
    endTime: r.endTime,
    substituteUser: r.substituteUser,
  }));

  const indirectRequests = rawIndirectRequests.map((r) => ({
    id: r.id,
    childNameText: r.childNameText,
    date: r.date.toISOString().slice(0, 10),
    startTime: r.startTime,
    endTime: r.endTime,
    note: r.note,
    substituteUser: r.substituteUser,
  }));

  const childOptions = children.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
  }));

  // Vertretung is keyed by SchoolAssistantProfile, so the substitute picker
  // offers profile ids (every assistant, incl. not-yet-accepted ones).
  const schoolAssistantOptions = schoolAssistants.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  // Narrow the facade's ProblemFlag[] back to each list's expected subset.
  // The facade promises only krankheit kinds in listKrankheitFlags and only
  // weitere kinds in listOtherFlags, but the return type is the full union.
  const krankheit = krankheitFlags.filter(
    (
      f,
    ): f is Extract<
      typeof f,
      {
        kind:
          | "SB_SICK_NO_SUBSTITUTE"
          | "CHILD_ABSENT_BUT_WORK_BOOKED"
          | "CHILD_ABSENT_INFO"
          | "SUBSTITUTE_ALSO_SICK";
      }
    > =>
      f.kind === "SB_SICK_NO_SUBSTITUTE" ||
      f.kind === "CHILD_ABSENT_BUT_WORK_BOOKED" ||
      f.kind === "CHILD_ABSENT_INFO" ||
      f.kind === "SUBSTITUTE_ALSO_SICK",
  );
  const weitere = otherFlags.filter(
    (
      f,
    ): f is Extract<
      typeof f,
      {
        kind:
          | "SCHEDULE_BLOCK_UNASSIGNED"
          | "BOOKED_HOURS_OVER_SCHEDULE"
          | "MISSING_SCHWEIGEPFLICHT";
      }
    > =>
      f.kind === "SCHEDULE_BLOCK_UNASSIGNED" ||
      f.kind === "BOOKED_HOURS_OVER_SCHEDULE" ||
      f.kind === "MISSING_SCHWEIGEPFLICHT",
  );

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Handlungsbedarf</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Übersicht über problematische Fälle der nächsten 7 Tage.
        </p>
      </div>

      <PageSection title={`Krankheitsfälle (${krankheit.length})`}>
        <SickFlagsList
          flags={krankheit}
          schoolAssistantOptions={schoolAssistantOptions}
        />
      </PageSection>

      <PageSection title={`Weitere Fälle (${weitere.length})`}>
        <OtherFlagsList flags={weitere} />
      </PageSection>

      <PageSection title={`Vertretungs-Anträge (${requests.length})`}>
        <PendingRequestsTable
          requests={requests}
          childOptions={childOptions}
        />
      </PageSection>

      <PageSection title={`Indirekte Leistungen (${indirectRequests.length})`}>
        <PendingIndirectRequestsTable
          requests={indirectRequests}
          childOptions={childOptions}
        />
      </PageSection>
    </div>
  );
}
