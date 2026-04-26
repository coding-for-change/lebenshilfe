import { WorkshopsFacade, WorkshopsTable } from "@/features/workshops";

export default async function WorkshopsPage() {
  const workshops = await WorkshopsFacade.list();
  return <WorkshopsTable workshops={workshops} />;
}
