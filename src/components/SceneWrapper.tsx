'use client'

import dynamic from "next/dynamic";

const EarthScene = dynamic(() => import("@/components/EarthScene"), { ssr: false });

export default function SceneWrapper() {
  return <EarthScene />
}
