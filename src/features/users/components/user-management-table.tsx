"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageSection } from "@/components/page-section";
import { SearchableTable } from "@/components/searchable-table";
import { Role } from "@/generated/prisma";
import { InviteAdminDialog } from "./invite-admin-dialog";
import { RoleBadge } from "./role-badge";
import { UserRowActions, type UserRowSubject } from "./user-row-actions";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string; // ISO
};

export type AdminInvitationRow = {
  id: string;
  email: string;
  role: Role;
  createdAt: string; // ISO
};

type CombinedRow =
  | { kind: "user"; key: string; data: AdminUserRow }
  | { kind: "invitation"; key: string; data: AdminInvitationRow };

type Props = {
  users: AdminUserRow[];
  invitations: AdminInvitationRow[];
  ownerCount: number;
  currentUser: { id: string; role: Role };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NameCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {initials(name)}
      </div>
      <div className="grid leading-tight">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{email}</span>
      </div>
    </div>
  );
}

export function UserManagementTable({
  users,
  invitations,
  ownerCount,
  currentUser,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const rows = useMemo<CombinedRow[]>(
    () => [
      ...users.map<CombinedRow>((u) => ({
        kind: "user",
        key: `u-${u.id}`,
        data: u,
      })),
      ...invitations.map<CombinedRow>((i) => ({
        kind: "invitation",
        key: `i-${i.id}`,
        data: i,
      })),
    ],
    [users, invitations],
  );

  return (
    <>
      <PageSection
        title="Benutzerverwaltung"
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus />
            Neuen Admin einladen
          </Button>
        }
      >
        <div className="p-4">
          <SearchableTable<CombinedRow>
            rows={rows}
            placeholder="Nach Name, E-Mail oder Rolle suchen…"
            filterBy={(row, q) => {
              if (row.kind === "user") {
                return (
                  row.data.name.toLowerCase().includes(q) ||
                  row.data.email.toLowerCase().includes(q) ||
                  row.data.role.toLowerCase().includes(q)
                );
              }
              return (
                row.data.email.toLowerCase().includes(q) ||
                row.data.role.toLowerCase().includes(q) ||
                "eingeladen".includes(q)
              );
            }}
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine Admins oder Einladungen gefunden.
              </div>
            }
          >
            {(filtered) => (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Hinzugefügt</TableHead>
                    <TableHead className="w-12 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const subject: UserRowSubject =
                      row.kind === "user"
                        ? {
                            kind: "user",
                            id: row.data.id,
                            name: row.data.name,
                            email: row.data.email,
                            role: row.data.role,
                          }
                        : {
                            kind: "invitation",
                            id: row.data.id,
                            email: row.data.email,
                            role: row.data.role,
                          };

                    const isSelf =
                      row.kind === "user" && row.data.id === currentUser.id;

                    return (
                      <TableRow key={row.key}>
                        <TableCell>
                          {row.kind === "user" ? (
                            <NameCell
                              name={
                                isSelf ? `${row.data.name} (du)` : row.data.name
                              }
                              email={row.data.email}
                            />
                          ) : (
                            <NameCell
                              name="Ausstehende Einladung"
                              email={row.data.email}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {row.kind === "user" ? (
                            <RoleBadge
                              variant={
                                row.data.role === Role.OWNER ? "OWNER" : "ADMIN"
                              }
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <RoleBadge variant="PENDING" />
                              <RoleBadge
                                variant={
                                  row.data.role === Role.OWNER
                                    ? "OWNER"
                                    : "ADMIN"
                                }
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(row.data.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <UserRowActions
                            subject={subject}
                            currentUser={currentUser}
                            ownerCount={ownerCount}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </SearchableTable>
        </div>
      </PageSection>

      <InviteAdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        currentUserRole={currentUser.role}
      />
    </>
  );
}
