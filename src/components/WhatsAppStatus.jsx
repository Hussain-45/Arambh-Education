import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WhatsAppStatus = ({ dashboard = false }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('LOADING');
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status || 'DISCONNECTED');
        setQrCode(data.qr || null);
      } else {
        setStatus('OFFLINE');
        setQrCode(null);
      }
    } catch (e) {
      setStatus('OFFLINE');
      setQrCode(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/whatsapp/restart', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchStatus();
    } catch (e) {
      // Ignore
    }
    setLoading(false);
  };

  // 1. OFFLINE RENDERING MODE
  if (status === 'OFFLINE') {
    return (
      <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px dashed var(--border-color)' }}>
        <div className="flex-between">
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }} className="flex-center gap-1">
            <QrCode size={16} color="var(--text-muted)" /> WhatsApp Dispatches
          </span>
          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>Local Simulation</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          The backend WhatsApp integration server is offline. Dispatches will be simulated locally.
        </p>
        {dashboard && (
          <button 
            onClick={() => navigate('/settings')} 
            className="prof-btn prof-btn-outline" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: '100%', justifyContent: 'center', marginTop: '0.2rem' }}
          >
            Configure Settings <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </button>
        )}
      </div>
    );
  }

  // 2. DASHBOARD (COMPACT) RENDERING MODE
  if (dashboard) {
    return (
      <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="flex-between">
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }} className="flex-center gap-1">
            <QrCode size={16} color="var(--primary-text)" /> WhatsApp Robot Link
          </span>
          <span className={`badge badge-${status === 'CONNECTED' ? 'success' : 'warning'}`} style={{ fontSize: '0.75rem' }}>
            {status}
          </span>
        </div>

        {status === 'CONNECTED' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>
              <CheckCircle size={16} /> Robot Linked Successfully
            </div>
            <button 
              onClick={() => navigate('/settings')} 
              className="prof-btn prof-btn-secondary" 
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              Manage Settings <ArrowRight size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Scan QR code in settings to link a device and activate automated WhatsApp dispatches.
            </div>
            <button 
              onClick={() => navigate('/settings')} 
              className="prof-btn" 
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              Link Device & Show QR <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. FULL DISPLAY (SETTINGS/MESSAGES) RENDERING MODE
  return (
    <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="flex-between">
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }} className="flex-center gap-1">
          <QrCode size={16} color="var(--primary-text)" /> WhatsApp Robot Link
        </span>
        <span className={`badge badge-${status === 'CONNECTED' ? 'success' : 'warning'}`} style={{ fontSize: '0.75rem' }}>
          {status}
        </span>
      </div>

      {status === 'CONNECTED' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}>
          <CheckCircle size={20} />
          <div style={{ fontSize: '0.85rem' }}>
            <strong>Robot Linked Successfully!</strong>
            <div style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '2px' }}>Automatic dispatches, announcements, and reminders are fully active.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
          {qrCode ? (
            <div style={{ background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '150px', height: '150px', display: 'block' }} />
            </div>
          ) : (
            <div style={{ width: '150px', height: '150px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Scan this QR code using WhatsApp on your phone (Linked Devices &gt; Link a Device) to authorize instant dispatches.
          </div>

          <button 
            onClick={handleRestart} 
            disabled={loading}
            className="prof-btn prof-btn-secondary" 
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'Re-initializing...' : 'Reset Robot Client'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppStatus;
