import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { Users, CheckSquare, BookOpen, Clock, Bell, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { loggedInUser, classes, students, announcements } = useContext(AppContext);
  const navigate = useNavigate();

  if (!loggedInUser) return null;

  const myClasses = classes.filter(c => 
    (loggedInUser.assignedClasses || []).includes(c.name)
  );

  const myClassNames = myClasses.map(c => c.name);
  const myStudents = students.filter(s => myClassNames.includes(s.class));
  const myAnnouncements = announcements.filter(a => a.target_class === 'All' || myClassNames.includes(a.target_class));

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Welcome, {loggedInUser.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Teacher Hub &bull; Manage your batches and keep track of student activity.</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <StatCard title="My Batches" value={myClasses.length.toString()} icon={BookOpen} trend={0} />
          <StatCard title="Enrolled Students" value={myStudents.length.toString()} icon={Users} trend={2} />
          <StatCard title="Notice Bulletins" value={myAnnouncements.length.toString()} icon={Bell} trend={1} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Batches list */}
          <div className="prof-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }} className="flex-center gap-1">
              <Clock size={18} style={{ color: 'var(--primary)' }} /> My Batches Today
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myClasses.map(cls => {
                const enrolled = students.filter(s => s.class === cls.name).length;
                return (
                  <div key={cls.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'var(--bg-main)' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cls.name}</span>
                      <span className="badge badge-primary">{cls.time}</span>
                    </div>
                    <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span className="flex-center gap-1"><Users size={14}/> {enrolled} Enrolled</span>
                      <button 
                        onClick={() => navigate(`/classes/${cls.id}`)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {myClasses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No batches assigned.</p>}
            </div>
          </div>

          {/* Quick Actions & Announcements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="prof-card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => navigate('/attendance')} className="prof-btn" style={{ flex: 1, gap: '0.5rem', padding: '0.8rem 1rem', fontSize: '0.9rem' }}>
                  <CheckSquare size={16} /> Mark Attendance
                </button>
                <button onClick={() => navigate('/assignments')} className="prof-btn prof-btn-outline" style={{ flex: 1, gap: '0.5rem', padding: '0.8rem 1rem', fontSize: '0.9rem' }}>
                  <BookOpen size={16} /> Post Assignment
                </button>
              </div>
            </div>

            <div className="prof-card" style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }} className="flex-center gap-1">
                <Bell size={18} style={{ color: 'var(--warning)' }} /> Announcements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myAnnouncements.slice(0, 3).map(ann => (
                  <div key={ann.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{ann.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{ann.content}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>{ann.date}</div>
                  </div>
                ))}
                {myAnnouncements.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No announcements.</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
