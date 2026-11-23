import { requireAdmin } from "@/lib/auth-guards";
import { runAction } from "@/lib/run-action";
import { todayIsoBerlin } from "@/lib/dates";
import { MapsConsentGate } from "@/components/maps-consent-gate";
import { MapView } from "./_components/map-view";
import { getMapDataForDate } from "./actions";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  const params = await searchParams;
  const initialDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayIsoBerlin();
  const initialData = await runAction(getMapDataForDate(initialDate));
  return (
    <MapsConsentGate description="Zum Anzeigen der Einsatz-Karte wird Google Maps geladen; dabei werden Schul-/Adressdaten und Ihre IP-Adresse an Google in die USA übermittelt.">
      <MapView
        initialData={initialData}
        initialDate={initialDate}
      />
    </MapsConsentGate>
  );
}
