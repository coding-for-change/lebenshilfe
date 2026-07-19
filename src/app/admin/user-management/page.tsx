import { requireAdmin } from "@/lib/auth-guards";
import { InvitationFacade } from "@/features/invitations/facade";
import { UserFacade, UserManagementTable } from "@/features/users";
import { Role } from "@/generated/prisma";

export default async function UserManagementPage() {
  const currentUser = await requireAdmin();

  const [users, ownerCount, pending] = await Promise.all([
    UserFacade.listAdminUsers(),
    UserFacade.countOwners(),
    InvitationFacade.listPendingByRoles([Role.ADMIN, Role.OWNER]),
  ]);

  // Hide invites that already point to an existing user (e.g. they signed up but the row lingers).
  const userEmails = new Set(users.map((u) => u.email));
  const pendingInvitations = pending
    .filter((i) => !userEmails.has(i.email))
    .map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt.toISOString(),
    }));

  return (
    <UserManagementTable
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        twoFactorEnabled: u.twoFactorEnabled,
        hasTwoFactorRow: u.hasTwoFactorRow,
      }))}
      invitations={pendingInvitations}
      ownerCount={ownerCount}
      currentUser={{
        id: currentUser.id,
        role: currentUser.role as Role,
      }}
    />
  );
}
