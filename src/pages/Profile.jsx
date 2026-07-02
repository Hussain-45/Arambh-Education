import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  User, 
  Mail, 
  ShieldAlert, 
  Clock, 
  Terminal, 
  Edit3, 
  Save, 
  ShieldCheck 
} from 'lucide-react';

const Profile = () => {
  const { loggedInUser, auditLogs, fetchLogs, addToast } = useContext(AppContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchLogs();
    if (loggedInUser) {
      setName(loggedInUser.name || '');
      setEmail(loggedInUser.email || `${loggedInUser.username}@smartcity.gov.in`);
    }
  }, [loggedInUser]);

  const handleSave = (e) => {
    e.preventDefault();
    setIsEdit(false);
    addToast('Profile updates saved successfully (simulated).', 'success');
  };

  // Filter logs only performed by current user
  const myLogs = auditLogs.filter(log => log.user_name === loggedInUser?.name);

  return (
    <div className="flex w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 max-w-7xl w-full mx-auto text-left">
          <Header title="Officer Profile Credentials" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left side: Credentials Card */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-md flex flex-col gap-4 shadow-lg">
              <div className="flex flex-col items-center border-b border-slate-900 pb-5">
                <div className="w-20 h-20 rounded-full bg-sky-500/10 text-sky-400 border-2 border-sky-500/20 flex items-center justify-center text-3xl font-black mb-3">
                  {loggedInUser?.name ? loggedInUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h3 className="text-base font-extrabold text-slate-200">{loggedInUser?.name}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 mt-1.5">{loggedInUser?.role}</span>
              </div>

              {!isEdit ? (
                <div className="flex flex-col gap-3 text-xs font-semibold">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Console Username:</span>
                    <span className="text-slate-200">@{loggedInUser?.username}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Gov Email:</span>
                    <span className="text-slate-200">{email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Badge identifier:</span>
                    <span className="text-slate-200 uppercase">PB-03-934</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Security Clearance:</span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <ShieldCheck size={12} />
                      Level 3 Verified
                    </span>
                  </div>

                  <button 
                    onClick={() => setIsEdit(true)}
                    className="mt-4 w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-350 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    Modify Details
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs font-semibold">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Officer Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-250 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Gov Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-250 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEdit(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right side: Logged in user activity history log */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-md flex flex-col gap-4 shadow-lg min-h-[400px]">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-slate-900 pb-2 flex items-center gap-1.5">
                <Clock size={16} className="text-sky-400" />
                Personal Console Activity Log
              </h4>

              <div className="flex-1 overflow-y-auto max-h-[360px] flex flex-col gap-2.5">
                {myLogs.length === 0 ? (
                  <div className="text-xs text-slate-500 py-10 text-center flex items-center justify-center gap-1">
                    <Terminal size={12} />
                    No recent activity logs recorded for this account
                  </div>
                ) : (
                  myLogs.map(log => (
                    <div 
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-900 bg-slate-950/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-sky-400 shrink-0" />
                        <span className="font-semibold text-slate-300">{log.action}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
