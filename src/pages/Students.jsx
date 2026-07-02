import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { UserPlus, Download, Users, ChevronRight } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

const Students = () => {
  const { students, classes, addToast, addStudent, userRole, loggedInUser } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const displayClasses = userRole === 'teacher' 
    ? classes.filter(c => (loggedInUser?.assignedClasses || []).includes(c.name))
    : classes;
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFatherName, setNewFatherName] = useState('');

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Class', 'Parent Phone', 'Father Name'];
    const rows = students.map(s => [s.id, s.name, s.class, s.parentPhone, s.fatherName]);
    exportToCSV('students_list', rows, headers);
  };

  const handleAddStudent = () => {
    if (!newName || !newClass || !newPhone || !newFatherName) {
      addToast('Please fill in all fields.', 'warning');
      return;
    }
    
    addStudent(newName, newClass, newPhone, newFatherName);
    setShowModal(false);
    
    // Reset form
    setNewName('');
    setNewClass('');
    setNewPhone('');
    setNewFatherName('');
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Select Batch for Roster</h2>
            <div className="flex-center gap-2">
              <button onClick={handleExportCSV} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export All
              </button>
              <button onClick={() => setShowModal(true)} className="prof-btn">
                <UserPlus size={16} /> Add Student
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {displayClasses.map((cls) => {
              const enrolled = students.filter(s => s.class === cls.name).length;
              return (
                <div key={cls.id} className="prof-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => navigate(`/classes/${cls.id}`, { state: { activeTab: 'roster' } })}>
                  <div className="flex-between">
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{cls.name}</h3>
                    <span className="badge badge-warning">{cls.grade}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} /> {enrolled} Students Enrolled
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="prof-btn prof-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      View Roster <ChevronRight size={14} style={{ marginLeft: '4px' }}/>
                    </button>
                  </div>
                </div>
              );
            })}
            {displayClasses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No classes available.</p>}
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '400px' }}>
              <h3>Add New Student</h3>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="prof-input" 
                style={{ marginTop: '1rem' }} 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Father's Name" 
                className="prof-input" 
                style={{ marginTop: '1rem' }} 
                value={newFatherName}
                onChange={(e) => setNewFatherName(e.target.value)}
              />
              <select 
                className="prof-input" 
                style={{ marginTop: '1rem', width: '100%' }}
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
              >
                <option value="">Select Batch/Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
              <input 
                type="tel" 
                placeholder="Parent Phone" 
                className="prof-input" 
                style={{ marginTop: '1rem' }} 
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleAddStudent} className="prof-btn">Save Student</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Students;
