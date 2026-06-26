import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { UserPlus, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const Students = () => {
  const { students, classes, addToast, addStudent } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Class', 'Parent Phone'];
    const rows = students.map(s => [s.id, s.name, s.class, s.parentPhone]);
    exportToCSV('students_list', rows, headers);
  };

  const handleAddStudent = () => {
    if (!newName || !newClass || !newPhone) {
      addToast('Please fill in all fields.', 'warning');
      return;
    }
    
    addStudent(newName, newClass, newPhone);
    setShowModal(false);
    
    // Reset form
    setNewName('');
    setNewClass('');
    setNewPhone('');
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="prof-card" style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Student Directory</h2>
            <div className="flex-center gap-2">
              <button onClick={handleExportCSV} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export
              </button>
              <button onClick={() => setShowModal(true)} className="prof-btn">
                <UserPlus size={16} /> Add Student
              </button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="prof-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Parent Phone</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><span className="badge badge-secondary">{student.admission_number || `#${student.id}`}</span></td>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td><span className="badge badge-warning">{student.class}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{student.parentPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
