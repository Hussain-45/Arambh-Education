import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { UserPlus, Download, Mail, Phone, IndianRupee, Briefcase, Award, Trash2, Edit2, Search } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const Teachers = () => {
  const { teachers, classes, addToast, addTeacher, removeTeacher, editTeacher, userRole } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Add Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [selectedEditClasses, setSelectedEditClasses] = useState([]);

  const handleExportCSV = () => {
    const headers = ['Teacher ID', 'Name', 'Email/Login', 'Phone', 'Salary (₹)', 'Specialization', 'Assigned Batches'];
    const rows = teachers.map(t => [t.teacherIdNumber || 'N/A', t.name, t.email, t.phone || 'N/A', t.salary || 0, t.specialization || 'N/A', (t.assignedClasses || []).join(', ')]);
    exportToCSV('teachers_list', rows, headers);
  };

  const handleClassToggle = (className) => {
    setSelectedClasses(prev => 
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleEditClassToggle = (className) => {
    setSelectedEditClasses(prev => 
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleAddTeacher = async () => {
    if (!newName || !newEmail || !newPassword) {
      addToast('Please fill in all required fields (Name, Email/Login, Password).', 'warning');
      return;
    }

    const success = await addTeacher(newName, newEmail, newPhone, newSalary, newSpecialization, selectedClasses, newPassword);
    if (success) {
      setShowModal(false);
      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewSalary('');
      setNewSpecialization('');
      setNewPassword('');
      setSelectedClasses([]);
    }
  };

  const handleOpenEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name || '');
    setEditEmail(teacher.email || '');
    setEditPhone(teacher.phone || '');
    setEditSalary(teacher.salary || '');
    setEditSpecialization(teacher.specialization || '');
    setEditPassword(''); // Do not expose original password
    setSelectedEditClasses(teacher.assignedClasses || []);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editEmail) {
      addToast('Please fill in all required fields (Name, Email/Login).', 'warning');
      return;
    }

    const success = await editTeacher(
      editingTeacher.id, 
      editName, 
      editEmail, 
      editPhone, 
      editSalary, 
      editSpecialization, 
      selectedEditClasses, 
      editPassword || null
    );
    if (success) {
      setShowEditModal(false);
      setEditingTeacher(null);
    }
  };

  const handleDeleteTeacher = (id, name) => {
    if (window.confirm(`Are you sure you want to remove Teacher: ${name}?`)) {
      removeTeacher(id);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TE';
  };

  const getAvatarGradient = (name) => {
    const charCode = name ? name.charCodeAt(0) : 65;
    const gradients = [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
      'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Violet
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
      'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber
      'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', // Red
    ];
    return gradients[charCode % gradients.length];
  };

  const filteredTeachers = teachers.filter(t => 
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.teacherIdNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Teachers Register</h2>
            <div className="flex-center gap-2">
              <button onClick={handleExportCSV} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export All
              </button>
              {userRole === 'admin' && (
                <button onClick={() => setShowModal(true)} className="prof-btn">
                  <UserPlus size={16} /> Add Teacher
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Search teachers by name, ID, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="prof-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          
          {/* Card Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: getAvatarGradient(teacher.name), color: '#ffffff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}>
                    {getInitials(teacher.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {teacher.name}
                    </h3>
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}>
                      {teacher.teacherIdNumber || 'No ID Assigned'}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.email}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                    <span style={{ fontWeight: 600 }}>{teacher.phone || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IndianRupee size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Salary:</span>
                    <span style={{ fontWeight: 600 }}>₹{(teacher.salary || 0).toLocaleString()} / month</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Specialization:</span>
                    <span style={{ fontWeight: 600 }}>{teacher.specialization || 'N/A'}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Assigned Batches:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                      {(teacher.assignedClasses || []).map((cls, idx) => (
                        <span key={idx} className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                          {cls}
                        </span>
                      ))}
                      {(!teacher.assignedClasses || teacher.assignedClasses.length === 0) && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>
                      )}
                    </div>
                  </div>
                </div>

                {userRole === 'admin' && (
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleOpenEditModal(teacher)} 
                      className="prof-btn prof-btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      <Edit2 size={12} style={{ marginRight: '4px' }} /> Edit Details
                    </button>
                    <button 
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.name)} 
                      className="prof-btn prof-btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            {filteredTeachers.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                No teachers found.
              </p>
            )}
          </div>
        </div>

        {/* Add Teacher Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3>Add New Teacher</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="prof-input" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Address * (used for login)</label>
                  <input 
                    type="email" 
                    placeholder="name@aarambh.edu" 
                    className="prof-input" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password *</label>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="prof-input" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="10-digit Mobile Number" 
                    className="prof-input" 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monthly Salary (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Monthly Salary amount" 
                    className="prof-input" 
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subject Specialization</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mathematics, Physics" 
                    className="prof-input" 
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Assign Batches/Classes</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedClasses.includes(cls.name)}
                          onChange={() => handleClassToggle(cls.name)}
                        />
                        {cls.name}
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No classes/batches available</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setShowModal(false)} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleAddTeacher} className="prof-btn">Save Teacher</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Teacher Modal */}
        {showEditModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div className="prof-card" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3>Edit Teacher Details</h3>
              
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
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Address * (used for login)</label>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="prof-input" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>New Password (leave blank to keep current)</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="prof-input" 
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="Phone Number" 
                    className="prof-input" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monthly Salary (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Monthly Salary amount" 
                    className="prof-input" 
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subject Specialization</label>
                  <input 
                    type="text" 
                    placeholder="Specialization" 
                    className="prof-input" 
                    value={editSpecialization}
                    onChange={(e) => setEditSpecialization(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Assign Batches/Classes</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedEditClasses.includes(cls.name)}
                          onChange={() => handleEditClassToggle(cls.name)}
                        />
                        {cls.name}
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No classes/batches available</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="prof-btn prof-btn-secondary">Cancel</button>
                <button onClick={handleSaveEdit} className="prof-btn">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Teachers;
