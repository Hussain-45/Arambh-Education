import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CheckCircle, XCircle, Clock, Search, Filter, Inbox } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Requests = () => {
  const { registrationRequests, approveRequest, rejectRequest, classes, addToast } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [teacherClasses, setTeacherClasses] = useState({});

  const handleApprove = async (id, role) => {
    if (role === 'teacher') {
      const assigned = teacherClasses[id] || [];
      await approveRequest(id, assigned);
    } else {
      await approveRequest(id);
    }
  };

  const handleReject = async (id) => {
    await rejectRequest(id);
  };

  const filteredRequests = registrationRequests.filter(req => {
    const matchesSearch = (req.name || req.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || req.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Registration Requests</h1>
        </div>

        <div className="prof-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Clock size={20} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Pending Approvals</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="prof-input"
                  style={{ paddingLeft: '2.2rem', paddingRight: '1rem', width: '200px' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--text-muted)" />
                <select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="prof-input"
                  style={{ width: '130px' }}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                </select>
              </div>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-main)' }}>No Requests Found</div>
              <div style={{ marginTop: '0.5rem' }}>There are no pending registrations matching your criteria.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Name/Username</th>
                    <th>Contact/Class Batch Details</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req.id}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>Assign Batches:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {classes.map(cls => (
                              <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                                <input 
                                  type="checkbox" 
                                  checked={teacherClasses[req.id]?.includes(cls.name) || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setTeacherClasses(prev => {
                                      const current = prev[req.id] || [];
                                      const updated = checked 
                                        ? [...current, cls.name]
                                        : current.filter(name => name !== cls.name);
                                      return { ...prev, [req.id]: updated };
                                    });
                                  }}
                                  style={{ transform: 'scale(1.1)' }}
                                />
                                {cls.name}
                              </label>
                            ))}
                          </div>
                          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Phone: {req.parentPhone || 'N/A'}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleApprove(req.id, req.role)}
                          style={{ 
                            background: 'var(--success)', color: 'white', border: 'none', padding: '0.5rem 1rem', 
                            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 
                          }}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          style={{ 
                            background: 'var(--danger)', color: 'white', border: 'none', padding: '0.5rem 1rem', 
                            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 
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
      </main>
    </>
  );
};

export default Requests;
