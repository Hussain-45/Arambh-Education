import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  UserPlus, 
  Clock, 
  Terminal, 
  UserMinus,
  Mail,
  User,
  KeyRound,
  Shield,
  X
} from 'lucide-react';

const Users = () => {
  const { 
    officers, 
    addOfficer, 
    deleteOfficer, 
    auditLogs, 
    fetchOfficers, 
    fetchLogs, 
    userRole, 
    addToast 
  } = useContext(AppContext);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [role, setRole] = useState('officer');
  
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'logs'

  useEffect(() => {
    fetchOfficers();
    fetchLogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !password || !email || !badgeNumber) {
      addToast('Please fill out all required fields.', 'danger');
      return;
    }

    const payload = {
      name,
      username,
      password,
      email,
      badge_number: badgeNumber,
      role,
      status: 'active'
    };

    const success = await addOfficer(payload);
    if (success) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setBadgeNumber('');
    setRole('officer');
  };

  const handleDelete = (id, uName) => {
    if (window.confirm(`Are you sure you want to delete Officer account: ${uName}?`)) {
      deleteOfficer(id);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex w-screen h-screen bg-slate-950 text-slate-100 items-center justify-center font-sans p-6 text-center">
        <div className="max-w-md p-6 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col items-center gap-3">
          <ShieldCheck size={40} className="text-rose-500" />
          <h2 className="text-md font-extrabold uppercase tracking-wider">Access Restricted</h2>
          <p className="text-xs text-slate-400">Only administrator accounts are permitted to access system officer registers and audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-6">
            <Header title="Identity & Audit Console" />
            
            {activeTab === 'directory' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
              >
                <Plus size={16} />
                Add Traffic Officer
              </button>
            )}
          </div>

          {/* Toggle Tab header */}
          <div className="flex border-b border-slate-900 mb-6 gap-6">
            <button 
              onClick={() => setActiveTab('directory')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'directory' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              Officers Register
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'logs' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              Console Audit Logs
            </button>
          </div>

          {/* Directory Tab */}
          {activeTab === 'directory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {officers.map(officer => {
                const isAdmin = officer.role === 'admin';
                return (
                  <div 
                    key={officer.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col justify-between text-left shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${
                          isAdmin ? 'text-purple-400' : 'text-sky-400'
                        }`}>
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-200">{officer.name}</h4>
                          <span className="text-[9px] font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">{officer.role}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold uppercase">Active</span>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-900 pt-3 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Badge Number:</span>
                        <span className="font-bold text-slate-300 uppercase">{officer.badge_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email address:</span>
                        <span className="font-bold text-slate-300">{officer.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Console username:</span>
                        <span className="font-bold text-slate-300">@{officer.username}</span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 border-t border-slate-900 pt-3">
                      {!isAdmin && (
                        <button 
                          onClick={() => handleDelete(officer.id, officer.username)}
                          className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/20 bg-slate-950 text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 font-bold text-[10px]"
                        >
                          <UserMinus size={12} />
                          Remove Account
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'logs' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur-md overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Action Timestamp</th>
                      <th className="px-6 py-4">Officer User</th>
                      <th className="px-6 py-4">Console Action Log</th>
                      <th className="px-6 py-4">System IP Node</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-semibold text-slate-300">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-3.5 flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-500" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-200">
                          {log.user_name || 'System'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-300">
                          <code className="text-slate-400 font-mono flex items-center gap-1">
                            <Terminal size={10} className="text-sky-400 shrink-0" />
                            {log.action}
                          </code>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <UserPlus size={18} className="text-sky-400" />
              Register System Officer
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Officer Full Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Inspector Gurpreet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Console Username *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. gurpreet"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Badge Identifier *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. PB-03-882"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Access Password *</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Gov Email address *</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    placeholder="officer@smartcity.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Role Designation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setRole('officer')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      role === 'officer' 
                        ? 'border-sky-400 bg-sky-500/10 text-sky-400' 
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    Traffic Officer
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      role === 'admin' 
                        ? 'border-sky-400 bg-sky-500/10 text-sky-400' 
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold transition-colors shadow-lg shadow-sky-500/20"
                >
                  Submit Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
