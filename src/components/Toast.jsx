import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bell, IndianRupee, Clipboard, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContainer = () => {
  const { toasts } = useContext(AppContext);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        let color = '#3b82f6'; // Info default
        let Icon = Info;
        
        if (toast.type === 'announcement') {
          color = '#6366f1'; // Indigo
          Icon = Bell;
        } else if (toast.type === 'fee') {
          color = '#10b981'; // Emerald
          Icon = IndianRupee;
        } else if (toast.type === 'assignment') {
          color = '#a855f7'; // Purple
          Icon = Clipboard;
        } else if (toast.type === 'success') {
          color = '#10b981'; // Emerald Check
          Icon = CheckCircle;
        } else if (toast.type === 'error') {
          color = '#ef4444'; // Red Alert
          Icon = AlertCircle;
        }

        return (
          <div key={toast.id} className="prof-card" style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minWidth: '320px',
            maxWidth: '400px',
            animation: 'toastSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            borderLeft: `4px solid ${color}`,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            webkitBackdropFilter: 'blur(20px)',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-glass), 0 10px 30px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            borderLeftWidth: '4px',
            pointerEvents: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `${color}15`,
              color: color,
              flexShrink: 0
            }}>
              <Icon size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              {toast.title && (
                <strong style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{toast.title}</strong>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>{toast.text}</span>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
