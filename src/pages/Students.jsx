import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { UserPlus, Download, Trash2, Edit2, Search, Filter, Phone, User, Calendar, MapPin, Award, Percent } from 'lucide-react';
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
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newMotherName, setNewMotherName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('0');
  const [newRegDate, setNewRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPassword, setNewPassword] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editMotherName, setEditMotherName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDiscountPercent, setEditDiscountPercent] = useState('0');
  const [editRegDate, setEditRegDate] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const displayClasses = userRole === 'teacher' 
    ? classes.filter(c => (loggedInUser?.assignedClasses || []).includes(c.name))
    : classes;

  const handleExportCSV = () => {
    const headers = ['Admission ID', 'Name', 'Class', 'Father Name', 'Mother Name', 'Parent Phone', 'Student Phone', 'Email', 'Birthdate', 'Gender', 'Blood Group', 'Address', 'Scholarship Discount (%)', 'Enrollment Date'];
    const rows = students.map(s => [
      s.admission_number || 'N/A', 
      s.name, 
      s.class, 
      s.fatherName, 
      s.motherName || 'N/A', 
      s.parentPhone, 
      s.phone || 'N/A', 
      s.email || 'N/A', 
      s.birthdate || 'N/A',
      s.gender || 'N/A',
      s.bloodGroup || 'N/A',
      s.address || 'N/A',
      s.discountPercent || 0,
      s.registrationDate || 'N/A'
    ]);
    exportToCSV('students_list', rows, headers);
  };

  const handleAddStudent = async () => {
    if (!newName || !newClass || !newParentPhone || !newFatherName) {
      addToast('Please fill in all required fields (Name, Batch, Parent Phone, Father Name).', 'warning');
      return;
    }
    
    const studentObj = {
      name: newName,
      class: newClass,
      parentPhone: newParentPhone,
      fatherName: newFatherName,
      motherName: newMotherName,
      email: newEmail,
      birthdate: newBirthdate,
      phone: newPhone,
      gender: newGender,
      bloodGroup: newBloodGroup,
      address: newAddress,
      discountPercent: parseInt(newDiscountPercent) || 0,
      registrationDate: newRegDate,
      password: newPassword || 'password'
    };

    const success = await addStudent(studentObj);
    if (success) {
      setShowModal(false);
      // Reset form
      setNewName('');
      setNewClass('');
      setNewParentPhone('');
      setNewFatherName('');
      setNewMotherName('');
      setNewEmail('');
      setNewBirthdate('');
      setNewPhone('');
      setNewGender('');
      setNewBloodGroup('');
      setNewAddress('');
      setNewDiscountPercent('0');
      setNewRegDate(new Date().toISOString().split('T')[0]);
      setNewPassword('');
    }
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setEditName(student.name || '');
    setEditClass(student.class || '');
    setEditParentPhone(student.parentPhone || '');
    setEditFatherName(student.fatherName || '');
    setEditMotherName(student.motherName || '');
    setEditEmail(student.email || '');
    setEditBirthdate(student.birthdate || '');
    setEditPhone(student.phone || '');
    setEditGender(student.gender || '');
    setEditBloodGroup(student.bloodGroup || '');
    setEditAddress(student.address || '');
    setEditDiscountPercent(student.discountPercent || '0');
    setEditRegDate(student.registrationDate || '');
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editClass || !editParentPhone || !editFatherName) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    const studentObj = {
      name: editName,
      class: editClass,
      parentPhone: editParentPhone,
      fatherName: editFatherName,
      motherName: editMotherName,
      email: editEmail,
      birthdate: editBirthdate,
      phone: editPhone,
      gender: editGender,
      bloodGroup: editBloodGroup,
      address: editAddress,
      discountPercent: parseInt(editDiscountPercent) || 0,
      registrationDate: editRegDate,
      password: editPassword || null
    };

    const success = await editStudent(editingStudent.id, studentObj);
    if (success) {
      setShowEditModal(false);
      setEditingStudent(null);
    }
  };

  const handleDeleteStudent = (id, name) => {
    if (window.confirm(`Are you sure you want to remove Student: ${name}?`)) {
      removeStudent(id);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST';
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

  // Filter students based on search term & batch selection & teacher assignment
  const allowedClassNames = displayClasses.map(c => c.name);
  const filteredStudents = students.filter(student => {
    const isClassAllowed = userRole !== 'teacher' || allowedClassNames.includes(student.class);
    
    const matchesSearch = 
      (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.admission_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                placeholder="Search students by name, ID, phone..."
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredStudents.map((student) => (
              <div key={student.id} className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: getAvatarGradient(student.name), color: '#ffffff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}>
                    {getInitials(student.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                        {student.class}
                      </span>
                      {student.discountPercent > 0 && (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Percent size={10} /> {student.discountPercent}% Sch.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Admission ID:</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{student.admission_number || 'AES-N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Father's Name:</span>
                    <span style={{ fontWeight: 600 }}>{student.fatherName}</span>
                  </div>
                  {student.motherName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mother's Name:</span>
                      <span style={{ fontWeight: 600 }}>{student.motherName}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Parent Phone:</span>
                    <span style={{ fontWeight: 600 }}>{student.parentPhone}</span>
                  </div>
                  {student.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student Phone:</span>
                      <span style={{ fontWeight: 600 }}>{student.phone}</span>
                    </div>
                  )}
                  {student.gender && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gender / Blood:</span>
                      <span style={{ fontWeight: 600 }}>{student.gender} ({student.bloodGroup || 'N/A'})</span>
                    </div>
                  )}
                  {student.address && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Address:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={student.address}>{student.address}</span>
                    </div>
                  )}
                  {student.registrationDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Enrolled Date:</span>
                      <span style={{ fontWeight: 600 }}>{student.registrationDate}</span>
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
                      <Edit2 size={12} style={{ marginRight: '4px' }} /> Edit Profile
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
            <div className="prof-card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3>Add New Student</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student Name *</label>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="prof-input" 
                    style={{ marginTop: '4px' }}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Father's Name *</label>
                    <input 
                      type="text" 
                      placeholder="Father's Name" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newFatherName}
                      onChange={(e) => setNewFatherName(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mother's Name</label>
                    <input 
                      type="text" 
                      placeholder="Mother's Name" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newMotherName}
                      onChange={(e) => setNewMotherName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assign Batch/Class *</label>
                    <select 
                      className="prof-input" 
                      style={{ marginTop: '4px', width: '100%' }}
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                    >
                      <option value="">Select Batch/Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Scholarship Discount (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="0" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newDiscountPercent}
                      onChange={(e) => setNewDiscountPercent(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parent Mobile (Login ID) *</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit Parent Mobile" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newParentPhone}
                      onChange={(e) => setNewParentPhone(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student Personal Mobile</label>
                    <input 
                      type="tel" 
                      placeholder="Student Mobile" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Portal Password (default: password)</label>
                  <input 
                    type="password" 
                    placeholder="Login Password" 
                    className="prof-input" 
                    style={{ marginTop: '4px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parent Email Address</label>
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Birthdate</label>
                    <input 
                      type="date" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newBirthdate}
                      onChange={(e) => setNewBirthdate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gender</label>
                    <select 
                      className="prof-input" 
                      style={{ marginTop: '4px', width: '100%' }}
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Blood Group</label>
                    <input 
                      type="text" 
                      placeholder="e.g. O+, A-" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={newBloodGroup}
                      onChange={(e) => setNewBloodGroup(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Home Address</label>
                  <textarea 
                    placeholder="Residential Address" 
                    className="prof-input" 
                    style={{ marginTop: '4px', height: '60px', resize: 'vertical' }}
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Enrollment Date</label>
                  <input 
                    type="date" 
                    className="prof-input" 
                    style={{ marginTop: '4px' }}
                    value={newRegDate}
                    onChange={(e) => setNewRegDate(e.target.value)}
                  />
                </div>
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
            <div className="prof-card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3>Edit Student Profile</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student Name *</label>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="prof-input" 
                    style={{ marginTop: '4px' }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Father's Name *</label>
                    <input 
                      type="text" 
                      placeholder="Father's Name" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editFatherName}
                      onChange={(e) => setEditFatherName(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mother's Name</label>
                    <input 
                      type="text" 
                      placeholder="Mother's Name" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editMotherName}
                      onChange={(e) => setEditMotherName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Batch/Class *</label>
                    <select 
                      className="prof-input" 
                      style={{ marginTop: '4px', width: '100%' }}
                      value={editClass}
                      onChange={(e) => setEditClass(e.target.value)}
                    >
                      <option value="">Select Batch/Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Scholarship Discount (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="0" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editDiscountPercent}
                      onChange={(e) => setEditDiscountPercent(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parent Mobile (Login ID) *</label>
                    <input 
                      type="tel" 
                      placeholder="Parent Phone" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editParentPhone}
                      onChange={(e) => setEditParentPhone(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student Personal Mobile</label>
                    <input 
                      type="tel" 
                      placeholder="Student Phone" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>New Password (leave blank to keep current)</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="prof-input" 
                    style={{ marginTop: '4px' }}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parent Email Address</label>
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Birthdate</label>
                    <input 
                      type="date" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editBirthdate}
                      onChange={(e) => setEditBirthdate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gender</label>
                    <select 
                      className="prof-input" 
                      style={{ marginTop: '4px', width: '100%' }}
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Blood Group</label>
                    <input 
                      type="text" 
                      placeholder="Blood Group" 
                      className="prof-input" 
                      style={{ marginTop: '4px' }}
                      value={editBloodGroup}
                      onChange={(e) => setNewBloodGroup(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Home Address</label>
                  <textarea 
                    placeholder="Address" 
                    className="prof-input" 
                    style={{ marginTop: '4px', height: '60px', resize: 'vertical' }}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Enrollment Date</label>
                  <input 
                    type="date" 
                    className="prof-input" 
                    style={{ marginTop: '4px' }}
                    value={editRegDate}
                    onChange={(e) => setEditRegDate(e.target.value)}
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
