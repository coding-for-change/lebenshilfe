import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth-guards";
import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const adminUser = await requireAdmin();

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
