import { AuthFacade } from "@/features/auth/facade";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma";
import { LogoutButton } from "@/components/logout-button";

export default async function LandingPage() {
  const session = await AuthFacade.getSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-border shadow-xl rounded-2xl p-8 text-center space-y-6">
          <h1 className="text-3xl font-bold text-primary">
            Willkommen bei Lebenshilfe
          </h1>
          <p className="text-muted-foreground">
            Dieses Portal ist ausschließlich für geladene Mitglieder zugänglich.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button className="w-full h-12 text-lg">Zum Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Hallo, {user.name || "Mitglied"}!
            </h1>
            <p className="text-muted-foreground">Eingeloggt als {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {user.role === Role.ADMIN && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Admin-Bereich öffnen
                </Button>
              </Link>
            )}
            <LogoutButton />
          </div>
        </header>

        <section className="bg-white dark:bg-zinc-900 border border-border p-8 rounded-2xl shadow-sm min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Übersicht</h2>
          <p className="text-muted-foreground">
            Hier entsteht in Kürze dein persönliches Dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
