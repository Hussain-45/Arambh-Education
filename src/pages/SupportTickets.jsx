import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { LifeBuoy, Plus, AlertCircle, CheckCircle, Clock, Send, MessageSquare, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function SupportTickets() {
  const { loggedInUser, authToken, showToast } = useContext(AppContext);
  const [tickets, setTickets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Create form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');

  // Reply form states
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState('Resolved');

  const isAdminOrTeacher = loggedInUser?.role === 'admin' || loggedInUser?.role === 'teacher';

  const fetchTickets = () => {
    fetch('http://localhost:5000/api/tickets', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTickets();
  }, [authToken]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and Description are required.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, category, description })
      });

      if (!response.ok) throw new Error('Failed to submit ticket');
      showToast('Support ticket filed successfully!', 'success');

      // Reset
      setTitle('');
      setCategory('Technical');
      setDescription('');
      setShowCreateModal(false);
      fetchTickets();
    } catch (err) {
      console.error(err);
      showToast('Failed to file ticket.', 'error');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${selectedTicket.id}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ reply: replyText, status: ticketStatus })
      });

      if (!response.ok) throw new Error('Failed to post reply');
      showToast('Reply submitted and ticket updated!', 'success');

      setReplyText('');
      setShowReplyModal(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit response.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Clock size={12} /> Open
          </span>
        );
      case 'In Progress':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <AlertCircle size={12} /> In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle size={12} /> Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <div style={{ padding: '1rem', maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          
          {/* Header Card */}
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
                <LifeBuoy className="h-6 w-6" style={{ color: 'var(--primary-text)' }} />
                Student Support Desk & Tickets
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isAdminOrTeacher 
                  ? 'Respond to system help tickets, billing queries, and student requests.' 
                  : 'Submit support tickets directly to the institute desk and check status updates.'}
              </p>
            </div>
            
            {!isAdminOrTeacher && (
              <button
                onClick={() => setShowCreateModal(true)}
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
                File New Ticket
              </button>
            )}
          </div>

          {/* Tickets View Grid */}
          <div style={{ background: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={16} />
              {isAdminOrTeacher ? 'Active Support Tickets Ledger' : 'My Support History'}
            </h3>

            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <LifeBuoy size={42} style={{ opacity: 0.4, marginBottom: '0.4rem' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>No Support Tickets</span>
                <span style={{ fontSize: '0.8rem', maxWidth: '300px' }}>
                  {isAdminOrTeacher 
                    ? 'All students are good! No support tickets have been filed.' 
                    : 'If you encounter technical issues or billing mismatches, file a ticket above.'}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          background: 'rgba(124, 98, 243, 0.08)',
                          color: 'var(--primary-text)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '8px'
                        }}>
                          {ticket.category}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {ticket.title}
                        </h4>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>

                    {/* Metadata & Description */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{ticket.description}</p>
                      
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', opacity: 0.8, flexWrap: 'wrap' }}>
                        <span>Filed By: <strong>{ticket.user_name}</strong> ({ticket.user_role.toUpperCase()})</span>
                        <span>Date: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Admin Response Card */}
                    {ticket.admin_reply ? (
                      <div style={{
                        background: 'rgba(0,0,0,0.02)',
                        borderLeft: '3px solid var(--primary-text)',
                        padding: '0.75rem 1rem',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem',
                        marginTop: '0.25rem'
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                          Support Desk Reply:
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.4' }}>{ticket.admin_reply}</p>
                      </div>
                    ) : (
                      isAdminOrTeacher && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setTicketStatus('Resolved');
                              setShowReplyModal(true);
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid var(--primary-text)',
                              borderRadius: '8px',
                              padding: '0.4rem 0.8rem',
                              color: 'var(--primary-text)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            Respond to Ticket
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Student Create Ticket Modal */}
        {showCreateModal && (
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
                File Support Desk Ticket
              </h3>

              <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Issue Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Short summary of the problem"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                  >
                    <option value="Technical">Technical (App / Login / Loading)</option>
                    <option value="Finance">Finance (Fees / Dues / Invoices)</option>
                    <option value="Academic">Academic (Syllabus / Quizzes / Grading)</option>
                    <option value="General">General Inquiries</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide details about what went wrong, including error statements or times..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--primary-text)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Reply Modal */}
        {showReplyModal && selectedTicket && (
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
                Respond to Support Ticket
              </h3>

              <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticket Title:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedTicket.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Description:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedTicket.description}</span>
              </div>

              <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Support Desk Wording *</label>
                  <textarea
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Type the response details for the user..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Update Status</label>
                  <select
                    value={ticketStatus}
                    onChange={e => setTicketStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }}
                  >
                    <option value="Resolved">Mark as Resolved</option>
                    <option value="In Progress">Mark as In Progress</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyModal(false);
                      setSelectedTicket(null);
                    }}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--primary-text)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Send size={14} />
                    Send Response
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
