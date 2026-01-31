'use client'

import dynamic from "next/dynamic";

// IMPORTING NEW FILE TO BUST CACHE
const EarthScene = dynamic(() => import("@/components/EarthScene"), { ssr: false });

export default function SceneWrapper() {
  return <EarthScene />
}
