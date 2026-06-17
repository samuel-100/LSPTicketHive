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

export default function EventMap({ events, city }: { events: MapEvent[]; city?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center = CITY_COORDS[(city || "dublin").toLowerCase()] || [53.3498, -6.2603];

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
  }, [city]);

  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    events.forEach((event) => {
      const cityCoords = CITY_COORDS[(event.city || "dublin").toLowerCase()];
      if (!cityCoords) return;

      const lat = cityCoords[0] + (Math.random() - 0.5) * 0.02;
      const lng = cityCoords[1] + (Math.random() - 0.5) * 0.02;

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#22c55e",
        color: "#22c55e",
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.4,
      }).addTo(map);

      marker.bindPopup(`<b>${event.title}</b><br>${event.venue || event.city}`);
    });
  }, [events]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: "400px" }} />
  );
}
