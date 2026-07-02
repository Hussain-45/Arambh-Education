import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Car, 
  ShieldAlert, 
  Download, 
  Check, 
  X,
  CreditCard,
  Printer,
  ChevronRight
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const ViolationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { violations, updateViolationStatus, payFine, addToast } = useContext(AppContext);
  
  const [violation, setViolation] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payMethod, setPayMethod] = useState('UPI');

  useEffect(() => {
    // Find matching violation in memory
    const found = violations.find(v => v.id === parseInt(id));
    if (found) {
      setViolation(found);
      setOfficerNotes(found.officer_notes || '');
    } else {
      addToast('Violation record not found in cache.', 'danger');
      navigate('/violations');
    }
  }, [id, violations]);

  if (!violation) {
    return (
      <div className="flex w-screen h-screen bg-slate-950 text-slate-100 items-center justify-center">
        <span>Loading incident details...</span>
      </div>
    );
  }

  const handleStatusChange = async (newStatus) => {
    const success = await updateViolationStatus(violation.id, newStatus, officerNotes);
    if (success) {
      addToast(`Incident #${violation.id} marked as ${newStatus}`, 'success');
    }
  };

  const handleSimulatePayment = async () => {
    const success = await payFine(violation.id, violation.fine_amount, payMethod);
    if (success) {
      setShowPaymentModal(false);
      addToast('Payment transaction captured successfully!', 'success');
    }
  };

  const handlePrintChallan = () => {
    addToast('Generating challan PDF receipt...', 'success');
    window.print();
  };

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          {/* Back Navigation Bar */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => navigate('/violations')}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Incident Review</span>
              <h2 className="text-md font-extrabold text-slate-200">Violation E-Challan #{violation.id}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left side: Evidence image panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Evidence Media Panel */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 text-left">Incident Evidence Camera feed</h4>
                  <a 
                    href={violation.evidence_image_path}
                    download={`evidence_${violation.id}.jpg`}
                    className="flex items-center gap-1.5 text-xs text-sky-400 font-bold hover:underline"
                  >
                    <Download size={14} />
                    Download Original Frame
                  </a>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-850 bg-slate-950 relative aspect-video flex items-center justify-center">
                  {/* Bounding box graphics simulation */}
                  <div className="absolute inset-0 bg-slate-900/10" />
                  <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-red-500 rounded-lg bg-red-500/5 select-none pointer-events-none flex flex-col justify-between p-2">
                    <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase self-start">
                      {violation.violation_type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-black text-red-400 tracking-wider self-end mt-auto">
                      CONF: {violation.ocr_confidence}%
                    </span>
                  </div>

                  {/* License plate highlight box snippet overlay */}
                  <div className="absolute bottom-6 right-6 border border-sky-400 px-2 py-1 bg-slate-950/90 rounded text-[9px] font-extrabold tracking-widest text-sky-400 shadow-lg">
                    LPR READOUT: {violation.vehicle?.plate_number}
                  </div>

                  <div className="text-slate-700 flex flex-col items-center select-none">
                    <ShieldAlert size={48} className="animate-pulse text-slate-600" />
                    <span className="text-[10px] uppercase font-bold text-slate-500 mt-2">Evidence Image Overlay</span>
                  </div>
                </div>
              </div>

              {/* Action Updates Console */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">Officer Action Console</h4>
                
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Add Notes / Case Investigation Notes</label>
                  <textarea 
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Enter observation notes, weather conditions, manual validation remarks..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold min-h-[90px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleStatusChange('resolved')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    Approve & Issue Challan
                  </button>
                  <button 
                    onClick={() => handleStatusChange('resolved')}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    Resolve / Clear Incident
                  </button>
                  <button 
                    onClick={() => handleStatusChange('pending')}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <X size={14} />
                    Dismiss Violation
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Violation & Vehicle attributes */}
            <div className="flex flex-col gap-6">
              {/* Incident Metrics Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left flex flex-col gap-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-900 pb-2">Incident Information</h4>
                
                <div className="flex flex-col gap-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Challan Category:</span>
                    <span className="font-extrabold text-rose-400 capitalize">{violation.violation_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Location Chowk:</span>
                    <span className="font-extrabold text-slate-200 flex items-center gap-0.5">
                      <MapPin size={12} className="text-slate-500" />
                      {violation.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Capture timestamp:</span>
                    <span className="font-extrabold text-slate-200 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" />
                      {new Date(violation.date_time).toLocaleDateString()}
                      <Clock size={12} className="text-slate-500 ml-1.5" />
                      {new Date(violation.date_time).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">CCTV Camera Reference:</span>
                    <span className="font-extrabold text-sky-400">{violation.camera_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">E-Challan Penalty:</span>
                    <span className="font-black text-slate-200 text-sm">₹{violation.fine_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Capture status:</span>
                    <span className="capitalize">{violation.status}</span>
                  </div>
                </div>

                {/* Print and pay controls */}
                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-900">
                  <button 
                    onClick={handlePrintChallan}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Printer size={14} />
                    Print Challan
                  </button>
                  {violation.status === 'pending' && (
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard size={14} />
                      Collect Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Owner & Vehicle parameters card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left flex flex-col gap-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-900 pb-2">Vehicle owner attributes</h4>
                
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">License Plate:</span>
                    <span className="font-extrabold text-slate-200 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded tracking-widest uppercase">{violation.vehicle?.plate_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Owner Name:</span>
                    <span className="font-extrabold text-slate-200 flex items-center gap-1">
                      <User size={12} className="text-slate-500" />
                      {violation.vehicle?.owner_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Registered Email:</span>
                    <span className="font-extrabold text-slate-200 flex items-center gap-1">
                      <Mail size={12} className="text-slate-500" />
                      {violation.vehicle?.owner_email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Vehicle Class:</span>
                    <span className="font-extrabold text-slate-200 capitalize flex items-center gap-1">
                      <Car size={12} className="text-slate-500" />
                      {violation.vehicle?.color} {violation.vehicle?.brand} ({violation.vehicle?.vehicle_type})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Registration Validity:</span>
                    <span className={`font-bold ${violation.vehicle?.registration_status === 'valid' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {violation.vehicle?.registration_status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Pollution Certificate:</span>
                    <span className={`font-bold ${violation.vehicle?.pollution_status === 'valid' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {violation.vehicle?.pollution_status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment simulated modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left shadow-2xl relative">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <CreditCard size={18} className="text-sky-400" />
              Collect Fine payment
            </h3>
            
            <div className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Incident Fine ID:</span>
                <span className="text-slate-200 font-extrabold">#{violation.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Fine Due:</span>
                <span className="text-slate-200 font-black text-sm">₹{violation.fine_amount}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Select Collection Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Card', 'Cash'].map(method => (
                    <button 
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        payMethod === method 
                          ? 'border-sky-400 bg-sky-500/10 text-sky-400' 
                          : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSimulatePayment}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold transition-colors shadow-lg shadow-sky-500/20"
                >
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationDetails;
