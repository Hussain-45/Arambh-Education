import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { BookOpen, Video, FileText, Download, Plus, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const { userRole, library, loggedInUser, addLibraryMaterial, classes, students } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  // New Material State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newType, setNewType] = useState('PDF');
  const [newLink, setNewLink] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'

  // Admin sees all, Student sees their class, Teacher sees their assigned classes
  const displayMaterials = userRole === 'student' 
    ? library.filter(l => l.subject === loggedInUser.class) 
    : userRole === 'teacher'
      ? library.filter(l => loggedInUser.assignedClasses?.includes(l.subject))
      : library;

  const handleCreateMaterial = async () => {
    if (!newTitle || !newSubject) return;
    if (uploadMode === 'link' && !newLink) return;
    if (uploadMode === 'file' && !newFile) return;

    const success = await addLibraryMaterial(newTitle, newSubject, newType, newLink, newFile);
    if (success) {
      setShowModal(false);
      setNewTitle('');
      setNewSubject('');
      setNewType('PDF');
      setNewLink('');
      setNewFile(null);
    }
  };

  const classOptions = userRole === 'teacher' 
    ? classes.filter(c => loggedInUser.assignedClasses?.includes(c.name))
    : classes;

  const content = (
    <div className="prof-card" style={{ flex: 1 }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Study Material Repository</h2>
        {(userRole === 'admin' || userRole === 'teacher') && (
          <button onClick={() => setShowModal(true)} className="prof-btn">
            <Plus size={16} /> Upload Material
          </button>
        )}
      </div>

      {userRole !== 'student' ? (
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
                    Manage Materials <ChevronRight size={14} style={{ marginLeft: '4px' }}/>
                  </button>
                </div>
              </div>
            );
          })}
          {classOptions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No classes available.</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {displayMaterials.map(item => (
            <div key={item.id} className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ color: 'var(--primary-text)' }}>
                {item.type === 'PDF' ? <FileText size={32} /> : <Video size={32} />}
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
              <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <span className="badge badge-warning">{item.subject}</span>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="prof-btn prof-btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                  <Download size={14}/> Open
                </a>
              </div>
            </div>
          ))}
          {displayMaterials.length === 0 && (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No materials found for your batch.</div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div className="prof-card" style={{ width: '400px' }}>
            <h3>Add Study Material</h3>
            
            <input type="text" placeholder="Material Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
            
            <select value={newSubject} onChange={e => setNewSubject(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}>
              <option value="" disabled>Select Class/Batch...</option>
              {classOptions.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
            </select>

            <select value={newType} onChange={e => setNewType(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}>
              <option value="PDF">PDF Document</option>
              <option value="Video">Video / Media</option>
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
                <input type="file" accept="application/pdf, image/*, video/*" onChange={e => setNewFile(e.target.files[0])} className="prof-input" style={{ marginTop: '1rem' }}/>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Max file size: 50MB (PDF, Image, or Video)</small>
              </>
            ) : (
              <input type="url" placeholder="URL Link (e.g. Google Drive, YouTube)" value={newLink} onChange={e => setNewLink(e.target.value)} className="prof-input" style={{ marginTop: '1rem' }}/>
            )}
            
            <div className="flex-between" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-outline">Cancel</button>
              <button onClick={handleCreateMaterial} className="prof-btn">Upload Material</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        {content}
      </main>
    </>
  );
};

export default Library;
