"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapSchool } from "../types";
import { MapHoverCard } from "./map-hover-card";

type Props = {
  map: google.maps.Map;
  schools: MapSchool[];
  activeKey: string | null;
  onActiveChange: (key: string | null) => void;
};

type MarkerEntry = {
  marker: google.maps.marker.AdvancedMarkerElement;
  cleanup: () => void;
};

export function MapMarkers({ map, schools, activeKey, onActiveChange }: Props) {
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoContentRef = useRef<HTMLDivElement | null>(null);
  const infoRootRef = useRef<Root | null>(null);
  const onActiveChangeRef = useRef(onActiveChange);

  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    const div = document.createElement("div");
    infoContentRef.current = div;
    infoRootRef.current = createRoot(div);
    infoWindowRef.current = new google.maps.InfoWindow({ content: div });
    const closeListener = infoWindowRef.current.addListener(
      "closeclick",
      () => {
        onActiveChangeRef.current(null);
      },
    );
    return () => {
      closeListener.remove();
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      const root = infoRootRef.current;
      infoRootRef.current = null;
      queueMicrotask(() => root?.unmount());
    };
  }, []);

  useEffect(() => {
    const current = markersRef.current;
    const nextKeys = new Set(schools.map((s) => s.key));

    for (const [key, entry] of current) {
      if (!nextKeys.has(key)) {
        entry.cleanup();
        entry.marker.map = null;
        current.delete(key);
      }
    }

    for (const school of schools) {
      const existing = current.get(school.key);
      if (existing) {
        existing.marker.position = { lat: school.lat, lng: school.lng };
        continue;
      }
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: school.lat, lng: school.lng },
        title: school.name,
      });
      const handleEnter = () => onActiveChangeRef.current(school.key);
      const handleLeave = () => onActiveChangeRef.current(null);
      const handleClick = () => onActiveChangeRef.current(school.key);
      marker.addEventListener("mouseenter", handleEnter);
      marker.addEventListener("mouseleave", handleLeave);
      const clickListener = marker.addListener("gmp-click", handleClick);
      const cleanup = () => {
        marker.removeEventListener("mouseenter", handleEnter);
        marker.removeEventListener("mouseleave", handleLeave);
        clickListener.remove();
      };
      current.set(school.key, { marker, cleanup });
    }
  }, [map, schools]);

  useEffect(() => {
    const iw = infoWindowRef.current;
    const root = infoRootRef.current;
    if (!iw || !root) return;
    if (!activeKey) {
      iw.close();
      return;
    }
    const school = schools.find((s) => s.key === activeKey);
    const entry = markersRef.current.get(activeKey);
    if (!school || !entry) return;
    root.render(<MapHoverCard school={school} />);
    iw.open({ map, anchor: entry.marker });
  }, [activeKey, map, schools]);

  useEffect(() => {
    const current = markersRef.current;
    return () => {
      for (const entry of current.values()) {
        entry.cleanup();
        entry.marker.map = null;
      }
      current.clear();
    };
  }, []);

  return null;
}
