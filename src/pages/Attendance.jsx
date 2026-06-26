import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { Download } from 'lucide-react';

const Attendance = () => {
  const { userRole, loggedInUser, students, sendMessage, addToast } = useContext(AppContext);

  const displayStudents = userRole === 'teacher' 
    ? students.filter(s => loggedInUser.assignedClasses?.includes(s.class))
    : students;

  const handleMarkAttendance = (student, status) => {
    if (status === 'Absent') {
      sendMessage(student.parentPhone, 'SMS', `${student.name} is marked Absent today.`);
    } else {
      addToast(`Marked ${student.name} as ${status}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Name', 'Class', 'Parent Phone'];
    const rows = displayStudents.map(s => [s.id, s.name, s.class, s.parentPhone]);
    exportToCSV('attendance_records', rows, headers);
  };

  const handleExportPDF = () => {
    const headers = ['Student ID', 'Name', 'Class', 'Parent Phone'];
    const rows = displayStudents.map(s => [s.id, s.name, s.class, s.parentPhone]);
    exportToPDF('Attendance Roster', 'attendance_records', rows, headers);
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="prof-card" style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Attendance Tracker</h2>
            <div className="flex-center gap-1">
              <button onClick={handleExportCSV} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> CSV
              </button>
              <button onClick={handleExportPDF} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> PDF
              </button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="prof-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{student.class}</td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleMarkAttendance(student, 'Present')} className="prof-btn prof-btn-secondary" style={{ color: 'var(--success)', borderColor: 'var(--success)', background: 'transparent' }}>Present</button>
                      <button onClick={() => handleMarkAttendance(student, 'Late')} className="prof-btn prof-btn-secondary" style={{ color: 'var(--warning)', borderColor: 'var(--warning)', background: 'transparent' }}>Late</button>
                      <button onClick={() => handleMarkAttendance(student, 'Absent')} className="prof-btn prof-btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}>Absent</button>
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

export default Attendance;
