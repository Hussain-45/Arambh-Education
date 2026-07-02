import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Camera, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Activity, 
  MapPin, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  X
} from 'lucide-react';

const Cameras = () => {
  const { cameras, addCamera, updateCameraStatus, deleteCamera, userRole, addToast } = useContext(AppContext);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [camId, setCamId] = useState('');
  const [camName, setCamName] = useState('');
  const [camLocation, setCamLocation] = useState('');
  const [camLat, setCamLat] = useState('');
  const [camLng, setCamLng] = useState('');
  const [camIp, setCamIp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!camId || !camName || !camLocation || !camLat || !camLng) {
      addToast('Please fill out all required fields.', 'danger');
      return;
    }

    const payload = {
      id: camId,
      name: camName,
      location: camLocation,
      latitude: parseFloat(camLat),
      longitude: parseFloat(camLng),
      ip_address: camIp || null,
      status: 'online',
      health_score: 100
    };

    const success = await addCamera(payload);
    if (success) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setCamId('');
    setCamName('');
    setCamLocation('');
    setCamLat('');
    setCamLng('');
    setCamIp('');
  };

  const handleToggleFeed = (id, currentStatus) => {
    const nextStatus = currentStatus === 'online' ? 'offline' : 'online';
    updateCameraStatus(id, nextStatus);
    addToast(`Camera ${id} turned ${nextStatus.toUpperCase()}`, 'success');
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to de-register Camera ${id}?`)) {
      deleteCamera(id);
    }
  };

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          {/* Header row */}
          <div className="flex justify-between items-center mb-6">
            <Header title="Camera Management Console" />
            <button 
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
            >
              <Plus size={16} />
              Register New Camera
            </button>
          </div>

          {/* Grid listing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameras.map(cam => {
              const isOnline = cam.status === 'online';
              
              return (
                <div 
                  key={cam.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col justify-between text-left shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <Camera size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-200 truncate max-w-[120px]" title={cam.name}>{cam.name}</h4>
                          <span className="text-[9px] font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full">{cam.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-0.5">
                          <MapPin size={10} />
                          {cam.location}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-1">
                      {isOnline ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-rose-400" />}
                      <span className={`text-[10px] font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Body fields */}
                  <div className="flex flex-col gap-2 border-t border-slate-900 pt-3 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>IP Address:</span>
                      <span className="font-bold text-slate-300">{cam.ip_address || '192.168.1.xxx'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="font-bold text-slate-300">{cam.latitude}, {cam.longitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health Score Index:</span>
                      <span className={`font-bold ${cam.health_score > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {cam.health_score}% OK
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-between items-center mt-4 border-t border-slate-900 pt-3">
                    <button 
                      onClick={() => handleToggleFeed(cam.id, cam.status)}
                      className="text-xs font-bold flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
                    >
                      {isOnline ? (
                        <>
                          <ToggleRight size={22} className="text-emerald-400" />
                          <span>Active Feed</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={22} className="text-slate-600" />
                          <span>Muted Feed</span>
                        </>
                      )}
                    </button>

                    {userRole === 'admin' && (
                      <button 
                        onClick={() => handleDelete(cam.id)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-500/20 bg-slate-950 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Camera"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <Camera size={18} className="text-sky-400" />
              Register CCTV Node
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Camera ID *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CAM-106"
                    value={camId}
                    onChange={(e) => setCamId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Camera Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Madhya Marg 2"
                    value={camName}
                    onChange={(e) => setCamName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Location Description *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sector 26, Madhya Marg Crossing"
                  value={camLocation}
                  onChange={(e) => setCamLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Latitude Coordinate *</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    required
                    placeholder="e.g. 30.7398"
                    value={camLat}
                    onChange={(e) => setCamLat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Longitude Coordinate *</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    required
                    placeholder="e.g. 76.7827"
                    value={camLng}
                    onChange={(e) => setCamLng(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Node IP Address (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 192.168.1.106"
                  value={camIp}
                  onChange={(e) => setCamIp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold transition-colors shadow-lg shadow-sky-500/20"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cameras;
