import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Fingerprint, Lock, User, GraduationCap, ShieldCheck, Briefcase } from 'lucide-react';

const Login = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'teacher', or 'student'
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState(''); // Specific to Student
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [className, setClassName] = useState(''); // Specific to Student registration
  const [admissionNumber, setAdmissionNumber] = useState(''); // Optional, auto-generated if blank
  const [fees, setFees] = useState(''); // Initial fee amount

  const { loginAdmin, registerAdmin, loginTeacher, loginStudent, requestRegistration, classes, addToast } = useContext(AppContext);
  const navigate = useNavigate();

  const resetForm = () => {
    setError('');
    setIsRegisterMode(false);
    setUsername('');
    setPhone('');
    setPassword('');
    setClassName('');
    setAdmissionNumber('');
    setFees('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (activeTab === 'student' && (!username || !phone || !password)) {
      setError('Please fill in all fields.');
      return;
    } else if (activeTab !== 'student' && (username.length < 3 || password.length < 3)) {
      setError('Credentials too short.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'admin') {
        if (isRegisterMode) {
          const success = await registerAdmin(username, password);
          if (success) navigate('/dashboard');
          else { setError('Registration failed. Username may exist.'); setIsLoading(false); }
        } else {
          const success = await loginAdmin(username, password);
          if (success) navigate('/dashboard');
          else { setError('Invalid Admin credentials.'); setIsLoading(false); }
        }
      } else {
        // Teacher & Student
        if (isRegisterMode) {
          // Request Registration Flow
          if (activeTab === 'student' && !className) {
            setError('Please select a class batch.');
            setIsLoading(false);
            return;
          }
          const data = {
            role: activeTab,
            name: username, // For student, full name
            username: activeTab === 'teacher' ? username : null,
            password,
            phone: phone, // Pass for both student and teacher
            className: activeTab === 'student' ? className : null,
            admissionNumber: admissionNumber || null,
            fees: activeTab === 'student' && fees ? parseInt(fees) : 0
          };
          
          const success = await requestRegistration(data);
          if (success) {
            resetForm();
          }
          setIsLoading(false);
        } else {
          // Login Flow
          if (activeTab === 'teacher') {
            const success = await loginTeacher(username, password);
            if (success) navigate('/teacher-dashboard');
            else { setError('Invalid Teacher credentials.'); setIsLoading(false); }
          } else {
            const success = await loginStudent(username, phone, password); 
            if (success) navigate('/student-dashboard');
            else { setError('Invalid Student credentials.'); setIsLoading(false); }
          }
        }
      }
    } catch (err) {
      setError('Server connection error.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
      <div className="prof-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'var(--primary)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            marginBottom: '1rem', color: 'white'
          }}>
            <Fingerprint size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Aarambh Setup</h1>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', width: '100%', background: 'var(--secondary)', borderRadius: '8px', padding: '4px', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => { setActiveTab('admin'); resetForm(); }}
            style={{ 
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: activeTab === 'admin' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'admin' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === 'admin' ? 'var(--shadow-sm)' : 'none',
              fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <ShieldCheck size={16} /> Admin
          </button>
          <button 
            onClick={() => { setActiveTab('teacher'); resetForm(); }}
            style={{ 
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: activeTab === 'teacher' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'teacher' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === 'teacher' ? 'var(--shadow-sm)' : 'none',
              fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Briefcase size={16} /> Teacher
          </button>
          <button 
            onClick={() => { setActiveTab('student'); resetForm(); }}
            style={{ 
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: activeTab === 'student' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'student' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === 'student' ? 'var(--shadow-sm)' : 'none',
              fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <GraduationCap size={16} /> Student
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={activeTab === 'student' ? "Full Name" : "Username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="prof-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {(activeTab === 'student' || (activeTab === 'teacher' && isRegisterMode)) && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={activeTab === 'student' ? "Parent Phone Number" : "Your Phone Number"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="prof-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          )}

          {isRegisterMode && (activeTab === 'student' || activeTab === 'teacher') && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={`Admission No. (Leave blank to auto-generate)`}
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className="prof-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          )}
          
          {activeTab === 'student' && isRegisterMode && (
             <div style={{ position: 'relative' }}>
               <select 
                 value={className}
                 onChange={(e) => setClassName(e.target.value)}
                 className="prof-input"
                 required
               >
                 <option value="" disabled>Select Class/Batch...</option>
                 {classes.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
               </select>
             </div>
          )}

          {activeTab === 'student' && isRegisterMode && (
             <div style={{ position: 'relative' }}>
               <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
               <input 
                 type="number" 
                 placeholder="Initial Total Fees (e.g. 5000)"
                 value={fees}
                 onChange={(e) => setFees(e.target.value)}
                 className="prof-input"
                 style={{ paddingLeft: '2.5rem' }}
               />
             </div>
          )}

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder={isRegisterMode ? "Choose a Password" : "Password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="prof-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>{error}</div>}

          <button 
            type="submit" 
            className="prof-btn" 
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? (
               <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
            ) : isRegisterMode ? `Register ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
          <button 
            type="button"
            onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }} 
            className="prof-btn prof-btn-secondary"
            style={{ width: '100%', background: 'transparent', color: 'var(--primary-text)', fontWeight: 600, border: '2px solid var(--primary-text)' }}
          >
            {isRegisterMode ? '← Back to Login' : 'Request New Account Registration'}
          </button>
        </div>

        {!isRegisterMode && activeTab === 'student' && (
          <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Enter your exact Name and Parent Phone.
          </div>
        )}
        {!isRegisterMode && activeTab === 'teacher' && (
          <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Staff login. Example: 'gupta' / '123'
          </div>
        )}
        
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default Login;
