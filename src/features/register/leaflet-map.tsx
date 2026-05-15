"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LatLng } from "./location-picker";

/**
 * Fix the well-known Leaflet default-marker bug under bundlers: the CSS
 * references icon images by relative path that webpack/turbopack rewrite.
 * Point them at the unpkg CDN copies so the pin actually renders.
 */
const ICON = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapProps {
  center: LatLng;
  zoom: number;
  marker: LatLng | null;
  onPick: (value: LatLng) => void;
}

/** Re-center the map imperatively when the marker moves programmatically. */
function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}

function ClickToPlace({ onPick }: { onPick: (value: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LeafletMap({
  center,
  zoom,
  marker,
  onPick,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "16rem", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Recenter center={center} />
      <ClickToPlace onPick={onPick} />
      {marker && (
        <Marker
          position={[marker.lat, marker.lng]}
          icon={ICON}
          draggable
          eventHandlers={{
            dragend(e) {
              const ll = e.target.getLatLng();
              onPick({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
