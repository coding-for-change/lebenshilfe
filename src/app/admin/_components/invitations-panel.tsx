import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageSection } from "@/components/page-section";

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  isUsed: boolean;
  createdAt: Date;
};

export function InvitationsPanel({
  invitations,
}: {
  invitations: InvitationItem[];
}) {
  return (
    <PageSection title="Alle Einladungen">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>E-Mail</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-6 text-center text-muted-foreground"
              >
                Noch keine Einladungen verschickt.
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.email}</TableCell>
                <TableCell>
                  {inv.role === "ADMIN" ? "Admin" : "Schulbegleiter"}
                </TableCell>
                <TableCell>
                  {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="text-right">
                  {inv.isUsed ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Angenommen
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Ausstehend
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </PageSection>
  );
}
