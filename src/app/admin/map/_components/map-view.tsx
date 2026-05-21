"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loadMapsLibrary } from "@/lib/maps/maps-loader";
import { getMapDataForDate } from "../actions";
import type { MapPayload, MapSchool } from "../types";
import { MapMarkers } from "./map-markers";
import { MapSearchOverlay } from "./map-search-overlay";
import { MapDateOverlay } from "./map-date-overlay";

const MUNICH_CENTER = { lat: 48.1351, lng: 11.582 } as const;
const FALLBACK_ZOOM = 11;
const SINGLE_SCHOOL_ZOOM = 14;
const SEARCH_ZOOM = 15;

// AdvancedMarkerElement requires a Map ID. With a Map ID set, inline `styles`
// are ignored — POI/transit hiding must be configured via cloud-based map
// styling on the corresponding Map ID. `DEMO_MAP_ID` is Google's public
// fallback that enables advanced markers without custom styling.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function fitToSchools(map: google.maps.Map, schools: MapSchool[]): void {
  if (schools.length === 0) {
    map.setCenter(MUNICH_CENTER);
    map.setZoom(FALLBACK_ZOOM);
    return;
  }
  if (schools.length === 1) {
    const only = schools[0];
    map.setCenter({ lat: only.lat, lng: only.lng });
    map.setZoom(SINGLE_SCHOOL_ZOOM);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  for (const s of schools) bounds.extend({ lat: s.lat, lng: s.lng });
  map.fitBounds(bounds, 80);
}

export function MapView({
  initialData,
  initialDate,
}: {
  initialData: MapPayload;
  initialDate: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [data, setData] = useState<MapPayload>(initialData);
  const [date, setDate] = useState(initialDate);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const initialFitRef = useRef(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMapsLibrary("maps"), loadMapsLibrary("marker")])
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const created = new google.maps.Map(containerRef.current, {
          center: MUNICH_CENTER,
          zoom: FALLBACK_ZOOM,
          mapId: MAP_ID,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        setMap(created);
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!map || initialFitRef.current) return;
    fitToSchools(map, data.schools);
    initialFitRef.current = true;
  }, [map, data.schools]);

  function handleDateChange(next: string) {
    if (!next || next === date) return;
    setDate(next);
    setActiveKey(null);
    startTransition(async () => {
      try {
        const fresh = await getMapDataForDate(next);
        setData(fresh);
      } catch {}
      router.replace(`/admin/map?date=${next}`, { scroll: false });
    });
  }

  function handleSelectSchool(key: string) {
    if (!map) return;
    const school = data.schools.find((s) => s.key === key);
    if (!school) return;
    map.panTo({ lat: school.lat, lng: school.lng });
    const currentZoom = map.getZoom();
    if (currentZoom == null || currentZoom < SEARCH_ZOOM) {
      map.setZoom(SEARCH_ZOOM);
    }
    setActiveKey(key);
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
      />
      {map ? (
        <MapMarkers
          map={map}
          schools={data.schools}
          activeKey={activeKey}
          onActiveChange={setActiveKey}
        />
      ) : null}
      <MapSearchOverlay
        schools={data.schools}
        onSelect={handleSelectSchool}
      />
      <MapDateOverlay
        value={date}
        onChange={handleDateChange}
        loading={pending}
      />
    </div>
  );
}
