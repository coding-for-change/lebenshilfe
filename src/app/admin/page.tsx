import { AuthFacade } from "@/features/auth/facade";
import { UserFacade } from "@/features/users/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { AdminApp } from "./admin-shell";

export default async function AdminDashboard() {
  const adminUser = await AuthFacade.requireAdmin();
  const schoolAssistants = await UserFacade.getSchoolAssistants();
  const invitations = await InvitationFacade.getAllInvitations();

  return (
    <AdminApp
      currentUser={{
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
      }}
      schoolAssistants={schoolAssistants}
      invitations={invitations}
    />
  );
}
