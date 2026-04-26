import {
  SchulbegleiterFacade,
  SchulbegleiterTable,
} from "@/features/schulbegleiter";
import { serializeProfile } from "@/features/schulbegleiter/components/serialize";
import { WorkshopsFacade } from "@/features/workshops";

export default async function SchulbegleiterPage() {
  const [profiles, workshops] = await Promise.all([
    SchulbegleiterFacade.list(),
    WorkshopsFacade.list(),
  ]);

  return (
    <SchulbegleiterTable
      profiles={profiles.map(serializeProfile)}
      workshops={workshops.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
      }))}
    />
  );
}
