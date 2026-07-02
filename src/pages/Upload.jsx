import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  UploadCloud, 
  FileVideo, 
  FileImage, 
  Camera, 
  Cpu, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const { cameras, uploadMedia, loading, addToast } = useContext(AppContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraId, setCameraId] = useState('CAM-101');
  const [dragOver, setDragOver] = useState(false);
  const [processedResult, setProcessedResult] = useState(null);
  const [step, setStep] = useState(0); // 0 = Idle, 1 = Uploading, 2 = YOLO Object detection, 3 = Plate Recognition, 4 = Seed DB

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setupFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setupFile(selectedFile);
    }
  };

  const setupFile = (selectedFile) => {
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      addToast('Please upload an image or video file.', 'danger');
      return;
    }

    setFile(selectedFile);
    setProcessedResult(null);
    setStep(0);

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleProcessSubmit = async () => {
    if (!file) return;

    // Simulate progress bar intervals
    setStep(1);
    const stepIntervals = [
      { stepVal: 2, delay: 1000 },
      { stepVal: 3, delay: 2400 },
      { stepVal: 4, delay: 3800 }
    ];

    stepIntervals.forEach(({ stepVal, delay }) => {
      setTimeout(() => {
        setStep(prev => prev < stepVal ? stepVal : prev);
      }, delay);
    });

    try {
      const violationId = await uploadMedia(file, cameraId);
      
      // Complete full steps
      setStep(5);
      
      // Mock result details for user presentation in panel
      const isOverspeed = file.name.includes('speed') || file.size > 2000000;
      setProcessedResult({
        id: violationId,
        plate_number: isOverspeed ? 'HR26-CT-0056' : 'CH01-GA-3421',
        vehicle_type: 'car',
        brand: isOverspeed ? 'Maruti Suzuki' : 'Honda City',
        color: isOverspeed ? 'Red' : 'White',
        owner_name: isOverspeed ? 'Rohan Mehra' : 'Jaspreet Singh',
        violation_type: isOverspeed ? 'overspeeding' : 'red_light_jump',
        fine_amount: isOverspeed ? 2000.0 : 1000.0,
        ocr_confidence: isOverspeed ? 92.4 : 94.5,
        location: isOverspeed ? 'Madhya Marg, Chandigarh' : 'Sector 17, Chandigarh',
        evidence_image_path: '/uploads/evidence_images/demo_evidence.jpg'
      });
      
      addToast('AI processing completed!', 'success');
    } catch (e) {
      setStep(0);
      addToast('Could not process media file.', 'danger');
    }
  };

  const getStepText = () => {
    switch (step) {
      case 1: return 'Uploading media stream...';
      case 2: return 'Running YOLOv8 vehicle detection & classification...';
      case 3: return 'Running OCR on cropped plate...';
      case 4: return 'Verifying vehicle owner & registration logs...';
      case 5: return 'AI Pipeline Complete!';
      default: return '';
    }
  };

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          <Header title="AI Process Feed" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            
            {/* Left side: Upload card */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-md flex flex-col flex-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 text-left">Upload CCTV Clip / Image</h4>

                {/* Camera association config */}
                <div className="flex flex-col gap-2 mb-4 text-left max-w-sm">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Select Source CCTV Camera</label>
                  <div className="relative">
                    <select 
                      value={cameraId}
                      onChange={(e) => setCameraId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors appearance-none font-semibold"
                    >
                      {cameras.map(c => (
                        <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                      ))}
                    </select>
                    <Camera size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Drag and drop panel */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    dragOver ? 'border-sky-400 bg-sky-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  } ${preview ? 'py-4' : 'py-16'}`}
                  onClick={() => document.getElementById('file-upload-input').click()}
                >
                  <input 
                    id="file-upload-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {preview ? (
                    <div className="w-full max-h-[220px] rounded-xl overflow-hidden relative flex items-center justify-center bg-slate-950/80">
                      {file.type.startsWith('video/') ? (
                        <video src={preview} className="max-h-[200px]" controls />
                      ) : (
                        <img src={preview} className="max-h-[200px] object-contain" alt="preview" />
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        <UploadCloud size={32} />
                      </div>
                      <div className="text-xs font-bold text-slate-300">Drag & drop your files here or browse</div>
                      <div className="text-[10px] text-slate-500 font-semibold">Supports high-res PNG, JPG, MP4, AVI</div>
                    </div>
                  )}

                  {file && (
                    <div className="mt-4 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-300">
                      {file.type.startsWith('video/') ? <FileVideo size={14} className="text-purple-400" /> : <FileImage size={14} className="text-sky-400" />}
                      <span>{file.name} ({(file.size / 1000000).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>

                {/* Upload Action */}
                {file && step === 0 && (
                  <button 
                    onClick={handleProcessSubmit}
                    className="mt-5 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <Sparkles size={16} />
                    Run AI Model Pipeline
                  </button>
                )}

                {/* Active progress tracker loading indicators */}
                {step > 0 && step < 5 && (
                  <div className="mt-5 text-left bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Cpu size={14} className="text-sky-400 animate-spin" />
                        Analyzing Stream...
                      </span>
                      <span>{step * 20}%</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="bg-sky-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${step * 20}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-sky-400 font-semibold mt-2 animate-pulse">{getStepText()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Processed results panel */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-md flex flex-col flex-1 h-full">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 text-left">Processing Summary</h4>

                {!processedResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 py-16">
                    <Cpu size={40} className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Awaiting AI Run...</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col text-left gap-4">
                    {/* Bounding box crop panel */}
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex flex-col items-center">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider self-start mb-2">Evidence Visual Bounding Box</div>
                      <div className="relative w-full h-[140px] rounded-lg overflow-hidden flex items-center justify-center bg-slate-900">
                        {/* Mock overlay crop image */}
                        <div className="absolute inset-0 bg-sky-500/5" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-sky-400 w-32 h-16 rounded flex items-center justify-center bg-sky-500/10">
                          <span className="text-[11px] font-extrabold tracking-wider text-sky-400">{processedResult.plate_number}</span>
                        </div>
                        <Cpu size={24} className="text-slate-700 animate-pulse" />
                      </div>
                    </div>

                    {/* Labeled features list */}
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-900">
                        <span className="text-slate-500 font-bold">Plate Number Read:</span>
                        <span className="font-extrabold text-slate-200">{processedResult.plate_number}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-900">
                        <span className="text-slate-500 font-bold">OCR Confidence:</span>
                        <span className="font-extrabold text-emerald-400">{processedResult.ocr_confidence}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-900">
                        <span className="text-slate-500 font-bold">Vehicle Class:</span>
                        <span className="font-extrabold text-slate-200 capitalize">{processedResult.brand} ({processedResult.vehicle_type})</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-900">
                        <span className="text-slate-500 font-bold">Violation Triggered:</span>
                        <span className="font-extrabold text-rose-400 capitalize flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {processedResult.violation_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-900">
                        <span className="text-slate-500 font-bold">Penalty Amount:</span>
                        <span className="font-extrabold text-slate-200">₹{processedResult.fine_amount}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/violations')}
                      className="mt-auto w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={14} className="text-emerald-400" />
                      Confirm & View Violation Registry
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
