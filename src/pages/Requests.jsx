import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const Requests = () => {
  const { authHeaders, API_URL, approveRequest, rejectRequest, addToast } = useContext(AppContext);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/requests`, { headers: authHeaders });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load requests', 'danger');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    const success = await approveRequest(id);
    if (success) {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const handleReject = async (id) => {
    const success = await rejectRequest(id);
    if (success) {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Registration Requests</h1>
      </div>

      <div className="prof-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          <Clock size={20} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pending Approvals</h2>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '8px' }}>
            No pending registration requests at the moment.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Role</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Name/Username</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Contact/Class</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0.5rem', textTransform: 'capitalize' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500,
                        background: req.role === 'teacher' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: req.role === 'teacher' ? '#3b82f6' : '#10b981'
                      }}>
                        {req.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.name || req.username}</div>
                      {req.role === 'teacher' && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{req.username}</div>}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                      {req.role === 'student' ? (
                        <>
                          <div>Class: {req.className}</div>
                          <div style={{ fontSize: '0.85rem' }}>Phone: {req.parentPhone}</div>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleApprove(req.id)}
                          style={{ 
                            background: 'var(--success)', color: 'white', border: 'none', padding: '0.5rem', 
                            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' 
                          }}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          style={{ 
                            background: 'var(--danger)', color: 'white', border: 'none', padding: '0.5rem', 
                            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' 
                          }}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
