import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { UserPlus, Download, Trash2, Edit2, Search, Filter } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const Students = () => {
  const { students, classes, addToast, addStudent, removeStudent, editStudent, userRole, loggedInUser } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  // Add Form State
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');

  const displayClasses = userRole === 'teacher' 
    ? classes.filter(c => (loggedInUser?.assignedClasses || []).includes(c.name))
    : classes;

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Class', 'Parent Phone', 'Father Name', 'Email', 'Birthdate'];
    const rows = students.map(s => [s.id, s.name, s.class, s.parentPhone, s.fatherName, s.email, s.birthdate]);
    exportToCSV('students_list', rows, headers);
  };

  const handleAddStudent = () => {
    if (!newName || !newClass || !newPhone || !newFatherName) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }
    
    addStudent(newName, newClass, newPhone, newFatherName, newEmail, newBirthdate);
    setShowModal(false);
    
    // Reset form
    setNewName('');
    setNewClass('');
    setNewPhone('');
    setNewFatherName('');
    setNewEmail('');
    setNewBirthdate('');
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setEditName(student.name || '');
    setEditClass(student.class || '');
    setEditPhone(student.parentPhone || '');
    setEditFatherName(student.fatherName || '');
    setEditEmail(student.email || '');
    setEditBirthdate(student.birthdate || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editName || !editClass || !editPhone || !editFatherName) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    editStudent(editingStudent.id, editName, editClass, editPhone, editFatherName, editEmail, editBirthdate);
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id, name) => {
    if (window.confirm(`Are you sure you want to remove Student: ${name}?`)) {
      removeStudent(id);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST';
  };

  // Filter students based on search term & batch selection & teacher assignment
  const allowedClassNames = displayClasses.map(c => c.name);
  const filteredStudents = students.filter(student => {
    const isClassAllowed = userRole !== 'teacher' || allowedClassNames.includes(student.class);
    
    const matchesSearch = 
      (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.parentPhone || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesBatch = selectedBatch === 'all' || student.class === selectedBatch;
    
    return isClassAllowed && matchesSearch && matchesBatch;
  });

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Students Register</h2>
            <div className="flex-center gap-2">
              <button onClick={handleExportCSV} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export All
              </button>
              {userRole === 'admin' && (
                <button onClick={() => setShowModal(true)} className="prof-btn">
                  <UserPlus size={16} /> Add Student
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Search students by name, father's name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="prof-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ opacity: 0.6 }} />
              <select 
                value={selectedBatch} 
                onChange={(e) => setSelectedBatch(e.target.value)} 
                className="prof-input"
                style={{ width: '180px' }}
              >
                <option value="all">All Batches</option>
                {displayClasses.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Card Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredStudents.map((student) => (
              <div key={student.id} className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: 'var(--primary)', color: 'var(--primary-text)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 700, fontSize: '1.1rem', flexShrink: 0
                  }}>
                    {getInitials(student.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.name}
                    </h3>
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}>
                      {student.class}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Roll No / Admission:</span>
                    <span style={{ fontWeight: 600 }}>{student.admission_number || `AES${student.id}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Father's Name:</span>
                    <span style={{ fontWeight: 600 }}>{student.fatherName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Parent Phone:</span>
                    <span style={{ fontWeight: 600 }}>{student.parentPhone}</span>
                  </div>
                  {student.email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{student.email}</span>
                    </div>
                  )}
                  {student.birthdate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Birthdate:</span>
                      <span style={{ fontWeight: 600 }}>{student.birthdate}</span>
                    </div>
                  )}
                </div>

                {userRole === 'admin' && (
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleOpenEditModal(student)} 
                      className="prof-btn prof-btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      <Edit2 size={12} style={{ marginRight: '4px' }} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteStudent(student.id, student.name)} 
                      className="prof-btn prof-btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                No students found.
              </p>
            )}
          </div>
        </div>

        {/* Add Student Modal */}
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
              <input 
                type="email" 
                placeholder="Parent Email Address" 
                className="prof-input" 
                style={{ marginTop: '1rem' }} 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <div style={{ position: 'relative', marginTop: '1rem' }}>
                <input 
                  type="date" 
                  placeholder="Student Birthdate" 
                  className="prof-input" 
                  value={newBirthdate}
                  onChange={(e) => setNewBirthdate(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Birthdate</span>
              </div>
              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleAddStudent} className="prof-btn">Save Student</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '400px' }}>
              <h3>Edit Student Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="prof-input" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Father's Name *</label>
                  <input 
                    type="text" 
                    placeholder="Father's Name" 
                    className="prof-input" 
                    value={editFatherName}
                    onChange={(e) => setEditFatherName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Batch/Class *</label>
                  <select 
                    className="prof-input" 
                    style={{ width: '100%' }}
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                  >
                    <option value="">Select Batch/Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Parent Phone *</label>
                  <input 
                    type="tel" 
                    placeholder="Parent Phone" 
                    className="prof-input" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Parent Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Parent Email Address" 
                    className="prof-input" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Student Birthdate</label>
                  <input 
                    type="date" 
                    placeholder="Student Birthdate" 
                    className="prof-input" 
                    value={editBirthdate}
                    onChange={(e) => setEditBirthdate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => { setShowEditModal(false); setEditingStudent(null); }} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleSaveEdit} className="prof-btn">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Students;
