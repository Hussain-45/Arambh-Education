import React, { useContext, useState, useEffect, useRef } from 'react';
import { Bell, Search, Sun, Moon, Menu, IndianRupee, Clipboard } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { theme, setTheme, students, classes, logout, userRole, sidebarCollapsed, setSidebarCollapsed, notifications, markAllNotificationsAsRead, loggedInUser } = useContext(AppContext);
  const [searchVal, setSearchVal] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeString, setTimeString] = useState('');
  
  const navigate = useNavigate();
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      setTimeString(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchVal('');
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const filteredStudentsRaw = searchVal.trim() === '' ? [] : students.filter(s => s && (s.name || '').toLowerCase().includes(searchVal.toLowerCase()));
  const filteredClassesRaw = searchVal.trim() === '' ? [] : classes.filter(c => c && (c.name || '').toLowerCase().includes(searchVal.toLowerCase()));

  const filteredStudents = Array.from(new Map(filteredStudentsRaw.filter(s => s && s.id).map(s => [s.id, s])).values());
  const filteredClasses = Array.from(new Map(filteredClassesRaw.filter(c => c && c.id).map(c => [c.id, c])).values());

  const getInitials = () => {
    if (loggedInUser && loggedInUser.name) {
      return loggedInUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userRole === 'admin') return 'AD';
    if (userRole === 'teacher') return 'TE';
    return 'ST';
  };

  return (
    <header className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
      
      {/* Left side: Hamburger Toggle + Overview Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--secondary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--secondary)'}
        >
          <Menu size={20} color="var(--text-main)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentDate}</p>
        </div>
      </div>

      {/* Right side: Time + Search + Theme + Notifications + User */}
      <div className="flex-center gap-3" style={{ flexWrap: 'wrap' }}>
        
        {/* Digital Clock */}
        <div className="flex-center" style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          color: 'var(--primary-text)',
          fontWeight: 600,
          background: 'var(--secondary)',
          border: '1px solid var(--border-color)',
        }}>
          {timeString || '00:00:00 AM'}
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search students, classes..." 
            className="prof-input"
            style={{ paddingLeft: '2.2rem', borderRadius: '20px', width: '220px' }}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          
          {searchVal && (
            <div className="prof-card" style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              width: '300px',
              maxHeight: '350px',
              overflowY: 'auto',
              zIndex: 1000,
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-glass)',
              borderRadius: '12px'
            }}>
              {filteredStudents.length === 0 && filteredClasses.length === 0 ? (
                <div style={{ padding: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No results found</div>
              ) : (
                <>
                  {filteredClasses.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.8rem 0.2rem 0.8rem' }}>Classes</div>
                      {filteredClasses.map(c => (
                        <div 
                          key={c.id} 
                          className="search-item" 
                          style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.9rem', borderRadius: '6px' }}
                          onClick={() => {
                            navigate(`/classes/${c.id}`);
                            setSearchVal('');
                          }}
                        >
                          <strong>{c.name}</strong> <span style={{ float: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.grade}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredStudents.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.8rem 0.2rem 0.8rem' }}>Students</div>
                      {filteredStudents.map(s => {
                        const sClass = classes.find(c => c.name === s.class);
                        return (
                          <div 
                            key={s.id} 
                            className="search-item" 
                            style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.9rem', borderRadius: '6px' }}
                            onClick={() => {
                              if (sClass) {
                                navigate(`/classes/${sClass.id}`);
                              } else {
                                navigate('/students');
                              }
                              setSearchVal('');
                            }}
                          >
                            <strong>{s.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.class || 'No Class'}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <div 
          onClick={toggleTheme} 
          title="Toggle Theme" 
          style={{ 
            cursor: 'pointer', 
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--secondary)', 
            border: '1px solid var(--border-color)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            transition: 'background 0.2s' 
          }}
        >
          {theme === 'light' ? <Moon size={18} color="var(--text-main)" /> : <Sun size={18} color="var(--text-main)" />}
        </div>

        {/* Notifications */}
        <div 
          ref={notifRef} 
          className="flex-center" 
          onClick={() => setShowNotifications(!showNotifications)} 
          title="Notifications"
          style={{
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Bell size={18} color="var(--text-main)" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--danger)',
              color: 'white',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-main)'
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Profile */}
        <div 
          ref={profileRef} 
          className="flex-center gap-2" 
          style={{ position: 'relative', cursor: 'pointer', paddingLeft: '0.5rem' }} 
          onClick={() => setShowProfileMenu(!showProfileMenu)} 
          title="Account Settings"
        >
          {loggedInUser?.photo ? (
            <img 
              src={loggedInUser.photo} 
              alt={loggedInUser.name || 'User'} 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '2px solid var(--primary)'
              }} 
            />
          ) : (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary-text)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {getInitials()}
            </div>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{userRole}</span>

          {showProfileMenu && (
            <div className="prof-card" style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '180px',
              zIndex: 1000,
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-glass)',
              borderRadius: '12px',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}>
              <div 
                className="search-item" 
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                onClick={() => navigate('/settings')}
              >
                Settings Panel
              </div>
              <div 
                className="search-item" 
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                onClick={logout}
              >
                Logout / Sign Out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: showNotifications ? 0 : '-360px',
        width: '360px',
        height: '100vh',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
        zIndex: 2000,
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Notification Center</h3>
          <button 
            onClick={() => setShowNotifications(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={markAllNotificationsAsRead} className="prof-btn prof-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
            Mark All as Read
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {(!notifications || notifications.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>No notifications yet.</p>
          ) : (
            notifications.map(n => {
              let IconComp = Bell;
              let iconColor = '#6366f1';
              if (n.type === 'fee') {
                IconComp = IndianRupee;
                iconColor = '#10b981';
              } else if (n.type === 'assignment') {
                IconComp = Clipboard;
                iconColor = '#a855f7';
              } else if (n.type === 'success') {
                IconComp = CheckCircle;
                iconColor = '#10b981';
              }
              return (
                <div key={n.id} style={{
                  padding: '0.8rem',
                  background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <div style={{
                      padding: '0.3rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      color: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComp size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>{n.title}</strong>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>{n.text}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>{n.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
