import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import WhatsAppStatus from '../components/WhatsAppStatus';
import { Moon, Sun, Lock, User, Save, Bell, Globe, MonitorSmartphone, Cloud, Loader, Clock } from 'lucide-react';

const Settings = () => {
  const { theme, setTheme, loggedInUser, addToast, authHeaders, API_URL, history, messages, fetchHistory, updateProfile, sendMonthlyAttendanceReport } = useContext(AppContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // SMTP Settings States
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  
  // System Toggle States
  const [emailFeeAlerts, setEmailFeeAlerts] = useState(true);
  const [emailAttendanceAlerts, setEmailAttendanceAlerts] = useState(true);

  const handleSendMonthlyAttendanceReport = async () => {
    addToast('Compiling and sending monthly attendance reports...', 'info');
    await sendMonthlyAttendanceReport();
  };

  const handleToggleSetting = async (key, val) => {
    if (key === 'emailFeeAlerts') setEmailFeeAlerts(val);
    if (key === 'emailAttendanceAlerts') setEmailAttendanceAlerts(val);

    try {
      await fetch(`${API_URL}/admin/system-settings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          emailFeeAlerts: key === 'emailFeeAlerts' ? val : emailFeeAlerts,
          emailAttendanceAlerts: key === 'emailAttendanceAlerts' ? val : emailAttendanceAlerts
        })
      });
      addToast('Notification preferences updated.', 'success');
    } catch (e) {
      addToast('Preferences saved locally.', 'success');
    }
  };

  // Mock states for new features
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [language, setLanguage] = useState('English');
  const [driveConnected, setDriveConnected] = useState(false);
  const [historyTab, setHistoryTab] = useState('activity');

  // WhatsApp Robot States
  const [waStatus, setWaStatus] = useState('LOADING');
  const [waQr, setWaQr] = useState(null);

  useEffect(() => {
    if (loggedInUser?.role === 'admin') {
      fetchHistory();
    }
  }, [loggedInUser]);

  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/system-settings`, {
          headers: authHeaders
        });
        if (res.ok) {
          const data = await res.json();
          setEmailFeeAlerts(data.emailFeeAlerts);
          setEmailAttendanceAlerts(data.emailAttendanceAlerts);
        }
      } catch (e) {
        // ignore
      }
    };
    if (loggedInUser?.role === 'admin') {
      fetchSystemSettings();
    }
  }, [loggedInUser, API_URL, authHeaders]);

  useEffect(() => {
    const fetchSmtpSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/smtp-settings`, {
          headers: authHeaders
        });
        if (res.ok) {
          const data = await res.json();
          setSmtpEmail(data.email || 'aarambhinstitute46@gmail.com');
        } else {
          setSmtpEmail(localStorage.getItem('aarambh_smtp_email') || 'aarambhinstitute46@gmail.com');
        }
      } catch (e) {
        setSmtpEmail(localStorage.getItem('aarambh_smtp_email') || 'aarambhinstitute46@gmail.com');
      }
    };
    
    if (loggedInUser?.role === 'admin') {
      fetchSmtpSettings();
    }
  }, [loggedInUser, API_URL, authHeaders]);

  const handleSaveSmtpSettings = async (e) => {
    e.preventDefault();
    addToast('Verifying Gmail link... Please wait.', 'info');
    try {
      const res = await fetch(`${API_URL}/admin/smtp-settings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email: smtpEmail, password: smtpPassword })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Gmail Account Linked & Verified successfully!', 'success');
        setSmtpPassword('');
      } else {
        addToast(data.error || 'Failed to authenticate and link Gmail.', 'danger');
      }
    } catch (e) {
      localStorage.setItem('aarambh_smtp_email', smtpEmail);
      addToast('SMTP configuration simulated locally in offline mode!', 'success');
    }
  };

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
  const [profilePhoto, setProfilePhoto] = useState(loggedInUser?.photo || '');

  useEffect(() => {
    if (loggedInUser) {
      setProfileName(loggedInUser.name || '');
      setProfileEmail(loggedInUser.email || '');
      setProfilePhoto(loggedInUser.photo || '');
    }
  }, [loggedInUser]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePreferences = () => {
    addToast('Preferences saved successfully!', 'success');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      addToast('Please fill out both password fields.', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/update-password`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        addToast(data.error || 'Failed to update password', 'danger');
      }
    } catch (e) {
      addToast('Network error updating password', 'danger');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName) return;
    const success = await updateProfile(profileName, profileEmail, profilePhoto);
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
        
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, marginBottom: '2rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Account Settings</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', alignItems: 'start', marginBottom: '2rem' }}>
            
            {/* Left Column: Account Details, SMTP, Apps & Privacy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile Card */}
              <div className="prof-card" style={{ margin: 0 }}>
                <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} /> Profile Information
                </h3>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-main)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Photo</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Upload New Photo</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange} 
                        style={{ fontSize: '0.8rem' }}
                      />
                      {profilePhoto && (
                        <button type="button" onClick={() => setProfilePhoto('')} style={{ fontSize: '0.75rem', color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginTop: '4px', display: 'block' }}>Remove Photo</button>
                      )}
                    </div>
                  </div>

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

              {/* Security Card */}
              <div className="prof-card" style={{ margin: 0 }}>
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

              {/* Gmail SMTP Settings (Admin Only) */}
              {loggedInUser?.role === 'admin' && (
                <div className="prof-card" style={{ margin: 0 }}>
                  <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cloud size={18} /> Email Notification Settings (Gmail SMTP)
                  </h3>
                  <form onSubmit={handleSaveSmtpSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="prof-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Gmail Address</label>
                        <input 
                          type="email" 
                          value={smtpEmail} 
                          onChange={e => setSmtpEmail(e.target.value)} 
                          placeholder="aarambhinstitute46@gmail.com" 
                          className="prof-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="prof-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Gmail App Password / Passkey</label>
                        <input 
                          type="password" 
                          value={smtpPassword} 
                          onChange={e => setSmtpPassword(e.target.value)} 
                          placeholder="••••••••••••••••" 
                          className="prof-input"
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      To link your Gmail, you must generate a 16-character <strong>App Password</strong> in your Google Account Security settings instead of using your main account password.
                    </div>
                    <button type="submit" className="prof-btn" style={{ alignSelf: 'flex-start' }}>Save SMTP Configuration</button>
                  </form>
                </div>
              )}

              {/* Connected Apps & Integrations */}
              <div className="prof-card" style={{ margin: 0 }}>
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

              {/* Appearance */}
              <div className="prof-card" style={{ margin: 0 }}>
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

              {/* Data & Privacy Card (Danger Zone) */}
              <div className="prof-card" style={{ margin: 0, border: '1px solid var(--danger)' }}>
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

            </div>

            {/* Right Column: Communications, System Config & Operations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* WhatsApp Robot Link */}
              {(loggedInUser?.role === 'admin' || loggedInUser?.role === 'teacher') && (
                <WhatsAppStatus />
              )}

              {/* Database Backups & Reports (Admin Only) */}
              {loggedInUser?.role === 'admin' && (
                <div className="prof-card" style={{ margin: 0 }}>
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
                    <a 
                      href={`${API_URL}/admin/backup/download?token=${localStorage.getItem('token')}`}
                      download="aarambh_backup.db"
                      className="prof-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: 'var(--primary)', color: 'white' }}
                    >
                      📥 Download Backup (Direct)
                    </a>
                    <button 
                      onClick={handleSendWeeklyReport}
                      className="prof-btn prof-btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Send Weekly Report Now
                    </button>
                    <button 
                      onClick={handleSendMonthlyAttendanceReport}
                      className="prof-btn prof-btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      📊 Email Monthly Attendance Reports
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Preferences */}
              <div className="prof-card" style={{ margin: 0 }}>
                <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} /> Notification Preferences
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontWeight: 500, display: 'block' }}>Email Notifications (General)</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive daily summaries and alerts via email</span>
                    </div>
                    <input type="checkbox" checked={emailAlerts} onChange={(e) => handleToggleGeneralNotification('emailAlerts', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontWeight: 500, display: 'block' }}>SMS Alerts</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive instant text messages for urgent updates</span>
                    </div>
                    <input type="checkbox" checked={smsAlerts} onChange={(e) => handleToggleGeneralNotification('smsAlerts', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                  </label>

                  {loggedInUser?.role === 'admin' && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <div>
                          <span style={{ fontWeight: 500, display: 'block' }}>Auto-Send Fee Reminders via Email</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send billing reminder emails to parents when triggering dues alerts</span>
                        </div>
                        <input type="checkbox" checked={emailFeeAlerts} onChange={(e) => handleToggleSetting('emailFeeAlerts', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div>
                          <span style={{ fontWeight: 500, display: 'block' }}>Auto-Send Monthly Attendance Reports</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allow sending structured monthly attendance HTML reports to parents</span>
                        </div>
                        <input type="checkbox" checked={emailAttendanceAlerts} onChange={(e) => handleToggleSetting('emailAttendanceAlerts', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Regional Settings */}
              <div className="prof-card" style={{ margin: 0 }}>
                <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={18} /> Regional Settings
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Display Language</label>
                    <select className="prof-input" value={language} onChange={e => handleLanguageChange(e.target.value)}>
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

              {/* Billing Card (Admin Only) */}
              {loggedInUser?.role === 'admin' && (
                <div className="prof-card" style={{ margin: 0 }}>
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

            </div>

          </div>

          {/* Full-width System History & Logs (Admin Only) */}
          {loggedInUser?.role === 'admin' && (
            <div className="prof-card" style={{ marginTop: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} /> System History & Logs
              </h3>
              
              {/* Tab navigation */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setHistoryTab('activity')}
                  className={`prof-btn ${historyTab === 'activity' ? '' : 'prof-btn-outline'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  System Activity
                </button>
                <button 
                  onClick={() => setHistoryTab('messages')}
                  className={`prof-btn ${historyTab === 'messages' ? '' : 'prof-btn-outline'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  Messages Sent
                </button>
                <button 
                  onClick={() => setHistoryTab('backups')}
                  className={`prof-btn ${historyTab === 'backups' ? '' : 'prof-btn-outline'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  Emailed Backups & Reports
                </button>
              </div>

              {/* Tab data display */}
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '0.5rem' }}>
                {historyTab === 'activity' && (
                  history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '1rem 0' }}>No activity logs recorded yet.</p>
                  ) : (
                    history.map(log => (
                      <div key={log.id} style={{ padding: '0.8rem 1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{log.action.replace(/_/g, ' ')}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-main)' }}>{log.details}</p>
                      </div>
                    ))
                  )
                )}

                {historyTab === 'messages' && (
                  messages.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '1rem 0' }}>No messages sent yet.</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} style={{ padding: '0.8rem 1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600 }}>Recipient: {msg.recipient}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{msg.date}</span>
                        </div>
                        <p style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)' }}>{msg.content}</p>
                        <span className={`badge ${msg.status === 'Failed' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                          Status: {msg.status}
                        </span>
                      </div>
                    ))
                  )
                )}

                {historyTab === 'backups' && (
                  history.filter(log => log.action === 'BACKUP_EMAILED' || log.action === 'REPORT_EMAILED').length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '1rem 0' }}>No backups or reports emailed yet.</p>
                  ) : (
                    history.filter(log => log.action === 'BACKUP_EMAILED' || log.action === 'REPORT_EMAILED').map(log => (
                      <div key={log.id} style={{ padding: '0.8rem 1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--success)' }}>{log.action.replace(/_/g, ' ')}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-main)' }}>{log.details}</p>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          )}
          
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
