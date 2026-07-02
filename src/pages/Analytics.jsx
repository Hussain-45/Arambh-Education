import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { TrendingUp, Award, IndianRupee, ShieldAlert, Cpu } from 'lucide-react';

const Analytics = () => {
  const { stats, fetchStats } = useContext(AppContext);

  useEffect(() => {
    fetchStats();
  }, []);

  // Format Recharts variables
  const monthlyViolations = stats?.monthly_trend || [];
  
  const hourlyData = stats?.hourly_trend || [];
  
  const vehicleTypes = [
    { name: 'Cars', count: 4850, fill: '#38bdf8' },
    { name: 'Motorcycles', count: 3210, fill: '#fb7185' },
    { name: 'Trucks', count: 1840, fill: '#facc15' },
    { name: 'Buses', count: 1200, fill: '#a78bfa' },
    { name: 'Auto Rickshaws', count: 1350, fill: '#34d399' }
  ];

  const categoryBreakdown = stats?.violations_by_type ? 
    Object.keys(stats.violations_by_type).map(key => ({
      name: key.replace('_', ' ').toUpperCase(),
      count: stats.violations_by_type[key]
    })) : [
      { name: "OVERSPEEDING", count: 1420 },
      { name: "RED LIGHT JUMP", count: 1200 },
      { name: "NO HELMET", count: 980 },
      { name: "NO SEATBELT", count: 350 },
      { name: "MOBILE USE", count: 260 }
    ];

  // Simulated fine revenue collection history
  const fineCollectionData = [
    { month: 'Jan', collected: 84000, target: 100000 },
    { month: 'Feb', collected: 96000, target: 100000 },
    { month: 'Mar', collected: 110000, target: 110000 },
    { month: 'Apr', collected: 120500, target: 110000 },
    { month: 'May', collected: 145000, target: 130000 },
    { month: 'Jun', collected: 161000, target: 140000 }
  ];

  // AI confidence level data
  const aiMetrics = [
    { name: 'Vehicle Class', score: 94, fill: '#38bdf8' },
    { name: 'Plate Detection', score: 91, fill: '#34d399' },
    { name: 'OCR Readout', score: 88, fill: '#a78bfa' },
    { name: 'Helmet Check', score: 93, fill: '#fb7185' }
  ];

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          <Header title="Enforcement Analytics" />

          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex items-center gap-4 text-left">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                <Cpu size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Average AI Accuracy</p>
                <h3 className="text-xl font-black text-slate-200 mt-1">91.8%</h3>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">Across 14k inference frames</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex items-center gap-4 text-left">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Most Frequent Violation</p>
                <h3 className="text-xl font-black text-slate-200 mt-1">Overspeeding</h3>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">34% of overall registered logs</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex items-center gap-4 text-left">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <IndianRupee size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Fine Capture Rate</p>
                <h3 className="text-xl font-black text-slate-200 mt-1">72.4%</h3>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">Average payment resolution rate</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Fine Revenue & Vehicle Classes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Fine Collection Line/Bar Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Revenue Collections Tracker</h4>
                <TrendingUp size={16} className="text-sky-400" />
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fineCollectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="collected" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Fine Collected (₹)" />
                    <Bar dataKey="target" fill="#64748b" radius={[4, 4, 0, 0]} name="Target Fine (₹)" opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vehicle Type bar chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Traffic Volume Classification</h4>
                <Award size={16} className="text-sky-400" />
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {vehicleTypes.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Violation Categories & AI Confidence Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown (Radial Bar Chart or horizontal bar) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Fines Category breakdown</h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Model Metrics (Radial chart) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md text-left">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">AI Model Precision Index</h4>
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    barSize={10} 
                    data={aiMetrics}
                  >
                    <RadialBar
                      minAngle={15}
                      label={{ position: 'insideStart', fill: '#fff', fontSize: '8px', fontWeight: 'bold' }}
                      background
                      clockWise
                      dataKey="score"
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5 text-[9px] font-bold mt-2">
                {aiMetrics.map(item => (
                  <div key={item.name} className="flex justify-between items-center border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-slate-200">{item.score}% Acc.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
