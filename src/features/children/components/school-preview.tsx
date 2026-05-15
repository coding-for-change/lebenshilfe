"use client";

type Props = {
  placeId: string | null;
  address: string | null;
};

export function SchoolPreview({ placeId, address }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!placeId && !address) return null;

  if (!apiKey) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Karte ausgeblendet (Google Maps API Key nicht konfiguriert).
      </div>
    );
  }

  const src = placeId
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
        address ?? "",
      )}`;

  return (
    <div className="overflow-hidden rounded-md border">
      <iframe
        title="Schule auf Google Maps"
        src={src}
        className="block h-48 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
