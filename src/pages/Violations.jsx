import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  Download, 
  MapPin, 
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Violations = () => {
  const { violations, fetchViolations, updateViolationStatus, addToast } = useContext(AppContext);
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedViolationType, setSelectedViolationType] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Refresh violations roster
    fetchViolations();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedViolationType('');
    setSelectedVehicleType('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    fetchViolations();
  };

  // Filter logic
  const filteredViolations = violations.filter(v => {
    // Global search matching
    const plate = v.vehicle?.plate_number || '';
    const owner = v.vehicle?.owner_name || '';
    const location = v.location || '';
    const vType = v.violation_type || '';
    const textMatch = search.trim() === '' || 
      plate.toLowerCase().includes(search.toLowerCase()) ||
      owner.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase()) ||
      vType.toLowerCase().includes(search.toLowerCase());

    // Category matches
    const typeMatch = !selectedViolationType || v.violation_type === selectedViolationType;
    const vehicleMatch = !selectedVehicleType || v.vehicle?.vehicle_type === selectedVehicleType;
    const statusMatch = !selectedStatus || v.status === selectedStatus;

    // Date range filter
    const vDate = new Date(v.date_time);
    const startMatch = !startDate || vDate >= new Date(startDate);
    const endMatch = !endDate || vDate <= new Date(endDate + 'T23:59:59');

    return textMatch && typeMatch && vehicleMatch && statusMatch && startMatch && endMatch;
  });

  // Paginated listings
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage) || 1;
  const paginatedViolations = filteredViolations.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getStatusPill = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wide">Paid</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-extrabold uppercase tracking-wide">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-extrabold uppercase tracking-wide">Pending</span>;
    }
  };

  const handleExport = (format) => {
    addToast(`Exporting ${filteredViolations.length} records to ${format.toUpperCase()}...`, 'success');
    // Simulated file download
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(filteredViolations, null, 2)], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `traffic_violations_report.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      addToast('Download completed!', 'success');
    }, 1500);
  };

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          <Header title="Traffic Violations Registry" />

          {/* Filters Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md mb-6 flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
              <Filter size={14} className="text-sky-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advanced Search Engines & Filters</span>
            </div>

            {/* Controls inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Text Search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Universal Search</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search vehicle plate, owner name..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                  />
                  <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Violation Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Violation Category</label>
                <select 
                  value={selectedViolationType}
                  onChange={(e) => { setSelectedViolationType(e.target.value); setPage(1); }}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold appearance-none"
                >
                  <option value="">All Categories</option>
                  <option value="red_light_jump">Red Light Jump</option>
                  <option value="overspeeding">Overspeeding</option>
                  <option value="no_helmet">No Helmet</option>
                  <option value="no_seatbelt">No Seatbelt</option>
                  <option value="using_mobile">Mobile While Driving</option>
                  <option value="wrong_lane">Wrong Lane Driving</option>
                </select>
              </div>

              {/* Vehicle Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Vehicle Type</label>
                <select 
                  value={selectedVehicleType}
                  onChange={(e) => { setSelectedVehicleType(e.target.value); setPage(1); }}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold appearance-none"
                >
                  <option value="">All Vehicles</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="truck">Truck</option>
                  <option value="bus">Bus</option>
                  <option value="auto">Auto Rickshaw</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Payment Status</label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Date ranges controls row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-900 pt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">From</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">To</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs transition-colors"
                >
                  Reset Filters
                </button>

                {/* Export Options */}
                <div className="flex rounded-xl border border-slate-800 p-0.5 bg-slate-950">
                  <button 
                    onClick={() => handleExport('csv')}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:bg-slate-900 transition-all"
                  >
                    <FileText size={12} />
                    CSV
                  </button>
                  <button 
                    onClick={() => handleExport('xlsx')}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:bg-slate-900 transition-all border-l border-slate-900"
                  >
                    <FileSpreadsheet size={12} />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Violations Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur-md overflow-hidden shadow-lg mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Evidence Image</th>
                    <th className="px-6 py-4">Vehicle Details</th>
                    <th className="px-6 py-4">Violation Details</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4 text-right">Fine Amount</th>
                    <th className="px-6 py-4">OCR Conf.</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-semibold text-slate-300">
                  {paginatedViolations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500 text-sm">
                        <AlertCircle className="mx-auto text-slate-600 mb-2" size={32} />
                        No violations match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedViolations.map(v => (
                      <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                        {/* Thumbnail crop preview */}
                        <td className="px-6 py-3 shrink-0">
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-sky-500/5" />
                            <span className="text-[7px] font-black text-sky-400 leading-none tracking-tighter truncate max-w-full px-0.5">{v.vehicle?.plate_number}</span>
                          </div>
                        </td>
                        {/* Plate & Owner */}
                        <td className="px-6 py-3">
                          <div className="font-extrabold text-slate-200 tracking-wider">{v.vehicle?.plate_number}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{v.vehicle?.color} {v.vehicle?.brand} ({v.vehicle?.vehicle_type})</div>
                        </td>
                        {/* Violation Type */}
                        <td className="px-6 py-3">
                          <span className="text-rose-400 capitalize flex items-center gap-1">
                            <AlertTriangle size={12} className="shrink-0" />
                            {v.violation_type.replace('_', ' ')}
                          </span>
                          <div className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[150px]">{v.officer_notes || 'No description provided.'}</div>
                        </td>
                        {/* Location */}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1 truncate max-w-[140px]" title={v.location}>
                            <MapPin size={12} className="text-slate-500 shrink-0" />
                            <span>{v.location}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Camera ID: {v.camera_id}</div>
                        </td>
                        {/* Date Time */}
                        <td className="px-6 py-3">
                          <div>{new Date(v.date_time).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{new Date(v.date_time).toLocaleTimeString()}</div>
                        </td>
                        {/* Fine */}
                        <td className="px-6 py-3 text-right font-black text-slate-200">
                          ₹{Number(v.fine_amount).toLocaleString('en-IN')}
                        </td>
                        {/* OCR Confidence */}
                        <td className="px-6 py-3 text-emerald-400 font-extrabold">
                          {v.ocr_confidence}%
                        </td>
                        {/* Status Pill */}
                        <td className="px-6 py-3 text-center">
                          {getStatusPill(v.status)}
                        </td>
                        {/* Action View Details */}
                        <td className="px-6 py-3 text-center">
                          <button 
                            onClick={() => navigate(`/violations/${v.id}`)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-sky-400 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer bar */}
            <div className="px-6 py-4 bg-slate-950 flex justify-between items-center text-xs text-slate-400 border-t border-slate-900">
              <div>
                Showing <strong className="text-slate-300">{(page - 1) * itemsPerPage + 1}</strong> to <strong className="text-slate-300">{Math.min(page * itemsPerPage, filteredViolations.length)}</strong> of <strong className="text-slate-300">{filteredViolations.length}</strong> incidents
              </div>
              <div className="flex gap-1.5">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 disabled:opacity-40 transition-opacity font-bold"
                >
                  Previous
                </button>
                <div className="flex items-center px-3 font-semibold">
                  Page {page} of {totalPages}
                </div>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 disabled:opacity-40 transition-opacity font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Violations;
