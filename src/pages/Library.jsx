import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { BookOpen, Video, FileText, Download, Plus } from 'lucide-react';

const Library = () => {
  const { userRole, library, loggedInUser, addLibraryMaterial, classes } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {displayMaterials.map(item => (
          <div key={item.id} style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-main)' }}>
            <div style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
              {item.type === 'PDF' ? <FileText size={32} /> : <Video size={32} />}
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</h3>
            <div className="flex-between">
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

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div className="prof-card" style={{ width: '400px' }}>
            <h3>Add Library Material</h3>
            
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
              <input type="file" accept={newType === 'PDF' ? "application/pdf" : "video/*"} onChange={e => setNewFile(e.target.files[0])} className="prof-input" style={{ marginTop: '1rem' }}/>
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
