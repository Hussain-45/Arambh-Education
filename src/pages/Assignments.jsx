import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Check, FileText } from 'lucide-react';

const Assignments = () => {
  const { userRole, assignments, submissions, students, loggedInUser, addAssignment, classes } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  
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
          <div className="prof-card" style={{ flex: 1 }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Assignments & Gradebook</h2>
              <button onClick={() => setShowModal(true)} className="prof-btn"><Plus size={16} /> New Assignment</button>
            </div>
            
            <table className="prof-table">
              <thead><tr><th>Title</th><th>Subject</th><th>Due Date</th><th>Material</th><th>Submissions</th></tr></thead>
              <tbody>
                {displayAssignments.map(a => {
                  const subsCount = submissions.filter(s => s.assignmentId === a.id).length;
                  const totalInClass = students.filter(s => s.class === a.subject).length;
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.title}</td>
                      <td><span className="badge badge-warning">{a.subject}</span></td>
                      <td>{a.dueDate}</td>
                      <td>
                        {a.link ? (
                          <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={14} /> Open {a.type}
                          </a>
                        ) : 'None'}
                      </td>
                      <td>{subsCount} / {totalInClass}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                  <input type="file" accept={newType === 'PDF' ? "application/pdf" : "image/*"} onChange={e => setNewFile(e.target.files[0])} className="prof-input" style={{ marginTop: '1rem' }}/>
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
                  <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
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
