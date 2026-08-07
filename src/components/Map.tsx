"use client";

import dynamic from "next/dynamic";

// Dynamically import the MapInner component with SSR disabled
const MapInner = dynamic(() => import("./MapInner"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 animate-pulse text-slate-400 text-sm">
      Loading map...
    </div>
  )
});

interface MapProps {
  latitude: number;
  longitude: number;
  popupText?: string;
}

export default function Map({ latitude, longitude, popupText }: MapProps) {
  return <MapInner latitude={latitude} longitude={longitude} popupText={popupText} />;
}
