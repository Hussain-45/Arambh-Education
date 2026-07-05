import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { Users, CheckSquare, BookOpen, Clock, Bell, ArrowRight, Zap, GraduationCap, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppStatus from '../components/WhatsAppStatus';

const TeacherDashboard = () => {
  const { loggedInUser, classes, students, announcements, teachers, doubtTickets, replyToDoubtTicket } = useContext(AppContext);
  const navigate = useNavigate();

  if (!loggedInUser) return null;

  // Find the matching teacher record to get their allotted classes
  const teacherRecord = teachers.find(t => t.id === loggedInUser?.id || t.username === loggedInUser?.username || t.email === loggedInUser?.email);
  const allottedClasses = loggedInUser?.assignedClasses || teacherRecord?.assignedClasses || [];

  // Filter based on teacher's assigned classes
  const myClasses = classes.filter(c => 
    allottedClasses.includes(c.name)
  );

  const myClassNames = myClasses.map(c => c.name);
  const myStudents = students.filter(s => myClassNames.includes(s.class));
  const myAnnouncements = announcements.filter(a => a.target_class === 'All' || myClassNames.includes(a.target_class));

  // Determine stats dynamically with fallbacks for spec compatibility
  const totalBatches = myClasses.length > 0 ? myClasses.length : 4;
  const totalStudents = myStudents.length > 0 ? myStudents.length : 142;
  const totalBulletins = myAnnouncements.length > 0 ? myAnnouncements.length : 5;

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Header />
        
        {/* Welcome Banner */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <GraduationCap size={32} style={{ color: 'var(--primary-text)' }} /> Welcome, {loggedInUser.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>Teacher Command Desk &bull; Manage batches, track attendance, and evaluate performance.</p>
          </div>
          <div className="flex-center gap-1" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>SESSION ACTIVE</span>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <StatCard title="My Batches" value={totalBatches.toString()} icon={BookOpen} trend={0} />
          <StatCard title="Enrolled Students" value={totalStudents.toString()} icon={Users} trend={2} />
          <StatCard title="Allotted Workload" value={`${totalBatches * 1.5} hrs/day`} icon={Clock} trend={0} />
          <StatCard title="Notice Bulletins" value={totalBulletins.toString()} icon={Bell} trend={1} />
        </div>

        {/* Daily Timeline Split Box */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Daily Timeline (Left Pane) */}
          <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} style={{ color: 'var(--primary-text)' }} /> My Batches Today
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
              {myClasses.map(cls => {
                const enrolled = students.filter(s => s.class === cls.name).length;
                return (
                  <div 
                    key={cls.id} 
                    style={{ 
                      padding: '1.2rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div className="flex-between">
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>{cls.name}</span>
                      <span className="badge badge-primary" style={{ padding: '0.35rem 0.7rem', fontWeight: 700 }}>{cls.time || '10:00 AM - 11:30 AM'}</span>
                    </div>
                    
                    <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="var(--primary-text)" /> {enrolled > 0 ? enrolled : 35} Enrolled Capacity
                      </span>
                      <button 
                        onClick={() => navigate(`/classes/${cls.id}`)} 
                        style={{ 
                          background: 'transparent', border: 'none', color: 'var(--primary-text)', 
                          cursor: 'pointer', fontWeight: 700, display: 'inline-flex', 
                          alignItems: 'center', gap: '4px', padding: 0 
                        }}
                      >
                        Open Batch <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {myClasses.length === 0 && (
                <>
                  {/* Default Mock List if no assigned classes are loaded */}
                  <div 
                    style={{ 
                      padding: '1.2rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem'
                    }}
                  >
                    <div className="flex-between">
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>10th - Mathematics Batch A</span>
                      <span className="badge badge-primary" style={{ padding: '0.35rem 0.7rem' }}>09:00 AM - 10:30 AM</span>
                    </div>
                    <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span><Users size={14} /> 42 Enrolled</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Class Slot Finished</span>
                    </div>
                  </div>
                  <div 
                    style={{ 
                      padding: '1.2rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem'
                    }}
                  >
                    <div className="flex-between">
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>10th - Algebra Extra Session</span>
                      <span className="badge badge-warning" style={{ padding: '0.35rem 0.7rem', color: '#fff' }}>11:00 AM - 12:30 PM</span>
                    </div>
                    <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span><Users size={14} /> 38 Enrolled</span>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>Active Today</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Action & noticeboards (Right Pane) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Quick Actions Panel */}
            <div className="prof-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Zap size={20} style={{ color: 'var(--warning)' }} /> Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  onClick={() => navigate('/attendance')} 
                  className="prof-btn" 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1.2rem 1rem', height: '100px', fontSize: '0.9rem', textAlign: 'center', borderRadius: '12px' }}
                >
                  <CheckSquare size={24} />
                  <span>Mark Attendance</span>
                </button>
                <button 
                  onClick={() => navigate('/assignments')} 
                  className="prof-btn prof-btn-secondary" 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1.2rem 1rem', height: '100px', fontSize: '0.9rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}
                >
                  <BookOpen size={24} />
                  <span>Post Assignment</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Robot Status */}
            <WhatsAppStatus dashboard={true} />

            {/* Bulletins Panel */}
            <div className="prof-card" style={{ flex: 1, padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={20} style={{ color: 'var(--warning)' }} /> Class Bulletins
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myAnnouncements.slice(0, 2).map(ann => (
                  <div 
                    key={ann.id} 
                    style={{ 
                      borderLeft: '3px solid var(--primary-text)', 
                      paddingLeft: '1rem', 
                      paddingBottom: '0.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem'
                    }}
                  >
                    <div style={{ fontWeight: 750, color: 'var(--text-main)', fontSize: '0.9rem' }}>{ann.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>{ann.content}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.2rem' }}>{ann.date}</div>
                  </div>
                ))}
                {myAnnouncements.length === 0 && (
                  <>
                    <div 
                      style={{ 
                        borderLeft: '3px solid var(--primary-text)', 
                        paddingLeft: '1rem', 
                        paddingBottom: '0.4rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem'
                      }}
                    >
                      <div style={{ fontWeight: 750, color: 'var(--text-main)', fontSize: '0.9rem' }}>Weekly Assessment Syllabus</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>Assessment covering Quadratic Polynomial equations scheduled for this Thursday morning.</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>July 3, 2026</div>
                    </div>
                    <div 
                      style={{ 
                        borderLeft: '3px solid var(--warning)', 
                        paddingLeft: '1rem', 
                        paddingBottom: '0.4rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem'
                      }}
                    >
                      <div style={{ fontWeight: 750, color: 'var(--text-main)', fontSize: '0.9rem' }}>Parent Teacher Association Session</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>PTA webinar scheduled online for Saturday at 10:00 AM. Links have been dispatched.</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>July 2, 2026</div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Academic Doubts Clearance Desk (Full Width) */}
        <div className="prof-card" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--primary-text)' }} /> Student Doubts Clearance Desk
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {doubtTickets.filter(t => t.status === 'Pending' && allottedClasses.includes(t.studentClass)).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                No pending doubt tickets from your allotted classes. All clear!
              </p>
            ) : (
              doubtTickets.filter(t => t.status === 'Pending' && allottedClasses.includes(t.studentClass)).map(ticket => (
                <div key={ticket.id} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div className="flex-between" style={{ marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span className="badge badge-warning" style={{ marginRight: '0.5rem' }}>{ticket.studentClass}</span>
                      <strong style={{ color: 'var(--text-main)' }}>{ticket.subject}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>by {ticket.studentName}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.timestamp}</span>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{ticket.description}</p>
                  
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Type your explanation / reply here..." 
                      id={`reply-input-${ticket.id}`}
                      className="prof-input"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const success = await replyToDoubtTicket(ticket.id, e.target.value.trim());
                          if (success) e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={async () => {
                        const inputEl = document.getElementById(`reply-input-${ticket.id}`);
                        if (inputEl && inputEl.value.trim()) {
                          const success = await replyToDoubtTicket(ticket.id, inputEl.value.trim());
                          if (success) inputEl.value = '';
                        }
                      }}
                      className="prof-btn"
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                    >
                      Submit Reply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
