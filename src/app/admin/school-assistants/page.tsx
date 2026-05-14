import {
  SchoolAssistantsFacade,
  SchoolAssistantsTable,
  serializeProfile,
} from "@/features/school-assistants";
import { WorkshopsFacade } from "@/features/workshops";

export default async function SchulbegleiterPage() {
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
