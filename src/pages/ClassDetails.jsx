import React, { useContext, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import FeeReceiptModal from '../components/FeeReceiptModal';
import { ArrowLeft, Users, IndianRupee, BookOpen, Download, FileText } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, classes, students, fees, assignments, library, addStudent, removeStudent, removeBatch, sendMessage, addToast, recordFeePayment, markAttendance } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'roster');
  
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentBirthdate, setNewStudentBirthdate] = useState('');
  
  const [selectedReceiptFee, setSelectedReceiptFee] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);

  const classData = classes.find(c => c.id === parseInt(id));
  if (!classData) return <div>Class Not Found</div>;

  const classStudents = students.filter(s => s.class === classData.name);
  const classStudentIds = classStudents.map(s => s.id);
  const classFees = fees.filter(f => classStudentIds.includes(f.studentId));
  const classAssignments = assignments.filter(a => a.subject === classData.name);
  const classLibrary = library.filter(l => l.subject === classData.name);

  const handleExportFees = () => {
    const filteredFees = classFees.filter(f => f.month === selectedMonth);
    const rows = filteredFees.map(f => {
      const studentName = classStudents.find(s => s.id === f.studentId)?.name || 'Unknown';
      return [studentName, `Rs. ${f.total}`, `Rs. ${f.paid}`, `Rs. ${f.total - f.paid}`, f.status];
    });
    exportToPDF(`${classData.name} - Fee Report (${selectedMonth})`, 'fee_report', rows, ['Student', 'Total', 'Paid', 'Balance', 'Status']);
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentPhone) return;
    await addStudent(newStudentName, classData.name, newStudentPhone, null, newStudentEmail, newStudentBirthdate);
    setShowAddStudent(false);
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentEmail('');
    setNewStudentBirthdate('');
  };

  const handleMarkAttendance = async (student, status) => {
    const today = new Date().toISOString().split('T')[0];
    await markAttendance(student.id, today, status);
    if (status === 'Absent') {
      sendMessage(student.parentPhone, 'Auto-WhatsApp', `${student.name} is marked Absent today.`);
    }
  };

  const handleSendReminder = (fee) => {
    const student = classStudents.find(s => s.id === fee.studentId);
    const amountDue = fee.total - fee.paid;
    sendMessage(student.parentPhone, 'Auto-WhatsApp', `Reminder: Monthly tuition fee of Rs.${amountDue} for ${student.name} for the month of ${fee.month} is due. Please clear it soon. - Aarambh`);
    addToast(`WhatsApp reminder sent to ${student.name}'s parent`, 'success');
  };

  const handleRemoveBatch = async () => {
    if (window.confirm(`Are you sure you want to delete the batch "${classData.name}"? This action cannot be undone.`)) {
      const success = await removeBatch(classData.id);
      if (success) {
        navigate('/students');
      }
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/students')} className="prof-btn prof-btn-secondary" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{classData.name}</h2>
              <span className="badge badge-warning">{classData.grade}</span>
            </div>
          </div>
          {userRole === 'admin' && (
            <button onClick={handleRemoveBatch} className="prof-btn prof-btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Delete Batch
            </button>
          )}
        </div>

        <div className="prof-card" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{classData.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{classData.grade} • {classData.time}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => setActiveTab('roster')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1rem', borderBottom: activeTab === 'roster' ? '3px solid var(--primary-text)' : '3px solid transparent', color: activeTab === 'roster' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> Roster
          </button>
          {userRole !== 'teacher' && (
            <button onClick={() => setActiveTab('fees')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1rem', borderBottom: activeTab === 'fees' ? '3px solid var(--primary-text)' : '3px solid transparent', color: activeTab === 'fees' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IndianRupee size={16} /> Class Fees
            </button>
          )}
          <button onClick={() => setActiveTab('attendance')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1rem', borderBottom: activeTab === 'attendance' ? '3px solid var(--primary-text)' : '3px solid transparent', color: activeTab === 'attendance' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> Attendance
          </button>
          <button onClick={() => setActiveTab('academics')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1rem', borderBottom: activeTab === 'academics' ? '3px solid var(--primary-text)' : '3px solid transparent', color: activeTab === 'academics' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} /> Academics
          </button>
        </div>

        {activeTab === 'roster' && (
          <div className="prof-card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Enrolled Students ({classStudents.length})</h3>
              {userRole === 'admin' && (
                <button onClick={() => setShowAddStudent(true)} className="prof-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Users size={14} style={{ marginRight: '4px' }} /> Add Student
                </button>
              )}
            </div>
            <table className="prof-table">
              <thead><tr><th>ID</th><th>Name</th><th>Father's Name</th><th>Parent Phone</th><th>Actions</th></tr></thead>
              <tbody>
                {classStudents.map(student => (
                  <tr key={student.id}>
                    <td><span className="badge badge-secondary">{student.admission_number || `#${student.id}`}</span></td>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{student.fatherName || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{student.parentPhone}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="prof-btn prof-btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => { if(window.confirm('Remove this student?')) removeStudent(student.id); }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {classStudents.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="prof-card">
            <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Fee Records</h3>
                <select 
                  className="prof-input" 
                  style={{ width: '180px', padding: '0.4rem' }}
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleExportFees} className="prof-btn prof-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}><Download size={14} /> Export PDF</button>
            </div>
            <table className="prof-table">
              <thead><tr><th>Student</th><th>Total Fee</th><th>Paid</th><th>Mode/Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {classFees.filter(fee => fee.month === selectedMonth).map(fee => {
                  const s = classStudents.find(st => st.id === fee.studentId);
                  return (
                    <tr key={fee.id}>
                      <td>{s?.name}</td>
                      <td>Rs. {fee.total}</td>
                      <td>Rs. {fee.paid}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {fee.paymentMode ? `${fee.paymentMode} - ${fee.paymentDate}` : 'N/A'}
                      </td>
                      <td><span className={`badge badge-${fee.status === 'Paid' ? 'success' : fee.status === 'Pending' ? 'warning' : 'danger'}`}>{fee.status}</span></td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        {fee.status !== 'Paid' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <select 
                              id={`pay-mode-${fee.id}`} 
                              defaultValue="Cash" 
                              className="prof-input" 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto', margin: 0, height: '30px' }}
                            >
                              <option value="Cash">💵 Cash</option>
                              <option value="Online">💳 Online</option>
                            </select>
                            <button 
                              onClick={() => {
                                const mode = document.getElementById(`pay-mode-${fee.id}`).value;
                                recordFeePayment(fee.studentId, fee.total - fee.paid, mode, new Date().toLocaleDateString(), selectedMonth);
                              }} 
                              className="prof-btn prof-btn-secondary" 
                              style={{ color: 'var(--success)', borderColor: 'var(--success)', background: 'transparent', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              Mark Paid
                            </button>
                            <button onClick={() => handleSendReminder(fee)} className="prof-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Send Reminder</button>
                          </div>
                        )}
                        {fee.status === 'Paid' && (
                          <button onClick={() => { setSelectedReceiptFee(fee); setIsReceiptModalOpen(true); }} className="prof-btn prof-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <FileText size={12} /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {classFees.filter(fee => fee.month === selectedMonth).length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No fee records found for {selectedMonth}.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="prof-card">
            <h3 style={{ margin: 0, marginBottom: '1.5rem' }}>Mark Attendance</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table">
                <thead>
                  <tr><th>Student</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {classStudents.map((student) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 500 }}>{student.name} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem'}}>{student.admission_number || `#${student.id}`}</span></td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleMarkAttendance(student, 'Present')} className="prof-btn prof-btn-secondary" style={{ color: 'var(--success)', borderColor: 'var(--success)', background: 'transparent' }}>Present</button>
                        <button onClick={() => handleMarkAttendance(student, 'Late')} className="prof-btn prof-btn-secondary" style={{ color: 'var(--warning)', borderColor: 'var(--warning)', background: 'transparent' }}>Late</button>
                        <button onClick={() => handleMarkAttendance(student, 'Absent')} className="prof-btn prof-btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}>Absent</button>
                      </td>
                    </tr>
                  ))}
                  {classStudents.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'academics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="prof-card">
              <h3 style={{ marginTop: 0 }}>Assignments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classAssignments.map(a => (
                  <div key={a.id} className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{a.title}</span>
                    <span className="badge badge-warning">Due: {a.dueDate}</span>
                  </div>
                ))}
                {classAssignments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No assignments.</p>}
              </div>
            </div>
            
            <div className="prof-card">
              <h3 style={{ marginTop: 0 }}>Study Materials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classLibrary.map(item => (
                  <div key={item.id} className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    <span className="badge badge-success">{item.type}</span>
                  </div>
                ))}
                {classLibrary.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No materials uploaded.</p>}
              </div>
            </div>
          </div>
        )}

        {showAddStudent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '400px' }}>
              <h3>Add Student to {classData.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student will be assigned the default password 'pass'.</p>
              
              <input type="text" placeholder="Student Full Name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
              <input type="text" placeholder="Parent Phone Number" value={newStudentPhone} onChange={e => setNewStudentPhone(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
              <input type="email" placeholder="Parent Email Address" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
              <div style={{ position: 'relative', marginTop: '1rem' }}>
                <input type="date" placeholder="Student Birthdate" value={newStudentBirthdate} onChange={e => setNewStudentBirthdate(e.target.value)} className="prof-input" style={{ width: '100%' }}/>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Birthdate</span>
              </div>
              
              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setShowAddStudent(false)} className="prof-btn prof-btn-outline">Cancel</button>
                <button onClick={handleAddStudent} className="prof-btn">Add to Batch</button>
              </div>
            </div>
          </div>
        )}

        <FeeReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => { setIsReceiptModalOpen(false); setSelectedReceiptFee(null); }}
          fee={selectedReceiptFee}
          student={classStudents.find(s => s.id === selectedReceiptFee?.studentId)}
          className={classData.name}
        />
      </main>
    </>
  );
};

export default ClassDetails;
