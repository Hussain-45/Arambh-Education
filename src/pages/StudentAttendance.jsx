import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Calendar as CalendarIcon, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const StudentAttendance = () => {
  const { loggedInUser, attendance } = useContext(AppContext);

  if (!loggedInUser) return null;

  const myAttendance = attendance.filter(a => a.studentId === loggedInUser.id || a.student_id === loggedInUser.id);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const totalSessions = myAttendance.length;
  const presentCount = myAttendance.filter(a => a.status === 'Present').length;
  const lateCount = myAttendance.filter(a => a.status === 'Late').length;
  const absentCount = myAttendance.filter(a => a.status === 'Absent').length;
  const attendancePercentage = totalSessions > 0 
    ? ((presentCount / totalSessions) * 100).toFixed(1) 
    : '100.0';

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
        <Header />

        <div style={{ width: '100%' }}>
          
          {/* Header Description */}
          <div className="prof-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--secondary) 100%)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>My Attendance Record</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} /> This page displays your official tuition attendance logs. These logs are read-only.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Left Column: Attendance Log Table */}
            <div className="prof-card">
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon size={20} style={{ color: 'var(--primary-text)' }} /> Detailed Attendance Log
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
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
                    {myAttendance.map((log, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{formatDate(log.date)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{getDayName(log.date)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {log.status === 'Present' ? 'On time' : log.status === 'Late' ? 'Late entry' : 'Absent'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge badge-${log.status === 'Present' ? 'success' : log.status === 'Late' ? 'warning' : 'danger'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {myAttendance.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No attendance records found in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Stats Cards and Policy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary-text)', padding: '1.2rem 0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance Rate</h4>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-text)', marginTop: '0.5rem' }}>{attendancePercentage}%</div>
                </div>

                <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--success)', padding: '1.2rem 0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Present Days</h4>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.5rem' }}>{presentCount}</div>
                </div>

                <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--warning)', padding: '1.2rem 0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Late Days</h4>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.5rem' }}>{lateCount}</div>
                </div>

                <div className="prof-card" style={{ textAlign: 'center', borderTop: '4px solid var(--danger)', padding: '1.2rem 0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Absent Days</h4>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.5rem' }}>{absentCount}</div>
                </div>
              </div>

              {/* Attendance Guidelines Policy Card */}
              <div className="prof-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-text)' }}>
                  <CheckCircle2 size={16} /> Attendance Rules
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>Maintain at least <strong>75% attendance</strong> to remain exam-eligible.</li>
                  <li>Late entry (more than 15 mins) marks status as <strong>Late</strong>.</li>
                  <li>Submit parent-signed applications for medical leaves.</li>
                </ul>
              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  );
};

export default StudentAttendance;
