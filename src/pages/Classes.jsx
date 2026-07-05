import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Classes = () => {
  const { userRole, classes, students, addBatch, editBatch, removeBatch, addToast } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetClassId, setTargetClassId] = useState(null);

  const [newGrade, setNewGrade] = useState('');
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newMonthlyFee, setNewMonthlyFee] = useState('');
  const navigate = useNavigate();

  const handleOpenAdd = () => {
    setEditMode(false);
    setNewName('');
    setNewGrade('');
    setNewTime('');
    setNewMonthlyFee('');
    setShowModal(true);
  };

  const handleOpenEdit = (e, cls) => {
    e.stopPropagation(); // prevent card click navigation
    setEditMode(true);
    setTargetClassId(cls.id);
    setNewName(cls.name);
    setNewGrade(cls.grade || '');
    setNewTime(cls.time || '');
    setNewMonthlyFee(cls.monthlyFee || '');
    setShowModal(true);
  };

  const handleSaveBatch = async () => {
    if (!newName || !newGrade || !newTime) {
      addToast('Please fill out all fields.', 'warning');
      return;
    }
    const fee = parseInt(newMonthlyFee) || 0;
    
    if (editMode) {
      const success = await editBatch(targetClassId, newName, newGrade, newTime, fee);
      if (success) {
        setShowModal(false);
      }
    } else {
      const success = await addBatch(newName, newGrade, newTime, fee);
      if (success) {
        setShowModal(false);
      }
    }
  };

  const handleDeleteBatch = async (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete batch "${name}"? All enrolled students will be removed.`)) {
      await removeBatch(id);
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
              <button onClick={handleOpenAdd} className="prof-btn">
                <Plus size={16} /> Add Batch
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {classes.map((cls) => {
              const enrolledCount = students.filter(s => s.class === cls.name).length;
              return (
                <div 
                  key={cls.id} 
                  onClick={() => navigate(`/classes/${cls.id}`)}
                  className="prof-card"
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <span className="badge badge-primary">{cls.grade}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.time}</span>
                  </div>
                  
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{cls.name}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 600, marginBottom: '1rem' }}>
                    Fee: ₹{(cls.monthlyFee || 0).toLocaleString()}/month
                  </div>

                  <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <span className="flex-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Users size={16} /> Enrolled: <strong style={{ color: 'var(--text-color)' }}>{enrolledCount} Students</strong>
                    </span>
                    {userRole === 'admin' && (
                      <div className="flex-center gap-2">
                        <button 
                          onClick={(e) => handleOpenEdit(e, cls)} 
                          className="prof-btn-secondary" 
                          style={{ padding: '4px 8px', borderRadius: '4px' }}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteBatch(e, cls.id, cls.name)} 
                          className="prof-btn-secondary" 
                          style={{ padding: '4px 8px', borderRadius: '4px', color: '#ff4d4f' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '400px' }}>
              <h3>{editMode ? 'Edit Batch' : 'Add New Batch'}</h3>
              
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginTop: '1rem' }}>Grade Level</label>
              <select 
                className="prof-input" 
                style={{ width: '100%', marginTop: '4px' }}
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

              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginTop: '1rem' }}>Batch Name</label>
              <input 
                type="text" 
                placeholder="e.g. 10th - Science Morning" 
                className="prof-input" 
                style={{ width: '100%', marginTop: '4px' }} 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginTop: '1rem' }}>Timing Slot</label>
              <input 
                type="text" 
                placeholder="e.g. 08:00 AM - 10:00 AM" 
                className="prof-input" 
                style={{ width: '100%', marginTop: '4px' }} 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />

              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginTop: '1rem' }}>Monthly Fee (₹)</label>
              <input 
                type="number" 
                placeholder="e.g. 1500" 
                className="prof-input" 
                style={{ width: '100%', marginTop: '4px' }} 
                value={newMonthlyFee}
                onChange={(e) => setNewMonthlyFee(e.target.value)}
              />

              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleSaveBatch} className="prof-btn">{editMode ? 'Save Changes' : 'Create Batch'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Classes;
