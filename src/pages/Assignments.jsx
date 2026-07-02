import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Check, FileText, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Assignments = () => {
  const { userRole, assignments, submissions, students, loggedInUser, addAssignment, classes } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  // New Assignment State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState('PDF');
  const [newLink, setNewLink] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'

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
  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>My Assignments</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {myAssignments.map(a => {
          const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === loggedInUser.id);
          return (
            <div key={a.id} className="prof-card flex-between">
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{a.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due: {a.dueDate}</p>
                {a.link && (
                  <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', color: 'var(--primary-text)', textDecoration: 'none', fontSize: '0.85rem' }}>
                    <FileText size={14} /> View {a.type}
                  </a>
                )}
              </div>
              <div>
                {sub ? (
                  <span className={`badge badge-${sub.grade ? 'success' : 'warning'}`}>
                    {sub.grade ? `Graded: ${sub.grade}` : 'Submitted'}
                  </span>
                ) : (
                  <button className="prof-btn prof-btn-outline"><Check size={14}/> Submit Work</button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </main>
    </>
  );
};

export default Assignments;
