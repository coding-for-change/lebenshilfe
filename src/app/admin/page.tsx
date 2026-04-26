import { UserFacade } from "@/features/users/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { UsersPanel } from "./_components/users-panel";
import { InvitationsPanel } from "./_components/invitations-panel";

export default async function AdminDashboard() {
  const [schoolAssistants, invitations] = await Promise.all([
    UserFacade.getSchoolAssistants(),
    InvitationFacade.getAllInvitations(),
  ]);

  return (
    <div className="space-y-10">
      <UsersPanel users={schoolAssistants} />
      <InvitationsPanel invitations={invitations} />
    </div>
  );
}
