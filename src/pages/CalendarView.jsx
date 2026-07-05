import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Calendar, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';

const CalendarView = () => {
  const { userRole, calendarEvents, addCalendarEvent, deleteCalendarEvent } = useContext(AppContext);

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Event');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !type) {
      alert('Please fill in Title, Date and Type.');
      return;
    }
    const success = await addCalendarEvent(title, date, time, type, description);
    if (success) {
      setShowModal(false);
      setTitle('');
      setDate('');
      setTime('');
      setType('Event');
      setDescription('');
    }
  };

  const handleDelete = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteCalendarEvent(eventId);
    }
  };

  const inputStyle = {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'white',
    borderRadius: '10px',
    padding: '0.65rem 1rem',
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '0.3rem'
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      {/* Event Timeline Header */}
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Institution Calendar</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem', fontSize: '0.9rem' }}>Events, holiday plans, exam rosters, and reminders.</p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowModal(true)} className="prof-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Event
          </button>
        )}
      </div>

      {/* Split Layout for Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Timeline of Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {calendarEvents.map(ev => {
              let borderCol = 'var(--primary-text)';
              let badgeClass = 'badge-primary';
              if (ev.type === 'Exam') {
                borderCol = 'var(--danger)';
                badgeClass = 'badge-danger';
              } else if (ev.type === 'Holiday') {
                borderCol = 'var(--warning)';
                badgeClass = 'badge-warning';
              } else if (ev.type === 'Class') {
                borderCol = '#3b82f6';
                badgeClass = 'badge-primary';
              } else if (ev.type === 'Special Event' || ev.type === 'Event') {
                borderCol = '#a855f7'; // Purple
                badgeClass = 'badge-purple';
              }

              return (
                <div 
                  key={ev.id} 
                  style={{ 
                    padding: '1.5rem', 
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '16px',
                    borderLeft: `5px solid ${borderCol}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative'
                  }}
                >
                  <div className="flex-between">
                    <span className={`badge ${badgeClass}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.6rem' }}>{ev.type}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13}/> {ev.date} {ev.time && `at ${ev.time}`}
                      </span>
                      {userRole === 'admin' && (
                        <button 
                          onClick={() => handleDelete(ev.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(239, 68, 68, 0.7)', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgb(239, 68, 68)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{ev.title}</h3>
                    {ev.description && (
                      <p style={{ margin: 0, marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {calendarEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                <Calendar size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No events scheduled yet.</p>
                <p style={{ margin: 0, fontSize: '0.85rem', marginTop: '0.2rem' }}>Stay tuned for upcoming class exams, announcements, and reminders!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Month summary & Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="prof-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, margin: 0, marginBottom: '1.2rem', color: 'var(--text-main)' }}>Academic Calendar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-text)', marginTop: '5px' }}></div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Term 1 Exams Week</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Starts mid September 2026</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', marginTop: '5px' }}></div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Autumn Term Holiday</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Oct 15 - Oct 25, 2026</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', marginTop: '5px' }}></div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Final Pre-Board Mock Exams</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Dec 5 - Dec 20, 2026</div>
                </div>
              </div>
            </div>
          </div>

          <div className="prof-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, margin: 0, marginBottom: '0.8rem', color: 'var(--text-main)' }}>Calendar Guidelines</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              All events, holidays, and exam reminders are scheduled and updated by the main administration desk. Please consult with the academic coordinator to request changes.
            </p>
          </div>
        </div>

      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div className="prof-card" style={{ width: '480px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>Schedule New Event</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>EVENT TITLE *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Annual Sports Day 2026" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="prof-input"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DATE *</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="prof-input"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TIME (OPTIONAL)</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                    className="prof-input"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>EVENT TYPE *</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)} 
                  className="prof-input"
                  style={inputStyle}
                  required
                >
                  <option value="Event">Special Event</option>
                  <option value="Exam">Exam / Test</option>
                  <option value="Class">Class Session</option>
                  <option value="Holiday">School Holiday</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DESCRIPTION / INFORMATION</label>
                <textarea 
                  placeholder="Provide additional details or reminder information..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="prof-input"
                  style={{ ...inputStyle, resize: 'none', height: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="flex-end gap-1" style={{ marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="prof-btn prof-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="prof-btn"
                >
                  Publish Event
                </button>
              </div>
            </form>
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

export default CalendarView;
