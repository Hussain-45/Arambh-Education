import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Lock, Mail, Loader2 } from 'lucide-react';
import logoImg from '../assets/image_7cc2c3.jpg';

const Login = () => {
  const { loginAdmin, loginTeacher, loginStudent, addToast } = useContext(AppContext);
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [routeOverlayMsg, setRouteOverlayMsg] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user edits
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // Role-Based Redirection Matrix
    let redirectMsg = '';
    let targetRoute = '/student-dashboard';
    let loginAction = () => loginStudent('student', '9876543210', 'student');

    if (selectedRole === 'admin') {
      redirectMsg = '[Frontend Route Triggered] Redirecting authenticated user to Admin Dashboard Panel...';
      targetRoute = '/dashboard';
      loginAction = () => loginAdmin('admin', 'admin');
    } else if (selectedRole === 'teacher') {
      redirectMsg = '[Frontend Route Triggered] Redirecting authenticated user to Teacher Workspace Portal...';
      targetRoute = '/teacher-dashboard';
      loginAction = () => loginTeacher('teacher', 'pass');
    } else {
      redirectMsg = '[Frontend Route Triggered] Redirecting authenticated user to Student & Parent Portal...';
      targetRoute = '/student-dashboard';
      loginAction = () => loginStudent('student', '9876543210', 'student');
    }

    setRouteOverlayMsg(redirectMsg);
    if (addToast) {
      addToast(redirectMsg, 'info');
    }

    // 1.5-second Latency Delay Simulation
    setTimeout(async () => {
      try {
        await loginAction();
        setIsLoading(false);
        setRouteOverlayMsg('');
        navigate(targetRoute);
      } catch (err) {
        setIsLoading(false);
        setRouteOverlayMsg('');
        setErrors({ submit: 'Authentication failed. Please verify credentials.' });
      }
    }, 1500);
  };

  return (
    <div className="flex-center" style={{ 
      position: 'relative',
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      
      {/* Animated Glossy Mesh Backdrop */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0B192C',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        {/* Teal Blob */}
        <div style={{
          position: 'absolute',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.4) 0%, rgba(13, 148, 136, 0) 70%)',
          filter: 'blur(100px)',
          top: '-15%',
          left: '10%',
          animation: 'floatTeal 22s infinite alternate ease-in-out'
        }} />

        {/* Cyan Blob */}
        <div style={{
          position: 'absolute',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0) 70%)',
          filter: 'blur(110px)',
          bottom: '-15%',
          right: '10%',
          animation: 'floatCyan 26s infinite alternate ease-in-out'
        }} />

        {/* Amber-Orange Blob */}
        <div style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.22) 0%, rgba(217, 119, 6, 0) 70%)',
          filter: 'blur(90px)',
          top: '30%',
          right: '25%',
          animation: 'floatAmber 18s infinite alternate ease-in-out'
        }} />

        <style>{`
          @keyframes floatTeal {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, 60px) scale(1.1); }
          }
          @keyframes floatCyan {
            0% { transform: translate(0, 0) scale(1.05); }
            100% { transform: translate(-80px, -100px) scale(0.95); }
          }
          @keyframes floatAmber {
            0% { transform: translate(0, 0) scale(0.9); }
            100% { transform: translate(50px, -50px) scale(1.15); }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Central Login Card (Glassmorphism style) */}
      <div style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: '430px', 
        padding: '3rem 2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(18px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        zIndex: 10
      }}>
        
        {/* TOP BLOCK - Branding */}
        <div style={{ marginBottom: '1.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            width: '84px', height: '84px', borderRadius: '50%', 
            background: 'white', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            marginBottom: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.25)'
          }}>
            <img 
              src={logoImg} 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.02em' }}>Arambh Education</h1>
          <p style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Learn • Grow • Succeed</p>
        </div>

        {/* Role Selection UI Element (The Sliding Segmented Bar) */}
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '30px', 
          padding: '4px', 
          marginBottom: '2rem', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}>
          {/* Active Slider background pill */}
          <div style={{
            position: 'absolute',
            top: '4px',
            bottom: '4px',
            left: selectedRole === 'admin' ? '4px' : selectedRole === 'teacher' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 0px)',
            width: 'calc(33.33% - 6px)',
            background: 'linear-gradient(to right, #06b6d4, #14b8a6)',
            borderRadius: '25px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)',
            zIndex: 1
          }} />

          {/* Tab Buttons */}
          {['admin', 'teacher', 'student'].map(role => {
            const isActive = selectedRole === role;
            return (
              <button 
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); }}
                style={{ 
                  flex: 1, 
                  padding: '0.65rem 0', 
                  border: 'none', 
                  background: 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500, 
                  fontSize: '0.8rem', 
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'color 0.2s ease',
                  textAlign: 'center'
                }}
              >
                {role}
              </button>
            );
          })}
        </div>

        {/* MIDDLE BLOCK - Authentication Forms */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Email Input Field Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="name@aarambh.edu"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="prof-input"
                style={{ 
                  paddingLeft: '2.8rem', 
                  borderRadius: '12px', 
                  background: 'rgba(15, 23, 42, 0.35)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white'
                }}
              />
            </div>
            {errors.email && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.1rem' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password Input Field Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="prof-input"
                style={{ 
                  paddingLeft: '2.8rem', 
                  borderRadius: '12px', 
                  background: 'rgba(15, 23, 42, 0.35)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white'
                }}
              />
            </div>
            {errors.password && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.1rem' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Sub-row Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            <span 
              onClick={() => {
                if (selectedRole === 'admin') {
                  setFormData({ email: 'admin@aarambh.edu', password: 'password123' });
                } else if (selectedRole === 'teacher') {
                  setFormData({ email: 'teacher@aarambh.edu', password: 'password123' });
                } else {
                  setFormData({ email: 'student@aarambh.edu', password: 'password123' });
                }
              }}
              style={{ color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f766e'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#0d9488'}
            >
              ⚡ Autofill {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Credentials
            </span>
            <span 
              onClick={() => {
                alert('Mock: Please contact administration to reset your password.');
              }}
              style={{ color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f766e'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#0d9488'}
            >
              Forgot Password?
            </span>
          </div>

          {errors.submit && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
              {errors.submit}
            </div>
          )}

          {/* BOTTOM BLOCK - Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              marginTop: '0.8rem', 
              padding: '0.85rem',
              background: 'linear-gradient(to right, #2563eb, #0d9488)',
              color: 'white', 
              border: 'none', 
              borderRadius: '12px',
              fontWeight: 700, 
              fontSize: '0.95rem', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.75 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 148, 136, 0.4)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.boxShadow = '0 4px 15px rgba(13, 148, 136, 0.25)';
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      {/* Fullscreen Transition Route Overlay */}
      {routeOverlayMsg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(7, 13, 25, 0.92)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          gap: '1.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Loader2 size={48} style={{ animation: 'spin 1.2s linear infinite', color: '#0d9488' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#cbd5e1', textAlign: 'center', padding: '0 2rem', maxWidth: '500px', lineHeight: '1.6' }}>
            {routeOverlayMsg}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
