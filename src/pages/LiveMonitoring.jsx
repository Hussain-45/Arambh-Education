import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Camera, 
  VideoOff, 
  Maximize2, 
  Activity, 
  AlertCircle, 
  Flame, 
  Zap, 
  CheckCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';

const LiveMonitoring = () => {
  const { cameras, updateCameraStatus, addToast } = useContext(AppContext);
  const [selectedCam, setSelectedCam] = useState(null);
  const [gridSize, setGridSize] = useState(4); // 2 or 4 split screen
  const [feedDetections, setFeedDetections] = useState([]);
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  // Auto-generate scrolling detection logs for live simulation feel
  useEffect(() => {
    const vehicleClasses = ['Car', 'SUV', 'Motorcycle', 'Bus', 'Auto Rickshaw', 'Truck', 'Pedestrian'];
    const plates = ['CH01-GA-3421', 'DL3C-AY-8854', 'HR26-DF-4402', 'MH12-QK-9921', 'UP16-TY-0089', 'PB65-AS-1102'];
    const colors = ['White', 'Black', 'Red', 'Blue', 'Silver', 'Yellow'];
    
    const interval = setInterval(() => {
      // Pick random online camera
      const onlineCams = cameras.filter(c => c.status === 'online');
      if (onlineCams.length === 0) return;
      const cam = onlineCams[Math.floor(Math.random() * onlineCams.length)];
      
      const vClass = vehicleClasses[Math.floor(Math.random() * vehicleClasses.length)];
      const isPed = vClass === 'Pedestrian';
      
      const speed = isPed ? null : Math.floor(Math.random() * 40 + 35); // 35-75 km/h
      const overspeed = speed && speed > 60;
      
      // Random emergency vehicle trigger
      if (Math.random() > 0.92) {
        const type = Math.random() > 0.5 ? 'Ambulance' : 'Fire Engine';
        const alertObj = {
          id: Date.now(),
          camera: cam.name,
          type: type,
          message: `🚨 Emergency vehicle detected on ${cam.location}. Routing traffic priority!`,
          time: new Date().toLocaleTimeString()
        };
        setEmergencyAlert(alertObj);
        addToast(`Emergency Vehicle Detected: ${type}!`, 'danger');
        // Clear emergency alert after 6 seconds
        setTimeout(() => setEmergencyAlert(null), 6000);
      }

      const newDet = {
        id: Date.now(),
        camera: cam.id,
        cameraName: cam.name,
        class: vClass,
        plate: isPed ? 'N/A' : plates[Math.floor(Math.random() * plates.length)],
        color: isPed ? 'N/A' : colors[Math.floor(Math.random() * colors.length)],
        speed: speed,
        overspeed: overspeed,
        time: new Date().toLocaleTimeString()
      };

      setFeedDetections(prev => [newDet, ...prev.slice(0, 19)]);
    }, 2500);

    return () => clearInterval(interval);
  }, [cameras]);

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'online' ? 'offline' : 'online';
    updateCameraStatus(id, nextStatus);
    addToast(`Camera ${id} status toggled to ${nextStatus}`, 'success');
  };

  const getDensity = (id) => {
    // Generate simulated density metrics
    const hash = id.charCodeAt(id.length - 1) || 5;
    const num = (hash * Date.now()) % 100;
    if (num > 70) return { label: 'Heavy Congestion', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' };
    if (num > 35) return { label: 'Moderate Flow', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' };
    return { label: 'Low Density', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
  };

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto flex flex-col h-full">
          <Header title="Live Monitoring Room" />

          {/* Emergency Alert Banner */}
          {emergencyAlert && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500 bg-rose-950/20 text-rose-200 flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-3 text-left">
                <Flame className="text-rose-400 animate-pulse shrink-0" size={24} />
                <div>
                  <div className="text-sm font-black uppercase tracking-wider">{emergencyAlert.type} DETECTED</div>
                  <div className="text-xs font-medium mt-0.5">{emergencyAlert.message}</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                {emergencyAlert.time}
              </div>
            </div>
          )}

          {/* Main Workspace: Matrix Left, Side Panel Right */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 items-stretch">
            
            {/* Matrix View */}
            <div className="xl:col-span-3 flex flex-col gap-4">
              {/* Matrix Control Bar */}
              <div className="flex justify-between items-center p-4 rounded-xl border border-slate-900 bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300">Layout Configurations:</span>
                  <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
                    <button 
                      onClick={() => { setGridSize(2); setSelectedCam(null); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        gridSize === 2 && !selectedCam ? 'bg-sky-500/20 text-sky-400 shadow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Dual Feed (1x2)
                    </button>
                    <button 
                      onClick={() => { setGridSize(4); setSelectedCam(null); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        gridSize === 4 && !selectedCam ? 'bg-sky-500/20 text-sky-400 shadow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Matrix Grid (2x2)
                    </button>
                  </div>
                </div>
                {selectedCam && (
                  <button 
                    onClick={() => setSelectedCam(null)}
                    className="text-xs text-sky-400 font-bold bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20 hover:bg-sky-500/20"
                  >
                    Restore Split Layout
                  </button>
                )}
              </div>

              {/* Feed Grid View */}
              <div className={`grid gap-4 flex-1 ${
                selectedCam ? 'grid-cols-1' : (gridSize === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2')
              }`}>
                {/* Loop over feeds */}
                {cameras.filter(c => selectedCam ? c.id === selectedCam.id : true).slice(0, selectedCam ? 1 : gridSize).map(cam => {
                  const isOnline = cam.status === 'online';
                  const density = getDensity(cam.id);
                  
                  return (
                    <div 
                      key={cam.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col shadow-lg min-h-[260px] group"
                    >
                      {/* Video Stream Container */}
                      <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden">
                        {isOnline ? (
                          <>
                            {/* Live video canvas overlay simulation */}
                            <div className="absolute inset-0 bg-slate-900/20" />
                            {/* Camera details overlays */}
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">LIVE</span>
                              <span className="text-[10px] font-extrabold text-slate-200 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">{cam.id}</span>
                            </div>
                            <div className="absolute top-4 right-4 z-10">
                              <button 
                                onClick={() => setSelectedCam(cam)}
                                className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <Maximize2 size={12} />
                              </button>
                            </div>
                            
                            {/* Bounding box simulation graphics */}
                            <div className="absolute top-1/3 left-1/4 w-[160px] h-[100px] border-2 border-sky-400 rounded-lg flex flex-col justify-start p-1.5 bg-sky-500/5 select-none text-left pointer-events-none animate-pulse">
                              <div className="text-[9px] font-extrabold text-sky-400 tracking-wider">CAR (0.94)</div>
                              <div className="text-[7px] font-bold text-sky-400/80 mt-0.5">SPEED: 48 km/h</div>
                            </div>

                            <div className="absolute bottom-1/4 right-1/4 w-[120px] h-[90px] border-2 border-emerald-400 rounded-lg flex flex-col justify-start p-1.5 bg-emerald-500/5 select-none text-left pointer-events-none">
                              <div className="text-[9px] font-extrabold text-emerald-400 tracking-wider">HELMET: OK (0.91)</div>
                              <div className="text-[7px] font-bold text-emerald-400/80 mt-0.5">RIDER ID #4092</div>
                            </div>
                            
                            {/* Live video backdrop placeholder grid details */}
                            <div className="flex flex-col items-center select-none opacity-40">
                              <Cpu size={32} className="text-slate-600 animate-spin" style={{ animationDuration: '6s' }} />
                              <span className="text-[10px] text-slate-500 font-bold uppercase mt-2">Active AI Inference</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-slate-600 gap-2 select-none">
                            <VideoOff size={36} />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Camera Feed Offline</span>
                          </div>
                        )}

                        {/* Top bottom info bars */}
                        <div className="absolute bottom-4 left-4 z-10 text-left">
                          <div className="text-xs font-bold text-slate-100">{cam.name}</div>
                          <div className="text-[9px] text-slate-400 font-semibold">{cam.location}</div>
                        </div>

                        {/* Density indicator */}
                        {isOnline && (
                          <div className={`absolute bottom-4 right-4 z-10 px-2 py-0.5 rounded-full border text-[9px] font-bold ${density.color}`}>
                            {density.label}
                          </div>
                        )}
                      </div>

                      {/* Footer Control Panel */}
                      <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 text-left">
                          <CheckCircle size={14} className={isOnline ? 'text-emerald-400' : 'text-slate-600'} />
                          <span className="font-semibold text-slate-400">Health index: {cam.health_score}%</span>
                        </div>
                        <button 
                          onClick={() => handleToggleStatus(cam.id, cam.status)}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${
                            isOnline 
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                        >
                          {isOnline ? 'Power Off' : 'Activate Feed'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Real-time logs right-hand side panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col h-full xl:min-h-[500px]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Activity size={18} className="text-sky-400 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 text-left">AI Process Output</h4>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[520px]">
                {feedDetections.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-10">Awaiting stream input data...</div>
                ) : (
                  feedDetections.map(det => (
                    <div 
                      key={det.id} 
                      className={`p-3 rounded-xl border bg-slate-900/60 flex flex-col text-left ${
                        det.overspeed ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-850'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-slate-400">{det.cameraName}</span>
                        <span className="text-slate-500 font-semibold">{det.time}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-xs font-bold text-slate-200 capitalize">{det.color} {det.class}</span>
                        {!det.speed ? null : (
                          <span className={`text-[10px] font-bold ${det.overspeed ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                            {det.speed} km/h
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[9px]">
                        <span className="text-slate-500">Plate: <strong className="text-slate-400">{det.plate}</strong></span>
                        {det.overspeed && (
                          <span className="flex items-center gap-0.5 text-rose-400 font-bold bg-rose-500/10 px-1 rounded">
                            <AlertCircle size={10} />
                            OVERSPEEDING
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
