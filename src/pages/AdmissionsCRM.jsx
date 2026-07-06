import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Users, Plus, ChevronLeft, ChevronRight, MessageSquare, Phone, Mail, GraduationCap, Calendar, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AdmissionsCRM() {
  const { loggedInUser, authToken, showToast } = useContext(AppContext);
  const [leads, setLeads] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form states
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');

  const stages = ['New', 'Contacted', 'Demo Scheduled', 'Fees Pending', 'Enrolled'];

  const fetchLeads = () => {
    fetch('http://localhost:5000/api/leads', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeads(data);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLeads();
  }, [authToken]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !parentName.trim() || !phone.trim()) {
      showToast('Student Name, Parent Name, and Phone are required.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          student_name: studentName,
          parent_name: parentName,
          phone,
          email,
          grade,
          notes,
          status: 'New'
        })
      });

      if (!response.ok) throw new Error('Failed to create lead');
      showToast('Lead added successfully!', 'success');
      
      // Reset form
      setStudentName('');
      setParentName('');
      setPhone('');
      setEmail('');
      setGrade('');
      setNotes('');
      setShowAddModal(false);
      fetchLeads();
    } catch (err) {
      console.error(err);
      showToast('Failed to add lead.', 'error');
    }
  };

  const handleMoveStage = async (leadId, currentStatus, direction) => {
    const currentIndex = stages.indexOf(currentStatus);
    let newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= stages.length) return;
    const newStatus = stages[newIndex];

    try {
      const response = await fetch(`http://localhost:5000/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update stage');
      fetchLeads();
    } catch (err) {
      console.error(err);
      showToast('Failed to update lead stage.', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;

    try {
      const response = await fetch(`http://localhost:5000/api/leads/${selectedLead.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ notes: selectedLead.notes })
      });

      if (!response.ok) throw new Error('Failed to save notes');
      showToast('Notes updated successfully!', 'success');
      setShowDetailModal(false);
      fetchLeads();
    } catch (err) {
      console.error(err);
      showToast('Failed to update notes.', 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete lead');
      showToast('Lead deleted successfully.', 'success');
      fetchLeads();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete lead.', 'error');
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <div style={{ padding: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          
          {/* Upper Header Box */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users className="h-6 w-6" style={{ color: 'var(--primary-text)' }} />
                Admissions & Inquiry CRM Pipeline
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track new enrollment inquiries, coordinate demos, and follow up with prospective parents.
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--primary-text)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem'
              }}
            >
              <Plus size={16} />
              Add Inquiry Lead
            </button>
          </div>

          {/* Kanban Pipeline Board */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem',
            alignItems: 'start',
            flex: 1,
            minHeight: '500px',
            overflowX: 'auto',
            paddingBottom: '1rem'
          }}>
            {stages.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage);
              
              return (
                <div key={stage} style={{
                  background: 'var(--secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minWidth: '220px',
                  alignSelf: 'stretch'
                }}>
                  {/* Column Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid var(--border-color)',
                    paddingBottom: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{stage}</span>
                    <span style={{
                      background: 'rgba(124, 98, 243, 0.08)',
                      color: 'var(--primary-text)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.5rem',
                      borderRadius: '10px'
                    }}>
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Leads Cards Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                    {stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s'
                        }}
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailModal(true);
                        }}
                      >
                        {/* Student Name & Grade */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {lead.student_name}
                          </span>
                          {lead.grade && (
                            <span style={{ fontSize: '0.7rem', padding: '0.05rem 0.35rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', borderRadius: '6px', fontWeight: 600 }}>
                              {lead.grade}
                            </span>
                          )}
                        </div>

                        {/* Parent & Contact Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Users size={12} />
                            <span>{lead.parent_name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Phone size={12} />
                            <span>{lead.phone}</span>
                          </div>
                        </div>

                        {/* Move Actions / Delete Controls */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '0.5rem',
                            marginTop: '0.25rem'
                          }}
                          onClick={e => e.stopPropagation()} // Stop modal trigger
                        >
                          <button
                            onClick={() => handleMoveStage(lead.id, lead.status, -1)}
                            disabled={stage === stages[0]}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: stage === stages[0] ? 'not-allowed' : 'pointer',
                              opacity: stage === stages[0] ? 0.3 : 0.8
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              opacity: 0.8
                            }}
                          >
                            <Trash2 size={13} />
                          </button>

                          <button
                            onClick={() => handleMoveStage(lead.id, lead.status, 1)}
                            disabled={stage === stages[stages.length - 1]}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: stage === stages[stages.length - 1] ? 'not-allowed' : 'pointer',
                              opacity: stage === stages[stages.length - 1] ? 0.3 : 0.8
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Add Lead Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'var(--secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Add Prospective Student Inquiry
              </h3>
              
              <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Student Name *</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="Student full name"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Parent Name *</label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={e => setParentName(e.target.value)}
                      placeholder="Father/Mother name"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. parent@email.com"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Target Grade</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      placeholder="e.g. 10th - Science"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Inquiry Details / Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Walked in checking syllabus... Demo session set for Tuesday..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--primary-text)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Add Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lead Details / Notes Modal */}
        {showDetailModal && selectedLead && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'var(--secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Inquiry Information
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead ID: #{selectedLead.id}</span>
                </div>
                <span style={{ background: 'var(--primary-text)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                  {selectedLead.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Student Name:</span>
                  <span>{selectedLead.student_name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Parent Name:</span>
                  <span>{selectedLead.parent_name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number:</span>
                  <a href={`tel:${selectedLead.phone}`} style={{ color: 'var(--primary-text)', textDecoration: 'none', fontWeight: 600 }}>{selectedLead.phone}</a>
                </div>
                {selectedLead.email && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Email Address:</span>
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                {selectedLead.grade && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Target Class:</span>
                    <span>{selectedLead.grade}</span>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Created At:</span>
                  <span>{new Date(selectedLead.created_at).toLocaleString()}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Follow-up Remarks / Conversation Logs:
                  </label>
                  <textarea
                    value={selectedLead.notes || ''}
                    onChange={e => setSelectedLead(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--primary-text)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
