import React, { useContext } from 'react';
import { LayoutDashboard, Users, BookOpen, CheckSquare, Settings, LogOut, IndianRupee, MessageSquare, Calendar, ClipboardList, Clock, Sun, Moon } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/image_7cc2c3.jpg';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex',
    alignItems: 'center',
    padding: '0.8rem 1.5rem',
    cursor: 'pointer',
    color: active ? 'var(--primary-text)' : 'var(--text-muted)',
    background: active ? 'var(--secondary)' : 'transparent',
    borderLeft: active ? '4px solid var(--primary-text)' : '4px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: active ? 600 : 500,
    fontSize: '0.9rem',
    gap: '0.5rem'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateX(6px)';
    if (!active) {
      e.currentTarget.style.color = 'var(--text-main)';
      e.currentTarget.style.background = 'var(--primary)';
    }
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateX(0)';
    if (!active) {
      e.currentTarget.style.color = 'var(--text-muted)';
      e.currentTarget.style.background = 'transparent';
    }
  }}>
    <Icon size={18} style={{ marginRight: '0.5rem', transition: 'transform 0.3s ease' }} />
    <span>{label}</span>
  </div>
);

const Sidebar = () => {
  const { logout, userRole, sidebarCollapsed, theme, setTheme } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '50%', 
          overflow: 'hidden', background: 'white', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <img src={logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <SidebarItem icon={Users} label="Teachers" active={path === '/teachers'} onClick={() => navigate('/teachers')} />
            <SidebarItem icon={Users} label="Students" active={path === '/students'} onClick={() => navigate('/students')} />
            <SidebarItem icon={BookOpen} label="Batches" active={path === '/classes'} onClick={() => navigate('/classes')} />
            <SidebarItem icon={IndianRupee} label="Expenses" active={path === '/profit-loss'} onClick={() => navigate('/profit-loss')} />
            <SidebarItem icon={CheckSquare} label="Attendance" active={path === '/attendance'} onClick={() => navigate('/attendance')} />
            <SidebarItem icon={IndianRupee} label="Fees" active={path === '/fees'} onClick={() => navigate('/fees')} />
            <SidebarItem icon={BookOpen} label="Assignments" active={path === '/assignments'} onClick={() => navigate('/assignments')} />
            <SidebarItem icon={BookOpen} label="Study Material" active={path === '/library'} onClick={() => navigate('/library')} />
            <SidebarItem icon={MessageSquare} label="Announcements" active={path === '/messages'} onClick={() => navigate('/messages')} />
            <SidebarItem icon={ClipboardList} label="Requests" active={path === '/requests'} onClick={() => navigate('/requests')} />
            <SidebarItem icon={Clock} label="System History" active={path === '/history'} onClick={() => navigate('/history')} />
          </>
        )}

        {/* Teacher Links */}
        {userRole === 'teacher' && (
          <>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={path === '/teacher-dashboard'} onClick={() => navigate('/teacher-dashboard')} />
            <SidebarItem icon={CheckSquare} label="Attendance" active={path === '/attendance'} onClick={() => navigate('/attendance')} />
            <SidebarItem icon={BookOpen} label="Assignments" active={path === '/assignments'} onClick={() => navigate('/assignments')} />
            <SidebarItem icon={MessageSquare} label="Announcements" active={path === '/messages'} onClick={() => navigate('/messages')} />
            <SidebarItem icon={BookOpen} label="My Batches" active={path === '/classes'} onClick={() => navigate('/classes')} />
            <SidebarItem icon={Calendar} label="Events" active={path === '/calendar'} onClick={() => navigate('/calendar')} />
            <SidebarItem icon={BookOpen} label="Study Material" active={path === '/library'} onClick={() => navigate('/library')} />
          </>
        )}

        {/* Student Links */}
        {userRole === 'student' && (
          <>
            <SidebarItem icon={LayoutDashboard} label="My Dashboard" active={path === '/student-dashboard'} onClick={() => navigate('/student-dashboard')} />
            <SidebarItem icon={CheckSquare} label="My Attendance" active={path === '/student-attendance'} onClick={() => navigate('/student-attendance')} />
            <SidebarItem icon={IndianRupee} label="My Receipts" active={path === '/student-receipts'} onClick={() => navigate('/student-receipts')} />
            <SidebarItem icon={BookOpen} label="My Assignments" active={path === '/assignments'} onClick={() => navigate('/assignments')} />
            <SidebarItem icon={Calendar} label="Events" active={path === '/calendar'} onClick={() => navigate('/calendar')} />
            <SidebarItem icon={BookOpen} label="Study Material" active={path === '/library'} onClick={() => navigate('/library')} />
          </>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Theme</span>
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                padding: '0.3rem 0.6rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: 'var(--text-main)'
              }}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={12} color="var(--primary-text)" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Dark</span>
                </>
              ) : (
                <>
                  <Sun size={12} color="var(--primary-text)" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Light</span>
                </>
              )}
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{ display: 'flex', justifyContent: 'center', padding: '0.8rem 0', cursor: 'pointer', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </div>
        )}
        <SidebarItem icon={Settings} label="Settings" active={path === '/settings'} onClick={() => navigate('/settings')} />
        <SidebarItem icon={LogOut} label="Logout" onClick={logout} />
      </div>
    </div>
  );
};

export default Sidebar;