import { requireAdmin } from "@/lib/auth-guards";
import { WorkshopsFacade, WorkshopsTable } from "@/features/workshops";

export default async function WorkshopsPage() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  const workshops = await WorkshopsFacade.list();
  return <WorkshopsTable workshops={workshops} />;
}
