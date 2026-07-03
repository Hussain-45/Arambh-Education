import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, Plus } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const Classes = () => {
  const { userRole, classes, students, addBatch, addToast } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [newGrade, setNewGrade] = useState('');
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const navigate = useNavigate();

  const handleCreateBatch = async () => {
    if (!newName || !newGrade || !newTime) {
      addToast('Please fill out all fields.', 'warning');
      return;
    }
    const success = await addBatch(newName, newGrade, newTime);
    if (success) {
      setShowModal(false);
      setNewName('');
      setNewGrade('');
      setNewTime('');
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="prof-card" style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Batches</h2>
            {userRole === 'admin' && (
              <button onClick={() => setShowModal(true)} className="prof-btn">
                <Plus size={16} /> Add Batch
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {classes.map((cls) => {
              const enrolledCount = students.filter(s => s.class === cls.name).length;
              return (
                <div 
                  key={cls.id} 
                  onClick={() => navigate(`/classes/${cls.id}`)}
                  style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <span className="badge badge-primary">{cls.grade}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.time}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{cls.name}</h3>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <span className="flex-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Users size={16} /> Enrolled
                    </span>
                    <span style={{ fontWeight: 600 }}>{enrolledCount} Students</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '400px' }}>
              <h3>Add New Batch</h3>
              <select 
                className="prof-input" 
                style={{ marginTop: '1rem', width: '100%' }}
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
              >
                <option value="">Select Grade Level</option>
                <option value="5th Grade">5th Grade</option>
                <option value="6th Grade">6th Grade</option>
                <option value="7th Grade">7th Grade</option>
                <option value="8th Grade">8th Grade</option>
                <option value="9th Grade">9th Grade</option>
                <option value="10th Grade">10th Grade</option>
                <option value="11th Grade">11th Grade</option>
                <option value="12th Grade">12th Grade</option>
              </select>
              <input 
                type="text" 
                placeholder="Batch Name (e.g. 10th - Science Morning)" 
                className="prof-input" 
                style={{ marginTop: '1rem' }} 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Timing (e.g. 08:00 AM - 10:00 AM)" 
                className="prof-input" 
                style={{ marginTop: '1rem' }} 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleCreateBatch} className="prof-btn">Create Batch</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Classes;
