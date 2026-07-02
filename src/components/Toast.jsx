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
          <div key={toast.id} className="prof-card" style={{
            padding: '0.8rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '280px',
            animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            borderLeft: `4px solid ${color}`,
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            boxShadow: `0 10px 30px rgba(0,0,0,0.15), var(--shadow-glass)`,
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            borderLeftWidth: '4px'
          }}>
            <Icon size={20} color={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
            <span style={{ fontSize: '0.9rem', fontFamily: 'Inter', color: 'var(--text-main)', fontWeight: 500 }}>{toast.text}</span>
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
