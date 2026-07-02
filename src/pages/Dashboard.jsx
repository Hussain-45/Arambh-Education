import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { 
  Car, 
  AlertTriangle, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  Camera, 
  ShieldAlert, 
  MapPin 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { stats, fetchStats } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  // Format Recharts data structures
  const areaData = stats?.monthly_trend || [];
  
  const barData = stats?.hourly_trend?.slice(7, 19) || []; // Display day hours (7 AM - 6 PM) for better visibility
  
  const typeDistribution = stats?.violations_by_type ? 
    Object.keys(stats.violations_by_type).map(key => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: stats.violations_by_type[key]
    })) : [];

  const COLORS = ['#38bdf8', '#fb7185', '#34d399', '#facc15', '#a78bfa', '#fb923c'];

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          <Header title="Control Room Overview" />

          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard 
              title="Total Monitored Vehicles" 
              value={stats?.total_vehicles || 12450} 
              icon={Car} 
              change={4.2} 
              trend="up" 
            />
            <StatCard 
              title="Total System Violations" 
              value={stats?.total_violations || 4210} 
              icon={AlertTriangle} 
              change={12.8} 
              trend="up" 
            />
            <StatCard 
              title="Violations Registered Today" 
              value={stats?.todays_violations || 142} 
              icon={Clock} 
              change={-2.1} 
              trend="down" 
            />
            <StatCard 
              title="Total Fines Collected" 
              value={stats?.paid_fines_sum || 120500.0} 
              icon={IndianRupee} 
              change={8.5} 
              trend="up"
              format={true} 
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Area chart: Monthly trends */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 text-left">Incident Rate Trends</h4>
                <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold bg-sky-500/10 px-2.5 py-1 rounded-full">
                  <TrendingUp size={12} />
                  Monthly Report
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="violations" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViolations)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut chart: Violation types */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 text-left">Category Breakdown</h4>
              <div className="h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold mt-2">
                {typeDistribution.slice(0, 4).map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-slate-400 text-left">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Second Row: Hourly Distribution & Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly bar chart */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 text-left">Peak Violations Hours</h4>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
                    <Bar dataKey="violations" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Incident logs */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 text-left">Live Feed Alerts</h4>
                <button 
                  onClick={() => navigate('/violations')} 
                  className="text-xs text-sky-400 font-bold hover:underline"
                >
                  View All Log History
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[260px] flex flex-col gap-2.5 pr-2">
                {stats?.recent_activity?.length === 0 ? (
                  <div className="text-sm text-slate-500 py-6 text-center">No recent camera notifications</div>
                ) : (
                  stats?.recent_activity?.map(act => (
                    <div 
                      key={act.id} 
                      onClick={() => navigate('/violations')}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-900 bg-slate-950/60 hover:bg-slate-900/60 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className={`p-2 rounded-lg ${
                          act.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          <ShieldAlert size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black tracking-wider text-slate-200">{act.plate_number}</span>
                            <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full capitalize">{act.violation_type.replace('_', ' ')}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin size={10} />
                            {act.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-300">₹{act.fine_amount}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{new Date(act.date_time).toLocaleTimeString()}</div>
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

export default Dashboard;
