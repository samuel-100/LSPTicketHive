"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapEvent {
  id: string;
  title: string;
  venue?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

// A few well-known cities are kept for instant centering without a network call.
const CITY_COORDS: Record<string, [number, number]> = {
  dublin: [53.3498, -6.2603],
  london: [51.5074, -0.1278],
  belfast: [54.5973, -5.9301],
  lagos: [6.5244, 3.3792],
  accra: [5.6037, -0.187],
  "new york": [40.7128, -74.006],
  paris: [48.8566, 2.3522],
  berlin: [52.52, 13.405],
  barcelona: [41.3874, 2.1686],
};

const DEFAULT_CENTER: [number, number] = [53.3498, -6.2603];

// Resolve any city name in the world to coordinates via Photon (OpenStreetMap).
async function geocodeCity(name: string): Promise<[number, number] | null> {
  const key = name.trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(name)}&limit=1&layer=city`);
    const data = await res.json();
    const f = data.features?.[0];
    if (f?.geometry?.coordinates) {
      const [lng, lat] = f.geometry.coordinates;
      return [lat, lng];
    }
  } catch {}
  return null;
}

export default function EventMap({ events, city }: { events: MapEvent[]; city?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Recenter whenever the searched city changes — geocoding any place worldwide.
  useEffect(() => {
    let cancelled = false;
    if (!city) { setCenter(DEFAULT_CENTER); return; }
    geocodeCity(city).then((coords) => {
      if (!cancelled && coords) setCenter(coords);
    });
    return () => { cancelled = true; };
  }, [city]);

  // Create the map once.
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Pan/zoom the existing map when the center changes.
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setView(center, 12);
  }, [center]);

  // Draw markers for the events near the current center.
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    const layer = L.layerGroup().addTo(map);

    events.forEach((event) => {
      // Use the event's own coords if present, else scatter around the map center.
      const base: [number, number] =
        event.lat != null && event.lng != null
          ? [event.lat, event.lng]
          : [center[0] + (Math.random() - 0.5) * 0.02, center[1] + (Math.random() - 0.5) * 0.02];

      const marker = L.circleMarker(base, {
        radius: 8,
        fillColor: "#22c55e",
        color: "#22c55e",
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.4,
      }).addTo(layer);

      marker.bindPopup(`<b>${event.title}</b><br>${event.venue || event.city || ""}`);
    });

    return () => { layer.remove(); };
  }, [events, center]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: "400px" }} />
  );
}
