"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icons
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapInnerProps {
  latitude: number;
  longitude: number;
  popupText?: string;
}

export default function MapInner({ latitude, longitude, popupText }: MapInnerProps) {
  // Simple validation to fallback to a default location if no coordinates provided
  const lat = latitude || 33.4487;
  const lng = longitude || -84.1469; // Henry county roughly

  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={14} 
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon}>
        {popupText && (
          <Popup>
            {popupText}
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
}
