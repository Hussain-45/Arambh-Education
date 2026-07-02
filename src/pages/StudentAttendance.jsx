import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Calendar as CalendarIcon, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const StudentAttendance = () => {
  const { loggedInUser } = useContext(AppContext);

  if (!loggedInUser) return null;

  // Mock comprehensive logs for the student
  const attendanceLogs = [
    { date: 'June 27, 2026', day: 'Saturday', status: 'Present', remark: 'On time' },
    { date: 'June 26, 2026', day: 'Friday', status: 'Present', remark: 'On time' },
    { date: 'June 25, 2026', day: 'Thursday', status: 'Present', remark: 'On time' },
    { date: 'June 24, 2026', day: 'Wednesday', status: 'Absent', remark: 'Informed' },
    { date: 'June 23, 2026', day: 'Tuesday', status: 'Present', remark: 'On time' },
    { date: 'June 22, 2026', day: 'Monday', status: 'Present', remark: 'On time' },
    { date: 'June 20, 2026', day: 'Saturday', status: 'Present', remark: 'On time' },
    { date: 'June 19, 2026', day: 'Friday', status: 'Present', remark: 'On time' },
    { date: 'June 18, 2026', day: 'Thursday', status: 'Late', remark: '15 mins late' },
    { date: 'June 17, 2026', day: 'Wednesday', status: 'Present', remark: 'On time' },
    { date: 'June 16, 2026', day: 'Tuesday', status: 'Present', remark: 'On time' },
    { date: 'June 15, 2026', day: 'Monday', status: 'Present', remark: 'On time' },
  ];

  const totalSessions = 26;
  const presentCount = 24;
  const lateCount = 1;
  const absentCount = 1;
  const attendancePercentage = ((presentCount / totalSessions) * 100).toFixed(1);

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
        <Header />

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          {/* Header Description */}
          <div className="prof-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--secondary) 100%)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>My Attendance Record</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} /> This page displays your official tuition attendance logs. These logs are read-only.
            </p>
          </div>

          {/* Stat summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary-text)' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Attendance Rate</h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-text)', marginTop: '0.5rem' }}>{attendancePercentage}%</div>
            </div>

            <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Present Days</h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.5rem' }}>{presentCount}</div>
            </div>

            <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Late Days</h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.5rem' }}>{lateCount}</div>
            </div>

            <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--danger)' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Absent Days</h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.5rem' }}>{absentCount}</div>
            </div>

          </div>

          {/* Attendance Log Table */}
          <div className="prof-card">
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={20} style={{ color: 'var(--primary-text)' }} /> Detailed Attendance Log
            </h3>
            
            <table className="prof-table">
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th>Day</th>
                  <th>Remarks / Notes</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.map((log, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600 }}>{log.date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.day}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.remark}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${log.status === 'Present' ? 'success' : log.status === 'Late' ? 'warning' : 'danger'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </>
  );
};

export default StudentAttendance;
