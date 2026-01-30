import DashboardOverlay from "@/components/DashboardOverlay";
import SceneWrapper from "@/components/SceneWrapper";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black selection:bg-cyan-500/30">
       {/* 3D Scene Background */}
       <div className="absolute inset-0 z-0">
          <SceneWrapper />
       </div>
       
       {/* UI Overlay */}
       <div className="absolute inset-0 z-10 pointer-events-none">
          <DashboardOverlay />
       </div>
    </main>
  );
}
