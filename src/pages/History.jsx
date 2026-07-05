import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Clock, UserPlus, CheckCircle, XCircle, IndianRupee, FileText, Trash2 } from 'lucide-react';

const History = () => {
  const { history, fetchHistory, deleteHistoryLog, clearAllHistoryLogs, userRole } = useContext(AppContext);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchHistory();
    }
  }, [userRole]);

  if (userRole !== 'admin') {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="prof-card">
            <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
            <p>You do not have permission to view the audit logs.</p>
          </div>
        </main>
      </>
    );
  }

  const getIcon = (action) => {
    switch(action) {
      case 'STUDENT_ADDED': return <UserPlus size={20} color="var(--primary-text)" />;
      case 'REQUEST_APPROVED': return <CheckCircle size={20} color="var(--success)" />;
      case 'REQUEST_REJECTED': return <XCircle size={20} color="var(--danger)" />;
      case 'FEE_PAID': return <IndianRupee size={20} color="var(--success)" />;
      default: return <FileText size={20} color="var(--text-muted)" />;
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>System Audit Logs</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchHistory} className="prof-btn prof-btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={16} /> Refresh Logs
            </button>
            {history.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all system history logs? This action is permanent.')) {
                    clearAllHistoryLogs();
                  }
                }} 
                className="prof-btn prof-btn-secondary" 
                style={{ padding: '0.5rem 1rem', color: '#ef4444', borderColor: '#ef4444', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={16} /> Clear Logs
              </button>
            )}
          </div>
        </div>

        <div className="prof-card" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Recent Activity</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((log) => (
              <div key={log.id} style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                padding: '1.2rem', 
                background: 'var(--bg-main)', 
                borderRadius: '12px',
                borderLeft: '4px solid var(--primary-text)',
                alignItems: 'center'
              }}>
                <div style={{ 
                  background: 'var(--bg-card)', 
                  padding: '12px', 
                  borderRadius: '50%', 
                  boxShadow: 'var(--shadow-neu)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(log.action)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{log.action.replace('_', ' ')}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this log entry?')) {
                            deleteHistoryLog(log.id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Delete Log"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>{log.details}</p>
                </div>
              </div>
            ))}
            
            {history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>No system activity recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default History;
