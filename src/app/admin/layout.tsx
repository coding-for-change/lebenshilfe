import type { ReactNode } from "react";
import { AuthFacade } from "@/features/auth/facade";
import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const adminUser = await AuthFacade.requireAdmin();

  return (
    <AdminShell
      currentUser={{
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
      }}
    >
      {children}
    </AdminShell>
  );
}
