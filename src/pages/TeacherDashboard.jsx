import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, CheckSquare, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { loggedInUser, classes, students } = useContext(AppContext);
  const navigate = useNavigate();

  if (!loggedInUser || !loggedInUser.assignedClasses) return null;

  const myClasses = classes.filter(c => loggedInUser.assignedClasses.includes(c.name));

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Welcome, {loggedInUser.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's your schedule for today.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="prof-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem' }} className="flex-center gap-1">
              <Clock size={18} /> My Batches Today
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myClasses.map(cls => {
                const enrolled = students.filter(s => s.class === cls.name).length;
                return (
                  <div key={cls.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{cls.name}</span>
                      <span className="badge badge-primary">{cls.time}</span>
                    </div>
                    <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span className="flex-center gap-1"><Users size={14}/> {enrolled} Students</span>
                      <button onClick={() => navigate(`/classes/${cls.id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>View Details</button>
                    </div>
                  </div>
                );
              })}
              {myClasses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No batches assigned.</p>}
            </div>
          </div>

          <div className="prof-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => navigate('/attendance')} className="prof-btn prof-btn-outline" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                <CheckSquare size={18} /> Mark Attendance
              </button>
              <button onClick={() => navigate('/assignments')} className="prof-btn prof-btn-outline" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                <BookOpen size={18} /> Upload Assignment
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
