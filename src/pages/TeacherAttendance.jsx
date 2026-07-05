import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

const TeacherAttendance = () => {
  const { loggedInUser, classes, students, attendance, markAttendance, triggerMarkAttendance, teachers } = useContext(AppContext);
  
  // Date default to today
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Find the matching teacher record to get their allotted classes
  const teacherRecord = teachers.find(t => t.id === loggedInUser?.id || t.username === loggedInUser?.username || t.email === loggedInUser?.email);
  const allottedClasses = loggedInUser?.assignedClasses || teacherRecord?.assignedClasses || [];

  // Filter based on teacher's assigned classes
  const myClasses = classes.filter(c => 
    allottedClasses.includes(c.name)
  );

  const [selectedClass, setSelectedClass] = useState(myClasses[0]?.name || '10th Math');

  if (!loggedInUser) return null;

  const classStudents = students.filter(s => s.class === selectedClass);

  // Dynamic metrics calculations
  const totalCount = classStudents.length;
  const presentCount = classStudents.filter(s => {
    const record = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
    return record && record.status === 'Present';
  }).length;
  const lateCount = classStudents.filter(s => {
    const record = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
    return record && record.status === 'Late';
  }).length;
  const absentCount = classStudents.filter(s => {
    const record = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
    return record && record.status === 'Absent';
  }).length;
  const unmarkedCount = totalCount - (presentCount + lateCount + absentCount);

  const handleMarkAllPresent = async () => {
    for (const student of classStudents) {
      await markAttendance(student.id, selectedDate, 'Present');
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />

        {/* Page Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Attendance Log Engine</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>Rapidly record student daily presence records.</p>
        </div>

        {/* Controls Panel */}
        <div className="prof-card" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', padding: '1.8rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            {/* Class Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SELECT BATCH</span>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)} 
                className="prof-input" 
                style={{ 
                  width: '240px', 
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  fontWeight: 600,
                  padding: '0.65rem 1rem'
                }}
              >
                {myClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                {myClasses.length === 0 && <option value="10th Math">10th Math</option>}
              </select>
            </div>

            {/* Date Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SELECT DATE</span>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="prof-input" 
                  style={{ 
                    width: '200px', 
                    borderRadius: '10px', 
                    paddingLeft: '2.5rem',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    fontWeight: 600,
                    padding: '0.65rem 1rem 0.65rem 2.5rem'
                  }}
                />
                <CalendarIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* Mark All Present Accelerator */}
          <div>
            <button 
              onClick={handleMarkAllPresent}
              disabled={classStudents.length === 0}
              className="prof-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.8rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                opacity: classStudents.length > 0 ? 1 : 0.5,
                cursor: classStudents.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
              }}
            >
              <Sparkles size={16} /> Mark All Present
            </button>
          </div>
        </div>

        {/* Attendance Summary Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="prof-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--primary-text)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL ROSTER</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 850 }}>{totalCount} Students</span>
          </div>
          <div className="prof-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>PRESENT</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 850, color: '#10b981' }}>{presentCount}</span>
          </div>
          <div className="prof-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>LATE</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 850, color: '#f59e0b' }}>{lateCount}</span>
          </div>
          <div className="prof-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ABSENT</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 850, color: '#ef4444' }}>{absentCount}</span>
          </div>
          <div className="prof-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>UNMARKED</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 850, color: 'var(--text-muted)' }}>{unmarkedCount}</span>
          </div>
        </div>

        {/* Student Roster Matrix */}
        <div className="prof-card" style={{ padding: '1.8rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.8rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, color: 'var(--text-main)' }}>Roster Matrix &bull; {selectedClass}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <Users size={16} color="var(--primary-text)" /> {classStudents.length} Students List
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>ADMISSION ROLL</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>STUDENT NAME</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>STATUS</th>
                  <th style={{ textAlign: 'center', padding: '1rem', width: '360px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>ATTENDANCE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map(student => {
                  const record = attendance.find(a => a.studentId === student.id && a.date === selectedDate);
                  const currentStatus = record ? record.status : '';
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-text)', padding: '1.2rem 1rem' }}>{student.admission_number || `#00${student.id}`}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)', padding: '1.2rem 1rem' }}>{student.name}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        {currentStatus ? (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#10b981', 
                            background: 'rgba(16, 185, 129, 0.1)', 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '6px', 
                            fontWeight: 600,
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            ✓ Marked: {currentStatus}
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)', 
                            background: 'rgba(255,255,255,0.03)', 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '6px', 
                            fontWeight: 500,
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            Not Marked
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.6rem', justifyContent: 'center', alignItems: 'center' }}>
                        
                        {/* Present Toggle */}
                        <button 
                          onClick={() => triggerMarkAttendance(student.id, selectedDate, 'Present')}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.8rem',
                            border: '1px solid',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderColor: currentStatus === 'Present' ? '#10b981' : 'rgba(255,255,255,0.06)',
                            background: currentStatus === 'Present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.01)',
                            color: currentStatus === 'Present' ? '#10b981' : 'var(--text-muted)'
                          }}
                        >
                          <CheckCircle2 size={12} /> Present
                        </button>

                        {/* Late Toggle */}
                        <button 
                          onClick={() => triggerMarkAttendance(student.id, selectedDate, 'Late')}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.8rem',
                            border: '1px solid',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderColor: currentStatus === 'Late' ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                            background: currentStatus === 'Late' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.01)',
                            color: currentStatus === 'Late' ? '#f59e0b' : 'var(--text-muted)'
                          }}
                        >
                          <AlertTriangle size={12} /> Late
                        </button>

                        {/* Absent Toggle */}
                        <button 
                          onClick={() => triggerMarkAttendance(student.id, selectedDate, 'Absent')}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.8rem',
                            border: '1px solid',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderColor: currentStatus === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.06)',
                            background: currentStatus === 'Absent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.01)',
                            color: currentStatus === 'Absent' ? '#ef4444' : 'var(--text-muted)'
                          }}
                        >
                          <XCircle size={12} /> Absent
                        </button>

                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      No students enrolled in this batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default TeacherAttendance;
