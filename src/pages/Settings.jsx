import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Moon, Sun, Lock, User, Save, Bell, Globe, MonitorSmartphone, Cloud, Loader } from 'lucide-react';

const Settings = () => {
  const { theme, setTheme, loggedInUser, addToast, authHeaders, API_URL } = useContext(AppContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Mock states for new features
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [language, setLanguage] = useState('English');
  const [driveConnected, setDriveConnected] = useState(false);

  // WhatsApp Robot States
  const [waStatus, setWaStatus] = useState('LOADING');
  const [waQr, setWaQr] = useState(null);

  useEffect(() => {
    // Poll WhatsApp status every 3 seconds if not connected
    const fetchWaStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/whatsapp/status`, {
          headers: authHeaders
        });
        if (res.ok) {
          const data = await res.json();
          setWaStatus(data.status);
          setWaQr(data.qr);
        } else {
          setWaStatus('ERROR');
        }
      } catch(e) {
        setWaStatus('ERROR');
      }
    };

    fetchWaStatus();
    const interval = setInterval(() => {
      if (waStatus !== 'CONNECTED') {
        fetchWaStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [waStatus, authHeaders, API_URL]);

  // Profile States
  const [profileName, setProfileName] = useState(loggedInUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(loggedInUser?.email || '');

  useEffect(() => {
    if (loggedInUser) {
      setProfileName(loggedInUser.name || '');
      setProfileEmail(loggedInUser.email || '');
    }
  }, [loggedInUser]);

  const handleSavePreferences = () => {
    addToast('Preferences saved successfully!', 'success');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      addToast('Please fill out both password fields.', 'danger');
      return;
    }
    // In a real app, this would hit an API endpoint
    addToast('Password updated successfully!', 'success');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName) return;
    const success = await updateProfile(profileName, profileEmail);
    if (success) {
      // Nothing else to do, AppContext toast handles message
    }
  };

  const handleEmailBackup = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/backup`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Database backup sent to your email!', 'success');
        if (data.previewUrl) {
          window.open(data.previewUrl, '_blank');
        }
      } else {
        addToast(data.error || 'Failed to email backup', 'danger');
      }
    } catch(e) {
      addToast('Network error triggering backup', 'danger');
    }
  };

  const handleSendWeeklyReport = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/report`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Weekly financial report sent to your email!', 'success');
        if (data.previewUrl) {
          window.open(data.previewUrl, '_blank');
        }
      } else {
        addToast(data.error || 'Failed to email report', 'danger');
      }
    } catch(e) {
      addToast('Network error triggering report', 'danger');
    }
  };

  const handleRestartWhatsApp = async () => {
    try {
      const res = await fetch(`${API_URL}/whatsapp/restart`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        addToast('WhatsApp Robot restarting...', 'info');
        setWaStatus('INITIALIZING');
        setWaQr(null);
      } else {
        addToast('Failed to restart WhatsApp Robot', 'danger');
      }
    } catch(e) {
      addToast('Network error connecting to local server', 'danger');
    }
  };

  // Check if page is loaded over HTTPS (external deployment like GitHub Pages)
  const isExternalDeployment = window.location.protocol === 'https:';

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Account Settings</h2>

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cloud size={18} /> WhatsApp Robot (Auto-Messaging)
            </h3>
            
            <div style={{ padding: '1.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              
              {isExternalDeployment && (
                <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', width: '100%', maxWidth: '500px', marginBottom: '1rem' }}>
                  <strong>Security Notice:</strong> You are viewing this page over a secure HTTPS connection (GitHub Pages). Browser security blocks connections to local backend servers (HTTP) from here. 
                  <br/><br/>
                  To link your WhatsApp and view status, please open the local address:
                  <br/>
                  <a href="http://localhost:5173/Aarambh-/settings" style={{ color: 'var(--danger)', fontWeight: 600, textDecoration: 'underline' }}>http://localhost:5173/Aarambh-/settings</a>
                </div>
              )}

              {waStatus === 'LOADING' || waStatus === 'INITIALIZING' ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  <Loader className="spin" size={32} style={{ marginBottom: '1rem' }} />
                  <p>Booting up WhatsApp Robot on Server...</p>
                </div>
              ) : waStatus === 'AWAITING_SCAN' && waQr ? (
                <div>
                  <h4 style={{ margin: '0 0 1rem 0' }}>Link your WhatsApp</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', maxWidth: '400px', textAlign: 'left' }}>
                    1. Open WhatsApp on your phone.<br/>
                    2. Tap Menu or Settings and select <strong>Linked Devices</strong>.<br/>
                    3. Tap on <strong>Link a Device</strong>.<br/>
                    4. Point your phone to this screen to capture the code.
                  </p>
                  <img src={waQr} alt="WhatsApp QR Code" style={{ border: '4px solid white', borderRadius: '8px', maxWidth: '250px', display: 'block', margin: '0 auto 1rem auto' }} />
                  <button onClick={handleRestartWhatsApp} className="prof-btn prof-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Regenerate QR Code</button>
                </div>
              ) : waStatus === 'CONNECTED' ? (
                <div style={{ padding: '1rem', color: 'var(--success)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    <MonitorSmartphone size={32} />
                  </div>
                  <h4 style={{ margin: 0, color: '#25D366' }}>WhatsApp Robot Connected!</h4>
                  <p style={{ margin: '0.5rem 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>The system will now automatically send background messages via your WhatsApp account.</p>
                  <button onClick={handleRestartWhatsApp} className="prof-btn prof-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Disconnect Robot</button>
                </div>
              ) : (
                <div style={{ padding: '1rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>WhatsApp Robot is currently offline or failed to initialize.</p>
                  <button onClick={handleRestartWhatsApp} className="prof-btn" style={{ fontSize: '0.85rem' }}>
                    Link WhatsApp Device
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Profile Information
            </h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="prof-input" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email Address (Admin notifications/backups)</label>
                  <input 
                    type="email" 
                    className="prof-input" 
                    value={profileEmail} 
                    onChange={e => setProfileEmail(e.target.value)} 
                    placeholder="Enter email address" 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Role</label>
                <input type="text" className="prof-input" disabled value={(loggedInUser?.role || 'Admin').toUpperCase()} />
              </div>
              <button type="submit" className="prof-btn" style={{ alignSelf: 'flex-start' }}>Save Profile</button>
            </form>
          </div>

          {loggedInUser?.role === 'admin' && (
            <div className="prof-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={18} /> Database Backups & Reports
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                Quickly mail system updates and database backups directly to your configured email address.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleEmailBackup}
                  className="prof-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Email Database Backup
                </button>
                <button 
                  onClick={handleSendWeeklyReport}
                  className="prof-btn prof-btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Send Weekly Report Now
                </button>
              </div>
            </div>
          )}

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Moon size={18} /> Appearance
            </h3>
            <div className="flex-between">
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Dark Mode</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toggle between light and dark themes</p>
              </div>
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                className={`prof-btn ${theme === 'dark' ? '' : 'prof-btn-outline'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'}
              </button>
            </div>
          </div>

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} /> Notification Preferences
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ fontWeight: 500, display: 'block' }}>Email Notifications</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive daily summaries and alerts via email</span>
                </div>
                <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ fontWeight: 500, display: 'block' }}>SMS Alerts</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive instant text messages for urgent updates</span>
                </div>
                <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
              </label>
            </div>
          </div>

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} /> Regional Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Display Language</label>
                <select className="prof-input" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Timezone</label>
                <select className="prof-input" disabled>
                  <option>Asia/Kolkata (IST)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} /> Security & Authentication
            </h3>
            
            <div className="flex-between" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Two-Factor Authentication (2FA)</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Secure your account with an additional verification step.</p>
              </div>
              <button className="prof-btn prof-btn-outline" style={{ padding: '0.5rem 1rem' }}>Enable 2FA</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Current Password</label>
                <input type="password" placeholder="••••••••" className="prof-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>New Password</label>
                <input type="password" placeholder="••••••••" className="prof-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <div className="flex-between">
              <button onClick={handleChangePassword} className="prof-btn">Update Password</button>
              
              <button className="prof-btn prof-btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MonitorSmartphone size={16} /> Log out of all devices
              </button>
            </div>
          </div>

          <div className="prof-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cloud size={18} /> Connected Apps & Integrations
            </h3>
            
            <div className="flex-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Google Drive Sync</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Automatically backup Library materials and Assignments</p>
              </div>
              <button 
                onClick={() => setDriveConnected(!driveConnected)} 
                className={`prof-btn ${driveConnected ? 'prof-btn-outline' : ''}`}
                style={{ padding: '0.5rem 1rem' }}
              >
                {driveConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            <div className="flex-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Zoom Integration</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generate live class links directly from the calendar</p>
              </div>
              <button className="prof-btn" style={{ padding: '0.5rem 1rem' }}>Connect</button>
            </div>

            <div className="flex-between">
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>WhatsApp Business API</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send automated fee reminders via WhatsApp</p>
              </div>
              <button className="prof-btn" style={{ padding: '0.5rem 1rem' }}>Connect</button>
            </div>
          </div>

          {loggedInUser?.role === 'admin' && (
            <div className="prof-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MonitorSmartphone size={18} /> Billing & Subscription
              </h3>
              <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Aarambh Premium Plan</span>
                  <span className="badge badge-success">Active</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Next billing date: Jan 01, 2025</p>
              </div>
              <button className="prof-btn prof-btn-outline" style={{ padding: '0.5rem 1rem' }}>Manage Subscription</button>
            </div>
          )}

          <div className="prof-card" style={{ marginBottom: '2rem', border: '1px solid var(--danger)' }}>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <Lock size={18} /> Data & Privacy
            </h3>
            
            <div className="flex-between" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Export Account Data</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Download all your data in JSON or CSV format.</p>
              </div>
              <button className="prof-btn prof-btn-outline" style={{ padding: '0.5rem 1rem' }}>Request Data</button>
            </div>

            <div className="flex-between">
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--danger)' }}>Delete Account</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Permanently delete your account and all associated data.</p>
              </div>
              <button className="prof-btn" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)', padding: '0.5rem 1rem' }}>Delete Account</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button onClick={handleSavePreferences} className="prof-btn" style={{ padding: '0.75rem 2rem' }}>
              <Save size={16} style={{ marginRight: '0.5rem' }} /> Save All Changes
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Settings;
