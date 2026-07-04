import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, FileText, ChevronRight, MessageSquare, Download, Calendar, Mail, ArrowLeft, BookOpen } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const MyBatches = () => {
  const { id } = useParams();
  
  if (id) {
    return <BatchDrilldown classId={Number(id)} />;
  }
  return <BatchesMainView />;
};

// 1. MAIN BATCHES GRID VIEW
const BatchesMainView = () => {
  const { loggedInUser, classes, students, teachers } = useContext(AppContext);
  const navigate = useNavigate();

  // Find the matching teacher record to get their allotted classes
  const teacherRecord = teachers.find(t => t.id === loggedInUser?.id || t.username === loggedInUser?.username || t.email === loggedInUser?.email);
  const allottedClasses = loggedInUser?.assignedClasses || teacherRecord?.assignedClasses || [];

  // Filter classes assigned to the teacher
  const myClasses = classes.filter(c => 
    allottedClasses.includes(c.name)
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        {/* Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>My Assigned Batches</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>Overview of active classes and student counts.</p>
        </div>

        {/* Batches Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {myClasses.map((cls) => {
            const enrolledCount = students.filter(s => s.class === cls.name).length;
            return (
              <div 
                key={cls.id} 
                onClick={() => navigate(`/classes/${cls.id}`)}
                className="prof-card"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem' }}
              >
                <div className="flex-between">
                  <span className="badge badge-primary" style={{ padding: '0.35rem 0.7rem', fontWeight: 700 }}>{cls.grade || 'Grade Level'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{cls.time}</span>
                </div>
                
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{cls.name}</h3>
                  <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weekly Session Slot</p>
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginTop: '0.8rem' }}>
                  <span className="flex-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Users size={16} color="var(--primary-text)" /> Enrolled
                  </span>
                  <span style={{ fontWeight: 850, color: 'var(--text-main)', fontSize: '1.05rem' }}>{enrolledCount} Students</span>
                </div>
              </div>
            );
          })}
          {myClasses.length === 0 && (
            <div className="prof-card" style={{ gridColumn: 'span 3', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No batches assigned to your teacher profile yet.
            </div>
          )}
        </div>
      </main>
    </>
  );
};

// 2. DETAILED BATCH ROSTER & WORKSPACE DRILLDOWN
const BatchDrilldown = ({ classId }) => {
  const { classes, students, assignments, library, attendance, teachers, loggedInUser, markAttendance } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const classData = classes.find(c => c.id === classId);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'roster');

  // Date default to today
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Find the matching teacher record to get their allotted classes
  const teacherRecord = teachers.find(t => t.id === loggedInUser?.id || t.username === loggedInUser?.username || t.email === loggedInUser?.email);
  const allottedClasses = loggedInUser?.assignedClasses || teacherRecord?.assignedClasses || [];
  
  const isAllotted = classData && allottedClasses.includes(classData.name);

  if (!classData) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="prof-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Batch record not found.</p>
            <button onClick={() => navigate('/classes')} className="prof-btn">Back to Batches</button>
          </div>
        </main>
      </>
    );
  }

  // Access control check
  if (!isAllotted) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="prof-card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h2 style={{ color: '#ef4444', margin: 0, marginBottom: '0.8rem', fontWeight: 800 }}>Access Denied</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              You are not authorized to view or manage this batch. Please contact administration for allotment requests.
            </p>
            <button onClick={() => navigate('/classes')} className="prof-btn">
              Back to My Batches
            </button>
          </div>
        </main>
      </>
    );
  }

  const classStudents = students.filter(s => s.class === classData.name);
  const classAssignments = assignments.filter(a => a.subject === classData.name);
  const classLibrary = library.filter(l => l.subject === classData.name);

  // Quick stats calculations
  const calculateAttendanceRate = (studentId) => {
    const records = attendance.filter(a => a.studentId === studentId);
    if (records.length === 0) return '100%';
    const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    return `${Math.round((present / records.length) * 100)}%`;
  };

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

        {/* Back navigation & Batch details */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button 
            onClick={() => navigate('/classes')} 
            className="prof-btn prof-btn-secondary" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              marginBottom: '1.2rem', 
              padding: '0.45rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.03)'
            }}
          >
            <ArrowLeft size={14} /> Back to Batches
          </button>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{classData.name}</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>Batch Details &bull; Time Slot: {classData.time}</p>
            </div>
            <div className="badge badge-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', fontWeight: 700 }}>
              {classData.grade}
            </div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', gap: '1.8rem' }}>
          <button 
            onClick={() => setActiveTab('roster')} 
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.8rem 0.2rem', 
              borderBottom: activeTab === 'roster' ? '3px solid var(--primary-text)' : '3px solid transparent', 
              color: activeTab === 'roster' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            Enrolled Students List
          </button>
          <button 
            onClick={() => setActiveTab('attendance')} 
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.8rem 0.2rem', 
              borderBottom: activeTab === 'attendance' ? '3px solid var(--primary-text)' : '3px solid transparent', 
              color: activeTab === 'attendance' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            Mark Attendance
          </button>
          <button 
            onClick={() => setActiveTab('deployed')} 
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.8rem 0.2rem', 
              borderBottom: activeTab === 'deployed' ? '3px solid var(--primary-text)' : '3px solid transparent', 
              color: activeTab === 'deployed' ? 'var(--primary-text)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            Batch Deployments ({classAssignments.length + classLibrary.length})
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'roster' && (
          <div className="prof-card" style={{ padding: '1.8rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, color: 'var(--text-main)' }}>Enrolled Students List</h3>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', padding: '0.35rem 0.7rem', fontWeight: 700 }}>
                {classStudents.length} Active Records
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>ADMISSION ROLL</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>STUDENT NAME</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>PARENT PHONE CONTACT</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>EMAIL ADDRESS</th>
                    <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>ATTENDANCE RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                      <td style={{ fontWeight: 750, color: 'var(--primary-text)', padding: '1.2rem 1rem' }}>{student.admission_number || `#00${student.id}`}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)', padding: '1.2rem 1rem' }}>{student.name}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{student.parent_phone || '9876543210'}</span>
                          <a 
                            href={`https://wa.me/${student.parent_phone || '9876543210'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="badge badge-success"
                            style={{ 
                              padding: '0.25rem 0.6rem', fontSize: '0.7rem', textDecoration: 'none', 
                              display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 
                            }}
                          >
                            <MessageSquare size={10} /> WhatsApp Alert
                          </a>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)', padding: '1.2rem 1rem', fontWeight: 500 }}>{student.email}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#10b981', padding: '1.2rem 1rem' }}>
                        {calculateAttendanceRate(student.id)}
                      </td>
                    </tr>
                  ))}
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        No students enrolled in this batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Integrated Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="prof-card" style={{ padding: '1.8rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, color: 'var(--text-main)' }}>Daily Attendance Sheet</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Record presence logs directly for this batch.</span>
              </div>

              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="prof-input" 
                    style={{ 
                      width: '190px', 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem 0.6rem 2.5rem',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  <Calendar size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <button 
                  onClick={handleMarkAllPresent}
                  disabled={classStudents.length === 0}
                  className="prof-btn"
                  style={{ padding: '0.7rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, opacity: classStudents.length > 0 ? 1 : 0.5 }}
                >
                  Mark All Present
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>ROLL NUMBER</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>STUDENT NAME</th>
                    <th style={{ textAlign: 'center', padding: '1rem', width: '340px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>TOGGLE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(student => {
                    const record = attendance.find(a => a.studentId === student.id && a.date === selectedDate);
                    const currentStatus = record ? record.status : '';
                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                        <td style={{ fontWeight: 750, color: 'var(--primary-text)', padding: '1.2rem 1rem' }}>{student.admission_number || `#00${student.id}`}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)', padding: '1.2rem 1rem' }}>{student.name}</td>
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.6rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => markAttendance(student.id, selectedDate, 'Present')}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.8rem',
                              border: '1px solid',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              transition: 'all 0.2s ease',
                              borderColor: currentStatus === 'Present' ? '#10b981' : 'rgba(255,255,255,0.06)',
                              background: currentStatus === 'Present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.01)',
                              color: currentStatus === 'Present' ? '#10b981' : 'var(--text-muted)'
                            }}
                          >
                            Present
                          </button>
                          <button 
                            onClick={() => markAttendance(student.id, selectedDate, 'Late')}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.8rem',
                              border: '1px solid',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              transition: 'all 0.2s ease',
                              borderColor: currentStatus === 'Late' ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                              background: currentStatus === 'Late' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.01)',
                              color: currentStatus === 'Late' ? '#f59e0b' : 'var(--text-muted)'
                            }}
                          >
                            Late
                          </button>
                          <button 
                            onClick={() => markAttendance(student.id, selectedDate, 'Absent')}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.8rem',
                              border: '1px solid',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              transition: 'all 0.2s ease',
                              borderColor: currentStatus === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.06)',
                              background: currentStatus === 'Absent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.01)',
                              color: currentStatus === 'Absent' ? '#ef4444' : 'var(--text-muted)'
                            }}
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No students enrolled in this batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'deployed' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            
            {/* Deployments: Assignments */}
            <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-main)' }}>
                <BookOpen size={20} color="var(--primary-text)" /> Deployed Assignments
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {classAssignments.map(a => (
                  <div 
                    key={a.id} 
                    style={{ 
                      padding: '1.2rem', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)', 
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <div className="flex-between">
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700 }}>{a.title}</strong>
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Due: {a.dueDate || a.due_date}</span>
                    </div>
                    {a.link && (
                      <a 
                        href={a.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px', 
                          color: 'var(--primary-text)', fontSize: '0.85rem', textDecoration: 'none',
                          fontWeight: 700
                        }}
                      >
                        <FileText size={14} /> Open Homework Sheet ({a.type})
                      </a>
                    )}
                  </div>
                ))}
                {classAssignments.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                    No assignments deployed to this batch yet.
                  </p>
                )}
              </div>
            </div>

            {/* Deployments: Study Materials */}
            <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-main)' }}>
                <FileText size={20} color="var(--warning)" /> Shared Study Material
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {classLibrary.map(item => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: '1.2rem', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)', 
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <div className="flex-between">
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700 }}>{item.title}</strong>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.type}</span>
                    </div>
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px', 
                          color: 'var(--primary-text)', fontSize: '0.85rem', textDecoration: 'none',
                          fontWeight: 700
                        }}
                      >
                        <Download size={14} /> Open Reference Link
                      </a>
                    )}
                  </div>
                ))}
                {classLibrary.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                    No study materials uploaded for this batch yet.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
};

export default MyBatches;
