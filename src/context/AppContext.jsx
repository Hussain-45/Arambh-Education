import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const user = localStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // App Data State
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [library, setLibrary] = useState([]);
  const [toasts, setToasts] = useState([]);

  useEffect(() => { document.body.className = `theme-${theme}`; localStorage.setItem('theme', theme); }, [theme]);
  
  useEffect(() => {
    fetchPublicData();
    if (authToken) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
      setIsAuthenticated(true);
      fetchAllData();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('loggedInUser');
      setIsAuthenticated(false);
    }
  }, [authToken, userRole, loggedInUser]);

  const fetchPublicData = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`);
      if (res.ok) setClasses(await res.json());
    } catch (e) {
      console.error('Error fetching public classes:', e);
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const fetchAllData = async () => {
    if (!authToken) return;
    try {
      const [clsRes, stuRes, tRes, feeRes, assnRes, libRes] = await Promise.all([
        fetch(`${API_URL}/classes`, { headers: authHeaders }),
        fetch(`${API_URL}/students`, { headers: authHeaders }),
        fetch(`${API_URL}/teachers`, { headers: authHeaders }),
        fetch(`${API_URL}/fees`, { headers: authHeaders }),
        fetch(`${API_URL}/assignments`, { headers: authHeaders }),
        fetch(`${API_URL}/library`, { headers: authHeaders })
      ]);

      if (clsRes.ok) setClasses(await clsRes.json());
      if (stuRes.ok) setStudents(await stuRes.json());
      if (tRes.ok) setTeachers(await tRes.json());
      if (feeRes.ok) setFees(await feeRes.json());
      if (assnRes.ok) setAssignments(await assnRes.json());
      if (libRes.ok) setLibrary(await libRes.json());
      
    } catch (err) {
      console.error('Error fetching data:', err);
      addToast('Error syncing data with server', 'danger');
    }
  };

  // Auth Actions
  const loginAdmin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'admin' })
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole('admin'); setLoggedInUser(data.user); setAuthToken(data.token);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const registerAdmin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register-admin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole('admin'); setLoggedInUser(data.user); setAuthToken(data.token);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const loginStudent = async (name, phone, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, phone, password, role: 'student' })
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole('student'); setLoggedInUser(data.user); setAuthToken(data.token);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const loginTeacher = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'teacher' })
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole('teacher'); setLoggedInUser(data.user); setAuthToken(data.token);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const logout = () => {
    setAuthToken(null); setUserRole(null); setLoggedInUser(null);
  };

  // App Actions
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  };

  const addStudent = async (name, className, parentPhone) => {
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ name, className, parentPhone })
      });
      if (res.ok) {
        const data = await res.json();
        setStudents([...students, data]);
        addToast(`${name} has been added successfully!`, 'success');
        fetchAllData(); // refresh fees
      }
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (recipient, type, content) => {
    const newMsg = { id: Date.now(), recipient, type, content, date: new Date().toLocaleString(), status: 'Sending...' };
    setMessages(prev => [newMsg, ...prev]);

    if (type === 'SMS' || type === 'Auto-WhatsApp') {
      try {
        const res = await fetch(`${API_URL}/sms`, {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ to: recipient, message: content, channel: type })
        });
        const data = await res.json();
        if (data.success) {
          setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'Delivered', previewUrl: data.previewUrl } : m));
          addToast(`Message delivered successfully!`, 'success');
        } else {
          setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'Failed' } : m));
          addToast(`Failed to deliver message: ${data.error}`, 'danger');
        }
      } catch (e) {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'Failed' } : m));
        addToast('Network error sending message', 'danger');
      }
    } else {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'Sent' } : m));
      addToast(`Message sent to ${recipient}`, 'success');
    }
  };

  const recordFeePayment = async (studentId, amount) => {
    try {
      const res = await fetch(`${API_URL}/fees/${studentId}/pay`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        const data = await res.json();
        setFees(prev => prev.map(f => {
          if (f.studentId === studentId) return { ...f, paid: data.paid, status: data.status };
          return f;
        }));
        const student = students.find(s => s.id === studentId);
        if (student) sendMessage(student.parentPhone, 'SMS', `Payment of Rs.${amount} received. Thank you!`);
      }
    } catch (e) { console.error(e); }
  };

  const requestRegistration = async (data) => {
    try {
      const res = await fetch(`${API_URL}/auth/request-register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        addToast(json.message, 'success');
        return true;
      }
      addToast('Failed to submit registration request', 'danger');
    } catch (e) { console.error(e); addToast('Network error', 'danger'); }
    return false;
  };

  const approveRequest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/requests/${id}/approve`, {
        method: 'POST', headers: authHeaders
      });
      if (res.ok) {
        addToast('Request approved successfully', 'success');
        fetchAllData();
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const rejectRequest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/requests/${id}/reject`, {
        method: 'DELETE', headers: authHeaders
      });
      if (res.ok) {
        addToast('Request rejected', 'info');
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const addAssignment = async (title, subject, dueDate, type, link, file) => {
    try {
      let body;
      let headers = { 'Authorization': `Bearer ${authToken}` }; // no Content-Type for FormData

      if (file) {
        body = new FormData();
        body.append('title', title);
        body.append('subject', subject);
        body.append('dueDate', dueDate);
        body.append('type', type);
        body.append('file', file);
      } else {
        body = JSON.stringify({ title, subject, dueDate, type, link: ensureHttp(link) });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(`${API_URL}/assignments`, { method: 'POST', headers, body });
      if (res.ok) {
        const data = await res.json();
        setAssignments([...assignments, data]);
        addToast('Assignment created!', 'success');
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const ensureHttp = (url) => {
    if (!url) return '';
    if (!url.match(/^https?:\/\//i)) return 'http://' + url;
    return url;
  };

  const addLibraryMaterial = async (title, subject, type, link, file) => {
    try {
      let body;
      let headers = { 'Authorization': `Bearer ${authToken}` };

      if (file) {
        body = new FormData();
        body.append('title', title);
        body.append('subject', subject);
        body.append('type', type);
        body.append('file', file);
      } else {
        body = JSON.stringify({ title, subject, type, link: ensureHttp(link) });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(`${API_URL}/library`, { method: 'POST', headers, body });
      if (res.ok) {
        const data = await res.json();
        setLibrary([...library, data]);
        addToast('Material added to library!', 'success');
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <AppContext.Provider value={{ 
      isAuthenticated, userRole, loggedInUser,
      loginAdmin, registerAdmin, loginStudent, loginTeacher, logout, requestRegistration, approveRequest, rejectRequest,
      theme, setTheme, 
      students, teachers, fees, messages, toasts, classes,
      assignments, submissions, calendarEvents, library,
      sendMessage, recordFeePayment, addToast, addStudent, authHeaders, API_URL,
      addAssignment, addLibraryMaterial
    }}>
      {children}
    </AppContext.Provider>
  );
};
