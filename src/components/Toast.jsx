import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContainer = () => {
  const { toasts } = useContext(AppContext);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
    }}>
      {toasts.map(toast => {
        let color = 'var(--neon-primary)';
        let Icon = Info;
        
        if (toast.type === 'success') {
          color = '#00ff88';
          Icon = CheckCircle;
        } else if (toast.type === 'error') {
          color = '#ff3366';
          Icon = AlertCircle;
        }

        return (
          <div key={toast.id} className="holo-card" style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '250px',
            animation: 'slideIn 0.3s ease forwards',
            borderLeft: `3px solid ${color}`,
            boxShadow: `0 5px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.05)`
          }}>
            <Icon size={20} color={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
            <span style={{ fontSize: '0.9rem', fontFamily: 'Inter' }}>{toast.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
