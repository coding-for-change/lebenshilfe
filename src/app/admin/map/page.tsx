import { todayIsoBerlin } from "@/lib/dates";
import { MapsConsentGate } from "@/components/maps-consent-gate";
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
    <MapsConsentGate description="Zum Anzeigen der Einsatz-Karte wird Google Maps geladen; dabei werden Schul-/Adressdaten und Ihre IP-Adresse an Google in die USA übermittelt.">
      <MapView
        initialData={initialData}
        initialDate={initialDate}
      />
    </MapsConsentGate>
  );
}
