import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import { Sun, Moon, IndianRupee, FileText, Download } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

const StudentDashboard = () => {
  const { loggedInUser, theme, setTheme, fees, assignments, submissions, library } = useContext(AppContext);
  
  if (!loggedInUser) return null;

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const myFee = fees.find(f => f.studentId === loggedInUser.id);
  const mySubmissions = submissions.filter(s => s.studentId === loggedInUser.id);
  const myAssignments = assignments.filter(a => a.subject === loggedInUser.class);
  const myLibrary = library.filter(l => l.subject === loggedInUser.class);
  
  const handleDownloadReport = () => {
    const rows = myAssignments.map(a => {
      const sub = mySubmissions.find(s => s.assignmentId === a.id);
      return [a.title, a.subject, sub?.grade || 'Not Graded'];
    });
    exportToPDF('My Report Card', 'report_card', rows, ['Assignment', 'Subject', 'Grade']);
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <header className="flex-between" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Welcome, {loggedInUser.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{loggedInUser.class} Portal</p>
          </div>
          <div className="flex-center gap-3">
            <div onClick={toggleTheme} style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', background: 'var(--secondary)' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="prof-card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }} className="flex-center gap-1">
                <IndianRupee size={18} /> My Fees
              </h2>
              <span className={`badge badge-${myFee?.status === 'Paid' ? 'success' : 'danger'}`}>
                {myFee?.status || 'Unknown'}
              </span>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>Total Fee:</span> 
                <span style={{ color: 'var(--text-main)' }}>Rs. {myFee?.total || 0}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>Paid Amount:</span> 
                <span style={{ color: 'var(--text-main)' }}>Rs. {myFee?.paid || 0}</span>
              </div>
            </div>
            {myFee && myFee.status !== 'Paid' && (
              <button onClick={() => {
                const amount = myFee.total - myFee.paid;
                // Add a mock simulated payment delay
                setTimeout(() => {
                  alert(`Payment of Rs. ${amount} successful via Mock Gateway.`);
                  // Reload or let them see the toast
                }, 800);
              }} className="prof-btn" style={{ width: '100%' }}>Pay Balance (Rs. {myFee.total - myFee.paid})</button>
            )}
          </div>

          <div className="prof-card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }} className="flex-center gap-1">
                <FileText size={18} /> My Grades
              </h2>
              <button onClick={handleDownloadReport} className="prof-btn prof-btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                <Download size={12}/> PDF
              </button>
            </div>
            <table className="prof-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {myAssignments.map(a => {
                  const sub = mySubmissions.find(s => s.assignmentId === a.id);
                  return (
                    <tr key={a.id}>
                      <td>{a.title}</td>
                      <td>
                        <span className="badge badge-success">{sub?.grade || '-'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="prof-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem' }}>Study Materials</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {myLibrary.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No materials uploaded yet.</p>
              )}
              {myLibrary.map(item => (
                <a href={item.link} key={item.id} className="flex-between" style={{ textDecoration: 'none', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{item.title}</span>
                  <span className="badge badge-warning">{item.type}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
