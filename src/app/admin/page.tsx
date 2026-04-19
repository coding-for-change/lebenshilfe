import { AuthFacade } from "@/features/auth/facade";
import { UserFacade } from "@/features/users/facade";
import { InvitationFacade } from "@/features/invitations/facade";
import { AdminDashboardClient } from "./client-page";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  // Enforces that the user is an ADMIN, throws otherwise
  await AuthFacade.requireAdmin();

  // Fetch users securely inside server component
  const schoolAssistants = await UserFacade.getSchoolAssistants();

  const invitations = await InvitationFacade.getAllInvitations();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Admin-Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verwalte die Schulbegleiter und Einladungen
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Zurück</Button>
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* Pass raw data to a hydrated client component for interactivity (modal, table actions) */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-sm p-6 overflow-hidden">
          <AdminDashboardClient
            initialUsers={schoolAssistants}
            invitations={invitations}
          />
        </div>
      </div>
    </div>
  );
}
