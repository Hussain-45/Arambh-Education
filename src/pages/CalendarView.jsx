import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Calendar, Clock, Plus } from 'lucide-react';

const CalendarView = () => {
  const { userRole, calendarEvents } = useContext(AppContext);

  const content = (
    <div className="prof-card" style={{ flex: 1 }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Schedule & Calendar</h2>
        {userRole === 'admin' && (
          <button className="prof-btn"><Plus size={16} /> Add Event</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {calendarEvents.map(ev => (
          <div key={ev.id} style={{ 
            padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px',
            borderLeft: `4px solid ${ev.type === 'Exam' ? 'var(--danger)' : ev.type === 'Class' ? 'var(--primary-text)' : 'var(--warning)'}`
          }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span className={`badge badge-${ev.type === 'Exam' ? 'danger' : ev.type === 'Class' ? 'success' : 'warning'}`}>{ev.type}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} className="flex-center gap-1"><Calendar size={14}/> {ev.date}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{ev.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );

  if (userRole === 'admin') {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          {content}
        </main>
      </>
    );
  }

  // Student View
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
