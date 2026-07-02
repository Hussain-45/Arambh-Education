import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import { Sun, Moon, IndianRupee, FileText, Download, Calendar, Award, Bell } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

const StudentDashboard = () => {
  const { loggedInUser, theme, setTheme, fees, assignments, submissions, library, recordFeePayment, announcements } = useContext(AppContext);
  
  if (!loggedInUser) return null;

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const monthsOrder = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const myFeesList = fees.filter(f => f.studentId === loggedInUser.id);
  const sortedFees = [...myFeesList].sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));

  const totalAssigned = myFeesList.reduce((sum, f) => sum + f.total, 0);
  const totalPaid = myFeesList.reduce((sum, f) => sum + f.paid, 0);
  const totalPending = totalAssigned - totalPaid;

  const mySubmissions = submissions.filter(s => s.studentId === loggedInUser.id);
  const myAssignments = assignments.filter(a => a.subject === loggedInUser.class);
  const myLibrary = library.filter(l => l.subject === loggedInUser.class);
  
  const handleDownloadReport = () => {
    const rows = [
      ['Algebra Unit Test', 'June 10, 2026', '45 / 50', 'A'],
      ['Newtonian Mechanics Exam', 'June 18, 2026', '92 / 100', 'A+'],
      ['English Literature Quiz', 'June 22, 2026', '80 / 100', 'B']
    ];
    myAssignments.forEach(a => {
      const sub = mySubmissions.find(s => s.assignmentId === a.id);
      rows.push([a.title, a.dueDate || 'N/A', '—', sub?.grade || 'Submitted']);
    });
    exportToPDF(`${loggedInUser.name} - Report Card`, 'Report Card', rows, ['Test / Assignment', 'Date', 'Marks', 'Grade']);
  };

  const handleDownloadReceipt = (fee) => {
    const rows = [
      ['Student Name', loggedInUser.name],
      ['Admission No.', loggedInUser.admission_number || 'AES1'],
      ['Class/Batch', loggedInUser.class],
      ['Father\'s Name', loggedInUser.fatherName || 'Not Saved'],
      ['Month Paid', fee.month],
      ['Total Fee', `Rs. ${fee.total}`],
      ['Amount Paid', `Rs. ${fee.paid}`],
      ['Payment Mode', fee.paymentMode || 'Online Mock Gateway'],
      ['Payment Date', fee.paymentDate || new Date().toLocaleDateString()]
    ];
    exportToPDF(`Fee_Receipt_${fee.month}_${loggedInUser.name}`, `Fee Payment Receipt`, rows, ['Receipt Item', 'Details']);
  };

  const handleMockPay = async (fee) => {
    const amount = fee.total - fee.paid;
    const confirmPay = window.confirm(`Simulate online payment of Rs. ${amount} for ${fee.month}?`);
    if (confirmPay) {
      await recordFeePayment(loggedInUser.id, amount, 'Online Mock Gateway', new Date().toLocaleDateString(), fee.month);
      alert(`Payment of Rs. ${amount} for ${fee.month} received successfully!`);
    }
  };

  // Get initials for profile avatar
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" style={{ padding: '2rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
        
        {/* Modern Glassmorphic Header */}
        <header className="prof-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--secondary) 100%)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'var(--primary-text)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
              {getInitials(loggedInUser.name)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{loggedInUser.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span><strong>Admission No:</strong> {loggedInUser.admission_number || 'AES1'}</span>
                <span>•</span>
                <span><strong>Batch:</strong> {loggedInUser.class}</span>
                <span>•</span>
                <span><strong>Father's Name:</strong> {loggedInUser.fatherName || '—'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div onClick={toggleTheme} style={{ cursor: 'pointer', padding: '0.6rem', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Active Student</span>
          </div>
        </header>

        {/* Premium Stat Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="prof-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', borderLeft: '4px solid var(--primary-text)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Attendance</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>96.2%</div>
            </div>
          </div>

          <div className="prof-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Tuition Fee</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.2rem' }}>₹{totalPending}</div>
            </div>
          </div>

          <div className="prof-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest Academic Grade</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>A+ (Excellent)</div>
            </div>
          </div>

        </div>

        {/* Class Bulletin & Announcements */}
        <div className="prof-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--warning)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} style={{ color: 'var(--warning)' }} /> Class Bulletin & Announcements
          </h2>
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              No active announcements. Check back later for tuition updates!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{ann.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ann.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Dashboard Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Monthly Fees & Receipts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="prof-card">
              <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }} className="flex-center gap-2">
                  <IndianRupee size={20} style={{ color: 'var(--primary-text)' }} /> Monthly Fee Status & Receipts
                </h2>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span className="badge badge-secondary">Jan - Dec Cycle</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="prof-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Monthly Fee</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th>Payment Mode</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFees.map(fee => (
                      <tr key={fee.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fee.month}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{fee.dueDate}</td>
                        <td>₹{fee.total}</td>
                        <td>₹{fee.paid}</td>
                        <td>
                          <span className={`badge badge-${fee.status === 'Paid' ? 'success' : 'danger'}`} style={{ padding: '0.3rem 0.6rem' }}>
                            {fee.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {fee.paymentMode ? `${fee.paymentMode}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {fee.status !== 'Paid' ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Payment</span>
                          ) : (
                            <button onClick={() => handleDownloadReceipt(fee)} className="prof-btn prof-btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Download size={12} /> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sortedFees.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No monthly fees mapped. Please check with administrator.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Study Materials */}
            <div className="prof-card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem' }}>Study Materials & E-Books</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {myLibrary.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: 'span 2' }}>No study materials uploaded for your batch yet.</p>
                )}
                {myLibrary.map(item => (
                  <a href={item.link} key={item.id} className="flex-between" style={{ textDecoration: 'none', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{item.title}</span>
                    <span className="badge badge-warning">{item.type}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tests/Marks & Attendance history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Academic Tests Card (Read-Only) */}
            <div className="prof-card">
              <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }} className="flex-center gap-1">
                  <Award size={18} style={{ color: 'var(--primary-text)' }} /> Test Grades
                </h3>
                <button onClick={handleDownloadReport} className="prof-btn prof-btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                  <Download size={12}/> Report PDF
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                * Grades and scores are updated by the admin/teachers and are read-only.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Algebra Midterm</span>
                    <span className="badge badge-success">A</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>June 10, 2026</span>
                    <span>Marks: 45 / 50</span>
                  </div>
                </div>
                <div style={{ padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Newtonian Mechanics</span>
                    <span className="badge badge-success">A+</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>June 18, 2026</span>
                    <span>Marks: 92 / 100</span>
                  </div>
                </div>
                <div style={{ padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>English Literature Quiz</span>
                    <span className="badge badge-warning">B</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>June 22, 2026</span>
                    <span>Marks: 80 / 100</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
