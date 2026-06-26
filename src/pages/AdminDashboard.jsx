import React, { useContext, useEffect, useState } from 'react';
import { Users, BookOpen, CheckSquare, ArrowRight, Plus, Calendar as CalendarIcon, IndianRupee } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import RecentAttendance from '../components/RecentAttendance';
import { AppContext } from '../context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { fees, authHeaders, API_URL } = useContext(AppContext);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    activeClasses: 0,
    totalRevenue: 0,
    pendingFees: 0
  });
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/analytics`, { headers: authHeaders });
        if (res.ok) {
          setAnalytics(await res.json());
        }
        
        const reqRes = await fetch(`${API_URL}/admin/requests`, { headers: authHeaders });
        if (reqRes.ok) {
          setPendingRequests(await reqRes.json());
        }
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      }
    };
    fetchAnalytics();
  }, [API_URL, authHeaders]);

  // Mock data for attendance trend (can be connected to backend later)
  const attendanceData = [
    { name: 'Mon', attendance: 95 }, { name: 'Tue', attendance: 92 },
    { name: 'Wed', attendance: 98 }, { name: 'Thu', attendance: 94 },
    { name: 'Fri', attendance: 96 },
  ];

  const feeData = [
    { name: 'Collected', amount: analytics.totalRevenue },
    { name: 'Pending', amount: analytics.pendingFees }
  ];

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        {/* Top Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <StatCard title="Total Students" value={analytics.totalStudents.toString()} icon={Users} trend={2} />
          <StatCard title="Active Classes" value={analytics.activeClasses.toString()} icon={BookOpen} trend={0} />
          <StatCard title="Total Revenue" value={`₹${analytics.totalRevenue}`} icon={IndianRupee} trend={5} />
        </div>

        {/* Middle Section: Recent Activity & Actions */}
        <div style={{ display: 'flex', gap: '2rem', flexDirection: 'row', flexWrap: 'wrap', marginBottom: '2rem' }}>
          
          <div className="prof-card" style={{ flex: '1 1 400px' }}>
             <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
               <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Pending Requests</h2>
               <button onClick={() => window.location.href='/requests'} className="prof-btn prof-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>View All</button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {pendingRequests.slice(0, 3).map(req => (
                 <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--secondary)', borderRadius: '8px' }}>
                   <div>
                     <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.name}</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role: {req.role} | Class: {req.className}</div>
                   </div>
                   <button onClick={() => window.location.href='/requests'} className="prof-btn" style={{ padding: '0.4rem 1rem' }}>Review</button>
                 </div>
               ))}
               {pendingRequests.length === 0 && (
                 <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No pending requests.</div>
               )}
             </div>
          </div>

          <div className="prof-card" style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Quick Actions</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <button onClick={() => window.location.href='/attendance'} className="prof-btn prof-btn-outline" style={{ justifyContent: 'space-between' }}>
                <span>Mark Attendance</span>
                <ArrowRight size={16} />
              </button>
              <button onClick={() => window.location.href='/students'} className="prof-btn prof-btn-outline" style={{ justifyContent: 'space-between' }}>
                <span>Add New Student</span>
                <Plus size={16} />
              </button>
              <button onClick={() => window.location.href='/requests'} className="prof-btn prof-btn-outline" style={{ justifyContent: 'space-between', position: 'relative' }}>
                <span>Registration Requests</span>
                {pendingRequests.length > 0 && (
                  <span style={{ position: 'absolute', right: '40px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                    {pendingRequests.length}
                  </span>
                )}
                <ArrowRight size={16} />
              </button>
              
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: `1px solid var(--border-color)` }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>System Status</span>
                  <span style={{ color: 'var(--success)', fontWeight: 500 }}>All Systems Operational</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: 'var(--success)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Analytics Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="prof-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Attendance Trends</h2>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="attendance" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="prof-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Fee Revenue Overview</h2>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip cursor={{ fill: 'var(--secondary)' }} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="amount" fill="var(--success)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
      </main>
    </>
  );
};

export default AdminDashboard;
