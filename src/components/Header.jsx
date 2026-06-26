import React, { useContext } from 'react';
import { Bell, Search, UserCircle, Sun, Moon } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { theme, setTheme } = useContext(AppContext);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="flex-between" style={{ marginBottom: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{currentDate}</p>
      </div>

      <div className="flex-center gap-3">
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search..." 
            className="prof-input"
            style={{ paddingLeft: '2.5rem', borderRadius: '20px', width: '250px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        {/* Theme Switcher Button */}
        <div onClick={toggleTheme} title="Toggle Theme" style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          {theme === 'light' ? <Moon size={18} color="var(--text-main)" /> : <Sun size={18} color="var(--text-main)" />}
        </div>

        <div style={{ position: 'relative', cursor: 'pointer' }} className="flex-center">
          <Bell size={20} color="var(--text-main)" />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--danger)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: '2px solid var(--bg-main)'
          }}></span>
        </div>

        <div className="flex-center gap-1" style={{ cursor: 'pointer', marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
          <UserCircle size={32} color="var(--primary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Admin</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
