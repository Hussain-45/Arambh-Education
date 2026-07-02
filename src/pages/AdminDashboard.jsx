import React, { useContext, useEffect, useState } from 'react';
import { Users, BookOpen, CheckSquare, ArrowRight, Plus, Calendar as CalendarIcon, IndianRupee, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';

import RecentAttendance from '../components/RecentAttendance';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { fees, students, classes, registrationRequests } = useContext(AppContext);
  const navigate = useNavigate();

  // Calculate analytics locally
  const totalStudents = students.length;
  const activeClasses = classes.length;
  const totalRevenue = fees.reduce((sum, fee) => sum + fee.paid, 0);
  const pendingFees = fees.reduce((sum, fee) => sum + (fee.status !== 'Paid' ? (fee.total - fee.paid) : 0), 0);

  const analytics = {
    totalStudents,
    activeClasses,
    totalRevenue,
    pendingFees
  };

  const pendingRequests = registrationRequests.filter(r => r.status === 'pending');

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
          
          <div className="prof-card" style={{ flex: '2 1 450px' }}>
             <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
               <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Pending Requests</h2>
               <button onClick={() => navigate('/requests')} className="prof-btn prof-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>View All</button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {pendingRequests.slice(0, 3).map(req => (
                 <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--secondary)', borderRadius: '8px' }}>
                   <div>
                     <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.name}</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role: {req.role} | Class: {req.className}</div>
                   </div>
                   <button onClick={() => navigate('/requests')} className="prof-btn" style={{ padding: '0.4rem 1rem' }}>Review</button>
                 </div>
               ))}
               {pendingRequests.length === 0 && (
                 <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.75rem' }}>
                   <div style={{ 
                     width: '40px', height: '40px', borderRadius: '50%', 
                     border: '2px solid var(--success)', display: 'flex', 
                     alignItems: 'center', justifyContent: 'center',
                     boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                   }}>
                     <Check size={20} color="var(--success)" />
                   </div>
                   <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>All registration requests cleared</div>
                 </div>
               )}
             </div>
          </div>

          <div className="prof-card" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Quick Actions</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <button onClick={() => navigate('/attendance')} className="dashboard-action-btn">
                <span>Mark Attendance</span>
                <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/students')} className="dashboard-action-btn">
                <span>Add New Student</span>
                <Plus size={16} />
              </button>
              <button onClick={() => navigate('/requests')} className="dashboard-action-btn">
                <span>Registration Requests</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    background: pendingRequests.length > 0 ? 'var(--danger)' : 'var(--secondary)', 
                    color: pendingRequests.length > 0 ? 'white' : 'var(--text-muted)', 
                    borderRadius: '50%', width: '22px', height: '22px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '0.75rem', fontWeight: 600,
                    border: '1px solid var(--border-color)'
                  }}>
                    {pendingRequests.length}
                  </span>
                  <ArrowRight size={16} />
                </div>
              </button>
              
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: `1px solid var(--border-color)` }}>
                <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  <span>System Status</span>
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', filter: 'drop-shadow(0 0 3px var(--success))' }}></span>
                    All Systems Operational
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--secondary)', borderRadius: '2px', overflow: 'hidden' }}>
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
                  <Line type="monotone" dataKey="attendance" stroke="var(--primary-text)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
