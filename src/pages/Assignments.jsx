import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Check, FileText, Users, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Assignments = () => {
  const { 
    userRole, assignments, submissions, students, loggedInUser, addAssignment, classes,
    addSubmission, addOfflineSubmission, syncOfflineSubmissions, pendingUploads 
  } = useContext(AppContext);
  
  const [showModal, setShowModal] = useState(false);
  
  // Offline Simulation and Submission States
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submitLink, setSubmitLink] = useState('');
  const [submitText, setSubmitText] = useState('');

  const navigate = useNavigate();
  
  // New Assignment Form State (Admin/Teacher)
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState('PDF');
  const [newLink, setNewLink] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'

  // Effect: Self-Healing Offline Sync on Toggle off or reconnect
  useEffect(() => {
    if (!isOfflineSimulated && navigator.onLine) {
      syncOfflineSubmissions();
    }
  }, [isOfflineSimulated, syncOfflineSubmissions]);

  // Effect: Sync on browser online event
  useEffect(() => {
    const handleOnline = () => {
      if (!isOfflineSimulated) {
        syncOfflineSubmissions();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOfflineSimulated, syncOfflineSubmissions]);

  // Filter logic
  const displayAssignments = userRole === 'student' 
    ? assignments.filter(a => a.subject === loggedInUser.class)
    : userRole === 'teacher'
      ? assignments.filter(a => loggedInUser.assignedClasses?.includes(a.subject))
      : assignments;

  const handleCreateAssignment = async () => {
    if (!newTitle || !newSubject || !newDueDate) return;
    if (uploadMode === 'link' && !newLink) return;
    if (uploadMode === 'file' && !newFile) return;

    const success = await addAssignment(newTitle, newSubject, newDueDate, newType, newLink, newFile);
    if (success) {
      setShowModal(false);
      setNewTitle('');
      setNewSubject('');
      setNewDueDate('');
      setNewType('PDF');
      setNewLink('');
      setNewFile(null);
    }
  };

  const handleSubmitWork = () => {
    if (!submittingAssignment) return;
    
    // Check simulated or real offline status
    if (isOfflineSimulated || !navigator.onLine) {
      addOfflineSubmission(submittingAssignment.id, loggedInUser.id, submitLink, submitText);
    } else {
      addSubmission(submittingAssignment.id, loggedInUser.id, submitLink, submitText);
    }

    // Reset and close
    setSubmittingAssignment(null);
    setSubmitLink('');
    setSubmitText('');
  };

  // If Admin or Teacher
  if (userRole === 'admin' || userRole === 'teacher') {
    const classOptions = userRole === 'teacher' 
      ? classes.filter(c => loggedInUser.assignedClasses?.includes(c.name))
      : classes;

    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          <div style={{ flex: 1 }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Select Batch for Assignments</h2>
              <button onClick={() => setShowModal(true)} className="prof-btn"><Plus size={16} /> New Assignment</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {classOptions.map((cls) => {
                const enrolled = students.filter(s => s.class === cls.name).length;
                return (
                  <div key={cls.id} className="prof-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => navigate(`/classes/${cls.id}`, { state: { activeTab: 'academics' } })}>
                    <div className="flex-between">
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{cls.name}</h3>
                      <span className="badge badge-warning">{cls.grade}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} /> {enrolled} Students Enrolled
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="prof-btn prof-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Manage Academics <ChevronRight size={14} style={{ marginLeft: '4px' }}/>
                      </button>
                    </div>
                  </div>
                );
              })}
              {classOptions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No classes available.</p>}
            </div>
          </div>
          
          {showModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
              <div className="prof-card" style={{ width: '400px' }}>
                <h3>Create Assignment</h3>
                <input type="text" placeholder="Assignment Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
                
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}>
                  <option value="" disabled>Select Class/Batch...</option>
                  {classOptions.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                </select>

                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
                
                <select value={newType} onChange={e => setNewType(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}>
                  <option value="PDF">PDF Document</option>
                  <option value="Image">Image</option>
                </select>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                    <input type="radio" checked={uploadMode === 'file'} onChange={() => setUploadMode('file')} /> Upload File
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                    <input type="radio" checked={uploadMode === 'link'} onChange={() => setUploadMode('link')} /> Paste URL
                  </label>
                </div>

                {uploadMode === 'file' ? (
                  <>
                    <input type="file" accept="application/pdf, image/*" onChange={e => setNewFile(e.target.files[0])} className="prof-input" style={{ marginTop: '1rem' }}/>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Max file size: 50MB (PDF or Image)</small>
                  </>
                ) : (
                  <input type="url" placeholder="Material URL (Drive, Dropbox, etc)" value={newLink} onChange={e => setNewLink(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
                )}
                
                <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                  <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-outline">Cancel</button>
                  <button onClick={handleCreateAssignment} className="prof-btn">Create</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </>
    );
  }

  // If Student
  const myAssignments = assignments.filter(a => a.subject === loggedInUser.class);

  const getUrgencyData = (dueDateStr) => {
    try {
      const now = new Date();
      const due = new Date(dueDateStr);
      if (isNaN(due.getTime())) return { percent: 100, color: 'var(--primary-text)', bg: 'rgba(99,102,241,0.1)', text: 'No due date limit' };
      const diffMs = due.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffMs < 0) {
        return { percent: 100, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: 'Overdue / Submission Closed' };
      }
      
      if (diffHours < 24) {
        // Critical: Crimson
        const percent = Math.max(10, Math.min(100, (diffHours / 24) * 100));
        return { percent, color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', text: `Urgent: ${Math.floor(diffHours)} hours left!` };
      } else if (diffHours < 72) {
        // Moderate: Amber
        const percent = Math.max(10, Math.min(100, (diffHours / 72) * 100));
        return { percent, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: `${Math.floor(diffHours / 24)} days remaining` };
      } else {
        // Stable: Indigo
        return { percent: 100, color: 'var(--primary-text)', bg: 'rgba(99,102,241,0.1)', text: 'On track / Normal schedule' };
      }
    } catch (e) {
      return { percent: 100, color: 'var(--primary-text)', bg: 'rgba(99,102,241,0.1)', text: 'Stable' };
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        {/* Page title + Offline simulator control toggle */}
        <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Assignments</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Manage and submit your class assignments</p>
          </div>
          
          {/* Offline Simulator Switch */}
          <div className="prof-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isOfflineSimulated ? (
              <WifiOff size={16} color="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} />
            ) : (
              <Wifi size={16} color="#10b981" />
            )}
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Simulate Offline Mode</span>
            <input 
              type="checkbox" 
              checked={isOfflineSimulated}
              onChange={(e) => setIsOfflineSimulated(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myAssignments.map(a => {
            const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === loggedInUser.id);
            const urgency = getUrgencyData(a.due_date || a.dueDate);
            return (
              <div key={a.id} className="prof-card flex-between" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{a.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due: {a.due_date || a.dueDate}</p>
                  
                  {/* Urgency Progress Bar */}
                  {!sub && (
                    <div style={{ marginTop: '0.8rem', width: '100%', maxWidth: '280px' }}>
                      <div className="flex-between" style={{ fontSize: '0.75rem', color: urgency.color, fontWeight: 700, marginBottom: '0.25rem' }}>
                        <span>{urgency.text}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${urgency.percent}%`, height: '100%', background: urgency.color, transition: 'width 0.5s ease-in-out' }}></div>
                      </div>
                    </div>
                  )}

                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', color: 'var(--primary-text)', textDecoration: 'none', fontSize: '0.85rem' }}>
                      <FileText size={14} /> View {a.type}
                    </a>
                  )}
                </div>
                <div>
                  {sub ? (
                    <span 
                      className={`badge badge-${
                        sub.status === 'Syncing Offline' 
                          ? 'warning' 
                          : sub.grade 
                            ? 'success' 
                            : 'warning'
                      }`}
                      style={sub.status === 'Syncing Offline' ? { animation: 'pulse 1.5s infinite', border: '1px solid var(--warning)' } : {}}
                    >
                      {sub.status === 'Syncing Offline' 
                        ? '⏳ Syncing Offline' 
                        : sub.grade 
                          ? `Graded: ${sub.grade}` 
                          : 'Submitted'
                      }
                    </span>
                  ) : (
                    <button 
                      onClick={() => setSubmittingAssignment(a)}
                      className="prof-btn prof-btn-outline"
                    >
                      <Check size={14}/> Submit Work
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {myAssignments.length === 0 && (
            <div className="prof-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No assignments assigned for your batch yet.
            </div>
          )}
        </div>

        {/* Submit Work Modal */}
        {submittingAssignment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '1rem' }}>Submit Assignment</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Assignment: <strong>{submittingAssignment.title}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    Submission Link / URL (Drive, Github, etc.)
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/your-submission" 
                    value={submitLink}
                    onChange={(e) => setSubmitLink(e.target.value)}
                    className="prof-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    Additional Comments / Notes (Optional)
                  </label>
                  <textarea 
                    placeholder="Describe your submission details..." 
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    className="prof-input"
                    rows={4}
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Simulation Status Badge inside modal */}
              {(isOfflineSimulated || !navigator.onLine) && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(245,158,11,0.1)',
                  borderRadius: '6px',
                  border: '1px solid var(--warning)',
                  fontSize: '0.75rem',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <WifiOff size={14} />
                  <span>Offline simulation active. This submission will be queued in local storage.</span>
                </div>
              )}

              <div className="flex-between" style={{ marginTop: '2rem' }}>
                <button 
                  onClick={() => {
                    setSubmittingAssignment(null);
                    setSubmitLink('');
                    setSubmitText('');
                  }} 
                  className="prof-btn prof-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitWork}
                  disabled={!submitLink.trim()}
                  className="prof-btn"
                  style={{ opacity: submitLink.trim() ? 1 : 0.6, cursor: submitLink.trim() ? 'pointer' : 'not-allowed' }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
};

export default Assignments;
