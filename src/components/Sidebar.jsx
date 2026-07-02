import React, { useContext } from 'react';
import { LayoutDashboard, Users, BookOpen, CheckSquare, Settings, LogOut, IndianRupee, MessageSquare, Calendar, ClipboardList, Clock } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex',
    alignItems: 'center',
    padding: '0.8rem 1.5rem',
    cursor: 'pointer',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    background: active ? 'var(--secondary)' : 'transparent',
    borderRight: active ? '3px solid var(--primary)' : '3px solid transparent',
    transition: 'all 0.2s ease',
    fontWeight: active ? 600 : 500,
    fontSize: '0.9rem'
  }}
  onMouseEnter={(e) => {
    if (!active) {
      e.currentTarget.style.color = 'var(--text-main)';
      e.currentTarget.style.background = 'var(--bg-main)';
    }
  }}
  onMouseLeave={(e) => {
    if (!active) {
      e.currentTarget.style.color = 'var(--text-muted)';
      e.currentTarget.style.background = 'transparent';
    }
  }}>
    <Icon size={18} style={{ marginRight: '1rem' }} />
    <span>{label}</span>
  </div>
);

const Sidebar = () => {
  const { logout, userRole } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  return (
    <div className="sidebar">
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>A</span>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>AARAMBH</h2>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Institution</div>
        </div>
      </div>
      
      <div style={{ flex: 1, marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        <div style={{ padding: '0 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Menu</div>
        
        {/* Admin Links */}
        {userRole === 'admin' && (
          <>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={path === '/dashboard'} onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={IndianRupee} label="Profit & Loss" active={path === '/profit-loss'} onClick={() => navigate('/profit-loss')} />
            <SidebarItem icon={CheckSquare} label="Attendance" active={path === '/attendance'} onClick={() => navigate('/attendance')} />
            <SidebarItem icon={IndianRupee} label="Fees" active={path === '/fees'} onClick={() => navigate('/fees')} />
            <SidebarItem icon={BookOpen} label="Assignments" active={path === '/assignments'} onClick={() => navigate('/assignments')} />
            <SidebarItem icon={MessageSquare} label="Messages" active={path === '/messages'} onClick={() => navigate('/messages')} />
            <SidebarItem icon={ClipboardList} label="Requests" active={path === '/requests'} onClick={() => navigate('/requests')} />
            <SidebarItem icon={Users} label="Students" active={path === '/students'} onClick={() => navigate('/students')} />
            <SidebarItem icon={BookOpen} label="Classes" active={path === '/classes'} onClick={() => navigate('/classes')} />
            <SidebarItem icon={Calendar} label="Calendar" active={path === '/calendar'} onClick={() => navigate('/calendar')} />
            <SidebarItem icon={BookOpen} label="Library" active={path === '/library'} onClick={() => navigate('/library')} />
            <SidebarItem icon={Clock} label="System History" active={path === '/history'} onClick={() => navigate('/history')} />
          </>
        )}

        {/* Teacher Links */}
        {userRole === 'teacher' && (
          <>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={path === '/teacher-dashboard'} onClick={() => navigate('/teacher-dashboard')} />
            <SidebarItem icon={CheckSquare} label="Attendance" active={path === '/attendance'} onClick={() => navigate('/attendance')} />
            <SidebarItem icon={BookOpen} label="Assignments" active={path === '/assignments'} onClick={() => navigate('/assignments')} />
            <SidebarItem icon={MessageSquare} label="Messages" active={path === '/messages'} onClick={() => navigate('/messages')} />
            <SidebarItem icon={BookOpen} label="My Classes" active={path === '/classes'} onClick={() => navigate('/classes')} />
            <SidebarItem icon={Calendar} label="Calendar" active={path === '/calendar'} onClick={() => navigate('/calendar')} />
            <SidebarItem icon={BookOpen} label="Library" active={path === '/library'} onClick={() => navigate('/library')} />
          </>
        )}

        {/* Student Links */}
        {userRole === 'student' && (
          <>
            <SidebarItem icon={LayoutDashboard} label="My Dashboard" active={path === '/student-dashboard'} onClick={() => navigate('/student-dashboard')} />
            <SidebarItem icon={CheckSquare} label="My Attendance" active={path === '/student-attendance'} onClick={() => navigate('/student-attendance')} />
            <SidebarItem icon={IndianRupee} label="My Receipts" active={path === '/student-receipts'} onClick={() => navigate('/student-receipts')} />
            <SidebarItem icon={BookOpen} label="My Assignments" active={path === '/assignments'} onClick={() => navigate('/assignments')} />
            <SidebarItem icon={Calendar} label="Class Schedule" active={path === '/calendar'} onClick={() => navigate('/calendar')} />
            <SidebarItem icon={BookOpen} label="Study Materials" active={path === '/library'} onClick={() => navigate('/library')} />
          </>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <SidebarItem icon={Settings} label="Settings" active={path === '/settings'} onClick={() => navigate('/settings')} />
        <SidebarItem icon={LogOut} label="Logout" onClick={logout} />
      </div>
    </div>
  );
};

export default Sidebar;