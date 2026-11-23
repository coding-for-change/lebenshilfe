import { requireAdmin } from "@/lib/auth-guards";
import {
  SchoolAssistantsFacade,
  SchoolAssistantsTable,
  serializeProfile,
} from "@/features/school-assistants";
import { WorkshopsFacade } from "@/features/workshops";

export default async function SchulbegleiterPage() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  const [profiles, workshops] = await Promise.all([
    SchoolAssistantsFacade.list(),
    WorkshopsFacade.list(),
  ]);

  return (
    <SchoolAssistantsTable
      profiles={profiles.map(serializeProfile)}
      workshops={workshops.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
      }))}
    />
  );
}
