import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Info,
  Shield,
  Layers,
  Map as MapIcon,
  TrendingDown
} from 'lucide-react';

const Map = () => {
  const { cameras, violations } = useContext(AppContext);
  const [activeCam, setActiveCam] = useState(null);
  const [mapLayer, setMapLayer] = useState('heatmap'); // 'heatmap' or 'cameras'

  // Calculate coordinates and hotness index
  const getCameraViolationCount = (cameraId) => {
    return violations.filter(v => v.camera_id === cameraId).length;
  };

  const getHotnessColor = (count) => {
    if (count > 4) return 'bg-rose-500 shadow-rose-500/50';
    if (count > 2) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  // Top dangerous spots
  const dangerousRoads = [
    { rank: 1, name: "Madhya Marg Crossing (Sec 26)", count: "482 infractions", level: "Critical", color: "text-rose-400" },
    { rank: 2, name: "Sector 17 Bus Stand Junction", count: "392 infractions", level: "High", color: "text-amber-400" },
    { rank: 3, name: "Himalaya Marg Roundabout (Sec 34)", count: "128 infractions", level: "Moderate", color: "text-emerald-400" }
  ];

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          <Header title="Interactive Violation Map" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Left side: City Map simulation */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {/* Map Controls */}
              <div className="flex justify-between items-center p-4 rounded-xl border border-slate-800 bg-slate-950/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300">Map Filter Overlay:</span>
                  <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
                    <button 
                      onClick={() => setMapLayer('heatmap')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        mapLayer === 'heatmap' ? 'bg-sky-500/20 text-sky-400 shadow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Violation Heatmap
                    </button>
                    <button 
                      onClick={() => setMapLayer('cameras')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        mapLayer === 'cameras' ? 'bg-sky-500/20 text-sky-400 shadow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Active CCTV Pins
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <MapIcon size={14} className="shrink-0" />
                  Scale: 1 : 12,000 (Simulated Grid)
                </div>
              </div>

              {/* City Blueprint vector layout container */}
              <div className="flex-1 min-h-[480px] rounded-2xl border border-slate-800 bg-slate-900/20 relative overflow-hidden flex items-center justify-center shadow-lg group">
                {/* SVG Blueprint grid backdrop */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.03] select-none pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#fff" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* City Sector Roads (CSS drawing) */}
                {/* Horizontal road */}
                <div className="absolute left-0 right-0 h-4 bg-slate-900/60 border-y border-slate-800 top-[40%] flex items-center">
                  <div className="w-full border-t border-dashed border-slate-700/60 h-0" />
                </div>
                <div className="absolute left-0 right-0 h-4 bg-slate-900/60 border-y border-slate-800 top-[70%] flex items-center">
                  <div className="w-full border-t border-dashed border-slate-700/60 h-0" />
                </div>
                {/* Vertical road */}
                <div className="absolute top-0 bottom-0 w-4 bg-slate-900/60 border-x border-slate-800 left-[30%] flex justify-center">
                  <div className="h-full border-l border-dashed border-slate-700/60 w-0" />
                </div>
                <div className="absolute top-0 bottom-0 w-4 bg-slate-900/60 border-x border-slate-800 left-[75%] flex justify-center">
                  <div className="h-full border-l border-dashed border-slate-700/60 w-0" />
                </div>

                {/* Diagonal Highway */}
                <div className="absolute w-[120%] h-4 bg-slate-900/40 border-y border-slate-850 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[25deg] flex items-center">
                  <div className="w-full border-t border-dashed border-slate-700/60 h-0" />
                </div>

                {/* Heatmap overlay circles */}
                {mapLayer === 'heatmap' && cameras.map((cam, idx) => {
                  const count = getCameraViolationCount(cam.id);
                  if (count === 0) return null;
                  
                  // Position multipliers based on lat/lng values
                  const leftPos = 20 + (idx * 16) + '%';
                  const topPos = 25 + (idx * 14) + '%';
                  const size = 30 + (count * 15) + 'px';
                  
                  return (
                    <div 
                      key={`heat-${cam.id}`}
                      className="absolute rounded-full bg-rose-500/10 border border-rose-500/30 blur-[4px] animate-pulse flex items-center justify-center"
                      style={{
                        left: leftPos,
                        top: topPos,
                        width: size,
                        height: size,
                        animationDuration: `${2 + (idx % 3)}s`
                      }}
                    />
                  );
                })}

                {/* Clickable camera coordinate nodes */}
                {cameras.map((cam, idx) => {
                  const count = getCameraViolationCount(cam.id);
                  const isOnline = cam.status === 'online';
                  
                  // Position multipliers
                  const leftPos = 20 + (idx * 16) + '%';
                  const topPos = 25 + (idx * 14) + '%';
                  const hotColor = getHotnessColor(count);

                  return (
                    <button 
                      key={cam.id}
                      onClick={() => setActiveCam(cam)}
                      className={`absolute w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center cursor-pointer transform hover:scale-125 transition-transform duration-200 shadow-md ${hotColor}`}
                      style={{
                        left: leftPos,
                        top: topPos
                      }}
                    >
                      <Camera size={9} className="text-slate-950 font-black" />
                      
                      {/* Interactive ping glow */}
                      {isOnline && (
                        <span className="absolute -inset-1.5 rounded-full border border-sky-400/30 animate-ping" style={{ animationDuration: '3s' }} />
                      )}
                    </button>
                  );
                })}

                <div className="absolute bottom-5 left-5 text-[10px] text-slate-500 font-bold bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-900 select-none">
                  Sector Blueprint Grid V1.0
                </div>
              </div>
            </div>

            {/* Right side: Clicked camera details & high danger zones list */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Active camera inspection card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left flex flex-col gap-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-slate-900 pb-2 flex items-center gap-1.5">
                  <MapPin size={14} className="text-sky-400" />
                  Map Node Inspector
                </h4>

                {!activeCam ? (
                  <div className="text-xs text-slate-500 py-6 text-center flex items-center justify-center gap-1">
                    <Info size={12} />
                    Click any node pin to inspect details
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Camera ID:</span>
                      <span className="text-sky-400 font-extrabold">{activeCam.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="text-slate-200 truncate max-w-[120px]" title={activeCam.name}>{activeCam.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coordinates:</span>
                      <span className="text-slate-200">{activeCam.latitude}, {activeCam.longitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Node Status:</span>
                      <span className={`capitalize ${activeCam.status === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {activeCam.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Violations:</span>
                      <span className="text-rose-400 font-extrabold">{getCameraViolationCount(activeCam.id)} infractions</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900 pt-2.5">
                      <span className="text-slate-500">Node Health Index:</span>
                      <span className="text-slate-200">{activeCam.health_score}% OK</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Leaderboard list: Most dangerous zones */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left flex flex-col gap-4 flex-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-slate-900 pb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  High Risk Zones
                </h4>

                <div className="flex flex-col gap-4 flex-1 justify-around">
                  {dangerousRoads.map(road => (
                    <div key={road.rank} className="flex gap-3 text-xs items-start">
                      <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sky-400 shrink-0">
                        {road.rank}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="font-bold text-slate-200 truncate">{road.name}</div>
                        <div className="flex justify-between mt-1 text-[10px] font-bold">
                          <span className="text-slate-500">{road.count}</span>
                          <span className={road.color}>{road.level}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
