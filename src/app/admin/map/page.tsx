import { todayIsoBerlin } from "@/lib/dates";
import { MapView } from "./_components/map-view";
import { getMapDataForDate } from "./actions";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const initialDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayIsoBerlin();
  const initialData = await getMapDataForDate(initialDate);
  return (
    <MapView
      initialData={initialData}
      initialDate={initialDate}
    />
  );
}
