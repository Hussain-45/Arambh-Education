import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const user = localStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Serverless LocalStorage DB State
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [library, setLibrary] = useState([]);
  const [history, setHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [doubtTickets, setDoubtTickets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [syllabus, setSyllabus] = useState([]);

  // Initialize DB on first load
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync authentication states to localStorage
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('loggedInUser');
      setIsAuthenticated(false);
    }
  }, [authToken, userRole, loggedInUser]);

  // Enforce empty mock database on clean launch (forced wipe migration for existing browsers)
  useEffect(() => {
    const cleared = localStorage.getItem('aarambh_db_cleared_v2');
    if (!cleared) {
      localStorage.setItem('aarambh_users', JSON.stringify([]));
      localStorage.setItem('aarambh_classes', JSON.stringify([]));
      localStorage.setItem('aarambh_students', JSON.stringify([]));
      localStorage.setItem('aarambh_teachers', JSON.stringify([]));
      localStorage.setItem('aarambh_fees', JSON.stringify([]));
      localStorage.setItem('aarambh_library', JSON.stringify([]));
      localStorage.setItem('aarambh_assignments', JSON.stringify([]));
      localStorage.setItem('aarambh_announcements', JSON.stringify([]));
      localStorage.setItem('aarambh_requests', JSON.stringify([]));
      localStorage.setItem('aarambh_history', JSON.stringify([]));
      localStorage.setItem('aarambh_messages', JSON.stringify([]));
      localStorage.setItem('aarambh_expenses', JSON.stringify([]));
      localStorage.setItem('aarambh_attendance', JSON.stringify([]));
      localStorage.setItem('aarambh_db_initialized', 'true');
      localStorage.setItem('aarambh_db_cleared_v2', 'true');
      
      // Force reload to apply clean state
      window.location.reload();
    }
  }, []);

  const fetchDataFromServer = async () => {
    if (!authToken) return;
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      // Load classes
      const clsRes = await fetch('http://localhost:5000/api/classes');
      if (clsRes.ok) {
        const clsData = await clsRes.json();
        setClasses(clsData);
      }

      // Load teachers
      const tRes = await fetch('http://localhost:5000/api/teachers', { headers });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTeachers(tData);
      }

      // Load students
      const sRes = await fetch('http://localhost:5000/api/students', { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData);
      }
      
      // Load fees
      const fRes = await fetch('http://localhost:5000/api/fees', { headers });
      if (fRes.ok) {
        const fData = await fRes.json();
        setFees(fData);
      }

      // Load expenses
      const expRes = await fetch('http://localhost:5000/api/expenses', { headers });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData);
      }

      // Load assignments
      const assnRes = await fetch('http://localhost:5000/api/assignments', { headers });
      if (assnRes.ok) {
        const assnData = await assnRes.json();
        setAssignments(assnData);
      }

      // Load library materials
      const libRes = await fetch('http://localhost:5000/api/library', { headers });
      if (libRes.ok) {
        const libData = await libRes.json();
        setLibrary(libData);
      }

      // Load announcements
      const annRes = await fetch('http://localhost:5000/api/announcements', { headers });
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData);
      }

      // Load registration requests
      const reqRes = await fetch('http://localhost:5000/api/admin/requests', { headers });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRegistrationRequests(reqData);
      }

      // Load audit logs history
      const histRes = await fetch('http://localhost:5000/api/admin/history', { headers });
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
      }

      // Load attendance logs
      const attRes = await fetch('http://localhost:5000/api/attendance', { headers });
      if (attRes.ok) {
        const attData = await attRes.json();
        const mappedData = attData.map(a => ({
          ...a,
          studentId: a.student_id || a.studentId,
          student_id: a.student_id || a.studentId
        }));
        setAttendance(mappedData);
      }

      // Load submissions
      const subRes = await fetch('http://localhost:5000/api/submissions', { headers });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData);
      }

      // Load calendar events
      const evRes = await fetch('http://localhost:5000/api/events', { headers });
      if (evRes.ok) {
        const evData = await evRes.json();
        setCalendarEvents(evData);
      }

      // Load doubt tickets
      const doubtsRes = await fetch('http://localhost:5000/api/doubts', { headers });
      if (doubtsRes.ok) {
        const doubtsData = await doubtsRes.json();
        setDoubtTickets(doubtsData);
      }

      // Load quizzes
      const quizRes = await fetch('http://localhost:5000/api/quizzes', { headers });
      if (quizRes.ok) {
        const quizData = await quizRes.json();
        setQuizzes(quizData);
      }

      // Load quiz attempts
      const attemptRes = await fetch('http://localhost:5000/api/quizzes-attempts', { headers });
      if (attemptRes.ok) {
        const attemptData = await attemptRes.json();
        setQuizAttempts(attemptData);
      }

      // Load syllabus tracker
      const sylRes = await fetch('http://localhost:5000/api/syllabus', { headers });
      if (sylRes.ok) {
        const sylData = await sylRes.json();
        setSyllabus(sylData);
      }
    } catch (err) {
      console.error('Error fetching data from server', err);
    }
  };

  // Sync state from server when authenticated, otherwise read fallback from localStorage
  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchDataFromServer();
    } else {
      setClasses(JSON.parse(localStorage.getItem('aarambh_classes') || '[]'));
      setStudents(JSON.parse(localStorage.getItem('aarambh_students') || '[]'));
      setTeachers(JSON.parse(localStorage.getItem('aarambh_teachers') || '[]'));
      setFees(JSON.parse(localStorage.getItem('aarambh_fees') || '[]'));
      setLibrary(JSON.parse(localStorage.getItem('aarambh_library') || '[]'));
      setAssignments(JSON.parse(localStorage.getItem('aarambh_assignments') || '[]'));
      setAnnouncements(JSON.parse(localStorage.getItem('aarambh_announcements') || '[]'));
      setRegistrationRequests(JSON.parse(localStorage.getItem('aarambh_requests') || '[]'));
      setHistory(JSON.parse(localStorage.getItem('aarambh_history') || '[]'));
      setExpenses(JSON.parse(localStorage.getItem('aarambh_expenses') || '[]'));
      setAttendance(JSON.parse(localStorage.getItem('aarambh_attendance') || '[]'));
      setCalendarEvents(JSON.parse(localStorage.getItem('aarambh_calendar') || '[]'));
    }
    setMessages(JSON.parse(localStorage.getItem('aarambh_messages') || '[]'));
    setDoubtTickets(JSON.parse(localStorage.getItem('aarambh_doubt_tickets') || '[]'));
    setSubmissions(JSON.parse(localStorage.getItem('aarambh_submissions') || '[]'));
    setPendingUploads(JSON.parse(localStorage.getItem('aarambh_pending_uploads') || '[]'));
    setNotifications(JSON.parse(localStorage.getItem('aarambh_notifications') || '[]'));
  }, [isAuthenticated, authToken]);

  // UI Toast Logger
  const addToast = (text, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Log activity helper
  const logActivity = (action, details) => {
    const newLog = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toLocaleString()
    };
    const updatedHistory = [newLog, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('aarambh_history', JSON.stringify(updatedHistory));
  };

  // Auth Operations
  const loginAdmin = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'admin' })
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setUserRole(data.user.role);
        setLoggedInUser(data.user);
        addToast('Welcome back, Admin!');
        return { success: true };
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Invalid credentials', 'danger');
        return { success: false, error: errData.error || 'Invalid credentials' };
      }
    } catch (e) {
      addToast('Connection to authentication server failed', 'danger');
      return { success: false, error: 'Connection to authentication server failed' };
    }
  };

  const registerAdmin = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setUserRole(data.user.role);
        setLoggedInUser(data.user);
        addToast('Admin registered and logged in successfully!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Registration failed', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Connection to server failed', 'danger');
      return false;
    }
  };

  const loginStudent = async (username, param2, param3) => {
    const actualPassword = param3 !== undefined ? param3 : param2;
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: actualPassword, role: 'student' })
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setUserRole(data.user.role);
        setLoggedInUser(data.user);
        addToast('Logged in successfully!');
        return { success: true };
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Invalid credentials', 'danger');
        return { success: false, error: errData.error || 'Invalid credentials' };
      }
    } catch (e) {
      addToast('Connection to authentication server failed', 'danger');
      return { success: false, error: 'Connection to authentication server failed' };
    }
  };

  const loginTeacher = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'teacher' })
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setUserRole(data.user.role);
        setLoggedInUser(data.user);
        addToast('Logged in successfully!');
        return { success: true };
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Invalid credentials', 'danger');
        return { success: false, error: errData.error || 'Invalid credentials' };
      }
    } catch (e) {
      addToast('Connection to authentication server failed', 'danger');
      return { success: false, error: 'Connection to authentication server failed' };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUserRole(null);
    setLoggedInUser(null);
    setIsAuthenticated(false);
    addToast('Logged out successfully.');
  };

  // Student/Teacher Registrations Request (Now properly routes to Pending Approvals list)
  const requestRegistration = async (reqData) => {
    const cleanUsername = (reqData.username || reqData.name || '').trim().toLowerCase();
    
    // Check if username already exists in approved users database
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    if (users.some(u => (u.username || '').trim().toLowerCase() === cleanUsername)) {
      addToast('Username/Name already exists in system.', 'danger');
      return false;
    }

    // Check if username already exists in pending requests database
    const requests = JSON.parse(localStorage.getItem('aarambh_requests') || '[]');
    if (requests.some(r => (r.username || r.name || '').trim().toLowerCase() === cleanUsername)) {
      addToast('A pending registration request already exists for this account.', 'danger');
      return false;
    }

    // Generate unique ID and sequential admission number
    const id = Date.now();
    let sequentialAdmissionNumber = null;
    if (reqData.role === 'student') {
      const currentStudentsList = JSON.parse(localStorage.getItem('aarambh_students') || '[]');
      let maxNum = 0;
      currentStudentsList.forEach(s => {
        const match = (s.admission_number || '').match(/AES(\d+)/i);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      sequentialAdmissionNumber = `AES${nextNum}`;
    }

    // Create pending request object
    const newRequest = {
      id,
      name: reqData.name,
      username: reqData.username || cleanUsername,
      password: reqData.password,
      role: reqData.role,
      email: reqData.email || (reqData.role === 'teacher' ? `${cleanUsername}@aarambh.edu` : null),
      className: reqData.className,
      fatherName: reqData.fatherName,
      admission_number: reqData.admissionNumber || sequentialAdmissionNumber,
      parentPhone: reqData.phone,
      birthdate: reqData.birthdate || null,
      status: 'pending',
      date: new Date().toLocaleDateString()
    };

    const updatedRequests = [...requests, newRequest];
    localStorage.setItem('aarambh_requests', JSON.stringify(updatedRequests));
    setRegistrationRequests(updatedRequests);

    addToast('Registration request submitted! Please wait for admin approval.', 'success');
    return true;
  };

  const approveRequest = async (id, assignedClasses = []) => {
    if (authToken) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/requests/${id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ assignedClasses })
        });
        if (response.ok) {
          addToast('Registration request approved successfully!', 'success');
          await fetchDataFromServer();
          return true;
        } else {
          const errData = await response.json();
          addToast(errData.error || 'Failed to approve request', 'danger');
          return false;
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to connect to server', 'danger');
        return false;
      }
    }

    const requests = JSON.parse(localStorage.getItem('aarambh_requests') || '[]');
    const req = requests.find(r => r.id === id);
    if (!req) return false;

    if (req.role === 'teacher') {
      const defaultAssigned = assignedClasses.length > 0 ? assignedClasses : ['10th Math', '10th Science'];
      // 1. Add to teachers list
      const currentTeachersList = JSON.parse(localStorage.getItem('aarambh_teachers') || '[]');
      const newTeacher = {
        id: req.id,
        name: req.name,
        email: req.email || `${req.username || req.name.toLowerCase().replace(/\s+/g, '')}@aarambh.edu`,
        username: req.username || req.name.toLowerCase().replace(/\s+/g, '')
      };
      newTeacher.assignedClasses = defaultAssigned;
      const updatedTeachers = [...teachers, newTeacher];
      setTeachers(updatedTeachers);
      localStorage.setItem('aarambh_teachers', JSON.stringify(updatedTeachers));

      // 2. Add to users list for login access
      const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
      const newUser = {
        id: req.id,
        name: req.name,
        username: newTeacher.username,
        password: req.password,
        role: 'teacher',
        email: newTeacher.email,
        assignedClasses: defaultAssigned
      };
      localStorage.setItem('aarambh_users', JSON.stringify([...users, newUser]));

      // 3. Remove from requests
      const updatedRequests = requests.filter(r => r.id !== id);
      setRegistrationRequests(updatedRequests);
      localStorage.setItem('aarambh_requests', JSON.stringify(updatedRequests));

      logActivity('Approve Teacher', `Approved staff request for ${req.name} with batches: ${defaultAssigned.join(', ')}`);
      addToast(`${req.name} registration approved!`);
      return true;
    }

    // Generate sequential admission number for approved student
    const currentStudentsList = JSON.parse(localStorage.getItem('aarambh_students') || '[]');
    let maxNum = 0;
    currentStudentsList.forEach(s => {
      const match = (s.admission_number || '').match(/AES(\d+)/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const sequentialAdmissionNumber = `AES${nextNum}`;

    const newStudent = {
      id: req.id,
      name: req.name,
      class: req.className,
      parentPhone: req.parentPhone,
      fatherName: req.fatherName,
      username: req.username || req.name.toLowerCase().replace(/\s+/g, ''),
      admission_number: req.admission_number || sequentialAdmissionNumber,
      email: req.email,
      birthdate: req.birthdate
    };
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('aarambh_students', JSON.stringify(updatedStudents));

    // 2. Add to users list for login access
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const newUser = {
      id: req.id,
      name: req.name,
      username: newStudent.username,
      password: req.password,
      role: 'student',
      parentPhone: req.parentPhone,
      className: req.className,
      admission_number: newStudent.admission_number,
      fatherName: req.fatherName,
      email: req.email,
      birthdate: req.birthdate
    };
    localStorage.setItem('aarambh_users', JSON.stringify([...users, newUser]));

    // 3. Initialize 12 Months Fees
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const newFees = months.map((month, idx) => ({
      id: Date.now() + idx,
      studentId: req.id,
      month,
      total: req.fees || 1000,
      paid: 0,
      status: 'Pending',
      dueDate: `10/${(idx + 1).toString().padStart(2, '0')}/2026`,
      paymentMode: null,
      paymentDate: null
    }));
    const updatedFees = [...fees, ...newFees];
    setFees(updatedFees);
    localStorage.setItem('aarambh_fees', JSON.stringify(updatedFees));

    // 4. Remove from requests
    const updatedRequests = requests.filter(r => r.id !== id);
    setRegistrationRequests(updatedRequests);
    localStorage.setItem('aarambh_requests', JSON.stringify(updatedRequests));

    logActivity('Approve Student', `Approved admission request for ${req.name} (Batch: ${req.className})`);
    addToast(`${req.name} registration approved!`);
    return true;
  };

  const rejectRequest = async (id) => {
    if (authToken) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/requests/${id}/reject`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          addToast('Registration request rejected successfully!', 'success');
          await fetchDataFromServer();
          return true;
        } else {
          const errData = await response.json();
          addToast(errData.error || 'Failed to reject request', 'danger');
          return false;
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to connect to server', 'danger');
        return false;
      }
    }

    const requests = JSON.parse(localStorage.getItem('aarambh_requests') || '[]');
    const req = requests.find(r => r.id === id);
    if (!req) return false;

    const updatedRequests = requests.filter(r => r.id !== id);
    setRegistrationRequests(updatedRequests);
    localStorage.setItem('aarambh_requests', JSON.stringify(updatedRequests));

    logActivity('Reject Student Request', `Rejected admission request for ${req.name}`);
    addToast(`Registration request rejected.`);
    return true;
  };

  // Messaging (Simulated Logs & WhatsApp Dispatch Logs)
  const sendMessage = async (to, channel, content) => {
    let status = 'Delivered';
    let previewUrl = null;
    let simulated = true;

    try {
      const response = await fetch('http://localhost:5000/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message: content, channel })
      });
      if (response.ok) {
        const data = await response.json();
        status = data.success ? 'Delivered' : 'Failed';
        previewUrl = data.previewUrl || null;
        simulated = data.simulated ?? false;
      } else {
        status = 'Delivered';
      }
    } catch (e) {
      status = 'Delivered';
    }

    const newMsg = {
      id: Date.now(),
      recipient: to,
      channel,
      content,
      date: new Date().toLocaleString(),
      status,
      previewUrl
    };
    const updatedMessages = [newMsg, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem('aarambh_messages', JSON.stringify(updatedMessages));
    
    // Log message dispatch in audit log
    logActivity('Send Message', `Dispatched notification to ${to} via ${channel} (${simulated ? 'Simulated' : 'Real Delivery'})`);
    addToast(status === 'Failed' ? `Failed to dispatch message via ${channel}` : `Message dispatched via ${channel}!`, status === 'Failed' ? 'danger' : 'success');
    return true;
  };

  // Record fee payments
  const recordFeePayment = async (studentId, amount, paymentMode, paymentDate, month) => {
    try {
      const response = await fetch(`http://localhost:5000/api/fees/${studentId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ amount, paymentMode, paymentDate, month })
      });
      if (response.ok) {
        // Reload all data to get updated fees and logs
        const resData = await response.json();
        setFees(prev => prev.map(f => (f.studentId === studentId && f.month === month) ? {
          ...f,
          paid: f.paid + amount,
          status: f.paid + amount >= f.total ? 'Paid' : 'Pending',
          paymentMode,
          paymentDate: paymentDate || new Date().toLocaleDateString()
        } : f));
        
        const student = students.find(s => s.id === studentId);
        logActivity('Fee Payment', `Recorded ₹${amount} fee payment for ${student?.name || 'Student'} for the month of ${month}`);
        addToast('Payment recorded successfully!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to record payment', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Submit UPI payment transaction ID
  const submitUpiPayment = async (feeId, upiTransactionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/fees/${feeId}/submit-upi`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ upiTransactionId })
      });
      if (response.ok) {
        setFees(prev => prev.map(f => f.id === feeId ? {
          ...f,
          paymentMode: 'UPI',
          upiTransactionId,
          upiPaymentStatus: 'pending_verification',
          status: 'Pending Verification'
        } : f));
        logActivity('UPI Submitted', `Submitted UPI Transaction ID ${upiTransactionId} for verification`);
        addToast('UPI Transaction ID submitted successfully!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to submit transaction ID', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Verify UPI Payment (Admin only)
  const verifyUpiPayment = async (feeId, status, notes) => {
    try {
      const response = await fetch(`http://localhost:5000/api/fees/${feeId}/verify-upi`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status, notes })
      });
      if (response.ok) {
        await fetchDataFromServer();
        addToast(status === 'verified' ? 'UPI Payment verified successfully!' : 'UPI Payment rejected successfully.');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to verify payment', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Create a new Quiz (Admin/Teacher only)
  const createQuiz = async (quizData) => {
    try {
      const response = await fetch('http://localhost:5000/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(quizData)
      });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(prev => [{
          id: data.quizId,
          title: quizData.title,
          class_name: quizData.className,
          subject: quizData.subject,
          duration_minutes: quizData.durationMinutes || 30
        }, ...prev]);
        addToast(`Quiz "${quizData.title}" created successfully!`);
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to create quiz', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Submit answers for a Quiz
  const submitQuizAnswers = async (quizId, answers) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ answers })
      });
      if (response.ok) {
        const data = await response.json();
        addToast(`Quiz submitted! You scored ${data.score}/${data.totalQuestions}`);
        
        const attemptRes = await fetch('http://localhost:5000/api/quizzes-attempts', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (attemptRes.ok) {
          const attemptData = await attemptRes.json();
          setQuizAttempts(attemptData);
        }
        return data;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to submit quiz', 'danger');
        return null;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return null;
    }
  };

  // Delete a Quiz
  const deleteQuiz = async (quizId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
        setQuizAttempts(prev => prev.filter(qa => qa.quizId !== quizId));
        addToast('Quiz deleted successfully.');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to delete quiz', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Add a new Syllabus Topic (Admin/Teacher only)
  const addSyllabusTopic = async (className, subject, topicName) => {
    try {
      const response = await fetch('http://localhost:5000/api/syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ className, subject, topicName })
      });
      if (response.ok) {
        const data = await response.json();
        setSyllabus(prev => [{
          id: data.id,
          class_name: className,
          subject,
          topic_name: topicName,
          status: 'Not Started',
          updated_at: new Date().toISOString()
        }, ...prev]);
        addToast(`Topic "${topicName}" added to syllabus tracker!`);
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to add topic', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Update Syllabus Topic Status (Admin/Teacher only)
  const updateSyllabusTopicStatus = async (topicId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/syllabus/${topicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setSyllabus(prev => prev.map(item => 
          item.id === topicId 
            ? { ...item, status, updated_at: new Date().toISOString() } 
            : item
        ));
        addToast(`Syllabus topic status updated to: ${status}`);
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to update topic status', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Delete Syllabus Topic (Admin/Teacher only)
  const deleteSyllabusTopic = async (topicId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/syllabus/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setSyllabus(prev => prev.filter(item => item.id !== topicId));
        addToast('Syllabus topic deleted successfully.');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to delete syllabus topic', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const sendFeeReminders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fees/remind-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        logActivity('Fee Reminders', `Triggered bulk reminders. Sent: ${data.sentCount}, Failed: ${data.failedCount} (${data.simulated ? 'Simulated' : 'Real WhatsApp'})`);
        addToast(`Sent ${data.sentCount} pending fee reminders via WhatsApp!`, 'success');
        return data;
      }
    } catch (e) {
      // Offline local simulation
    }

    // Local simulation fallback
    const pendingFees = fees.filter(f => f.status !== 'Paid');
    let sentCount = 0;
    for (const fee of pendingFees) {
      const student = students.find(s => s.id === fee.studentId);
      const phone = student?.parentPhone || fee.parentPhone;
      if (!phone) continue;

      const dueAmount = fee.total - fee.paid;
      const message = `Dear Parent, this is a reminder from Aarambh that the tuition fee of Rs. ${dueAmount} for ${student?.name || fee.name || 'your child'} for the month of ${fee.month || 'Current'} is currently pending. Please clear the dues at your earliest convenience. Thank you!`;
      
      await sendMessage(phone, 'Auto-WhatsApp', message);
      sentCount++;
    }

    logActivity('Fee Reminders', `Triggered bulk reminders (Local Simulation). Sent: ${sentCount}`);
    addToast(`Sent ${sentCount} pending fee reminders (Simulated)!`, 'success');
    return { success: true, sentCount, simulated: true };
  };

  const markAttendance = async (studentId, date, status) => {
    try {
      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ studentId, date, status })
      });
      if (response.ok) {
        const student = students.find(s => s.id === studentId);
        logActivity('Mark Attendance', `Marked ${student?.name || 'Student'} as ${status} for ${date}`);
      }
    } catch(e) {
      // Offline fallback
    }

    // Local state sync
    const newRecord = { id: Date.now(), student_id: studentId, studentId, date, status };
    const updated = [newRecord, ...attendance.filter(a => !((a.student_id === studentId || a.studentId === studentId) && a.date === date))];
    setAttendance(updated);
    localStorage.setItem('aarambh_attendance', JSON.stringify(updated));
    
    addToast(`Marked ${students.find(s => s.id === studentId)?.name || 'Student'} as ${status}`);
    return true;
  };

  const triggerMarkAttendance = async (studentId, date, status, force = false) => {
    if (!force) {
      const existing = attendance.find(a => (a.student_id === studentId || a.studentId === studentId) && a.date === date);
      if (existing) {
        if (existing.status === status) return false;
        const student = students.find(s => s.id === studentId);
        const confirmEdit = window.confirm(`Attendance has already been marked as "${existing.status}" for ${student?.name || 'Student'} on ${date}. Do you want to change it to "${status}"?`);
        if (!confirmEdit) return false;
      }
    }
    await markAttendance(studentId, date, status);
    return true;
  };

  const sendMonthlyAttendanceReport = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/attendance-report`, {
        method: 'POST',
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success !== false) {
          addToast(`Sent ${data.sentCount} monthly attendance reports successfully!`, 'success');
        } else {
          addToast(data.error || 'Failed to send attendance reports.', 'warning');
        }
        return data;
      } else {
        const data = await response.json();
        addToast(data.error || 'Failed to send attendance reports.', 'danger');
      }
    } catch (e) {
      // Offline local simulation
      addToast('Simulating monthly attendance progress reports delivery...', 'info');
      let sent = 0;
      students.forEach(student => {
        if (student.email) {
          sendMessage(student.email, 'Email', `Hi Parent, this is the monthly attendance report for ${student.name}. Rate: 95%`);
          sent++;
        }
      });
      addToast(`Sent ${sent} simulated monthly reports!`, 'success');
      return { success: true, sentCount: sent, simulated: true };
    }
  };

  // Student Roster Management
  const addStudent = async (param1, param2, param3, param4, param5, param6, param7, param8) => {
    let studentData = {};
    if (typeof param1 === 'object' && param1 !== null) {
      studentData = param1;
    } else {
      studentData = {
        name: param1,
        class: param2,
        parentPhone: param3,
        fatherName: param4,
        email: param5,
        birthdate: param6,
        password: param7,
        photo: param8
      };
    }

    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: studentData.name,
          className: studentData.class || studentData.className,
          parentPhone: studentData.parentPhone,
          fatherName: studentData.fatherName,
          email: studentData.email,
          birthdate: studentData.birthdate,
          phone: studentData.phone,
          motherName: studentData.motherName,
          gender: studentData.gender,
          bloodGroup: studentData.bloodGroup,
          address: studentData.address,
          discountPercent: studentData.discountPercent,
          registrationDate: studentData.registrationDate,
          password: studentData.password,
          photo: studentData.photo
        })
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(prev => [...prev, data]);
        fetchDataFromServer(); // Refresh fees
        logActivity('Add Student', `Manually added student ${data.name} (${data.admission_number})`);
        addToast('Student added successfully!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to add student', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const removeStudent = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setFees(prev => prev.filter(f => f.studentId !== studentId));
        logActivity('Remove Student', `Removed student ID: ${studentId} from systems`);
        addToast('Student removed successfully.');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to remove student', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const editStudent = async (studentId, param1, param2, param3, param4, param5, param6, param7, param8) => {
    let studentData = {};
    if (typeof param1 === 'object' && param1 !== null) {
      studentData = param1;
    } else {
      studentData = {
        name: param1,
        class: param2,
        parentPhone: param3,
        fatherName: param4,
        email: param5,
        birthdate: param6,
        password: param7,
        photo: param8
      };
    }

    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: studentData.name,
          className: studentData.class || studentData.className,
          parentPhone: studentData.parentPhone,
          fatherName: studentData.fatherName,
          email: studentData.email,
          birthdate: studentData.birthdate,
          phone: studentData.phone,
          motherName: studentData.motherName,
          gender: studentData.gender,
          bloodGroup: studentData.bloodGroup,
          address: studentData.address,
          discountPercent: studentData.discountPercent,
          registrationDate: studentData.registrationDate,
          password: studentData.password,
          photo: studentData.photo
        })
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...data } : s));
        fetchDataFromServer(); // Refresh fees
        logActivity('Edit Student', `Updated student details for ${data.name}`);
        addToast('Student details updated successfully.', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to update student', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const removeTeacher = async (teacherId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        logActivity('Remove Teacher', `Removed teacher ID: ${teacherId} from systems`);
        addToast('Teacher removed successfully.');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to remove teacher', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const addTeacher = async (name, email, phone, salary, specialization, assignedClasses, password, photo) => {
    try {
      const response = await fetch('http://localhost:5000/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, email, phone, salary, specialization, assignedClasses, password, photo })
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(prev => [...prev, data]);
        logActivity('Add Teacher', `Added teacher: ${name}`);
        addToast(`Teacher ${name} added successfully!`, 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to add teacher', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const editTeacher = async (teacherId, name, email, phone, salary, specialization, assignedClasses, password, photo) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, email, phone, salary, specialization, assignedClasses, password, photo })
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, ...data } : t));
        logActivity('Edit Teacher', `Updated teacher details for ${name}`);
        addToast('Teacher details updated successfully.', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to update teacher', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };


  // Class Batches Management
  const removeBatch = async (batchId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setClasses(prev => prev.filter(c => c.id !== batchId));
        logActivity('Remove Batch', `Removed batch ID: ${batchId}`);
        addToast('Batch removed successfully.');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to remove batch', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const addBatch = async (name, grade, time, monthlyFee) => {
    try {
      const response = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, grade, time, monthlyFee: parseInt(monthlyFee) || 0 })
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(prev => [...prev, data]);
        logActivity('Add Batch', `Created new batch: ${name} (${grade})`);
        addToast(`Batch ${name} created successfully!`, 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to create batch', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const editBatch = async (batchId, name, grade, time, monthlyFee) => {
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${batchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, grade, time, monthlyFee: parseInt(monthlyFee) || 0 })
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(prev => prev.map(c => c.id === batchId ? data : c));
        fetchDataFromServer();
        logActivity('Edit Batch', `Updated batch details for: ${name}`);
        addToast(`Batch ${name} updated successfully!`, 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to update batch', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Academic Assignments
  const addAssignment = async (title, subject, dueDate, type = 'PDF', link = '', file = null) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('dueDate', dueDate);
      formData.append('type', type);
      formData.append('link', link || '');
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(prev => [...prev, data]);
        logActivity('Add Assignment', `Created assignment: ${title} for subject ${subject}`);
        addToast('Assignment posted successfully!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to post assignment', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const deleteAssignment = async (assignmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        // Also remove any submissions associated with this assignment
        const updatedSubmissions = submissions.filter(s => s.assignmentId !== assignmentId);
        setSubmissions(updatedSubmissions);
        localStorage.setItem('aarambh_submissions', JSON.stringify(updatedSubmissions));

        logActivity('Delete Assignment', `Removed assignment ID: ${assignmentId}`);
        addToast('Assignment deleted successfully', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to delete assignment', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // E-Books & Study Materials Library
  const addLibraryMaterial = async (title, subject, type, link = '', file = null) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('type', type);
      formData.append('link', link || '');
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('http://localhost:5000/api/library', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setLibrary(prev => [...prev, data]);
        logActivity('Add Library Material', `Added study material ${title} to ${subject} library`);
        addToast('Library material added successfully!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to add study material', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const deleteLibraryMaterial = async (materialId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/library/${materialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setLibrary(prev => prev.filter(l => l.id !== materialId));
        logActivity('Delete Library Material', `Removed study material ID: ${materialId}`);
        addToast('Study material deleted successfully', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to delete study material', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Bulletins & Announcements
  const addAnnouncement = async (title, content, targetClass) => {
    try {
      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, content, targetClass, date: new Date().toLocaleDateString() })
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(prev => [data, ...prev]);
        logActivity('Add Announcement', `Published notice: "${title}" to ${targetClass}`);
        addToast('Announcement published!');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to publish announcement', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        logActivity('Delete Announcement', `Removed announcement ID: ${id}`);
        addToast('Announcement removed.', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to remove announcement', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  // Profile Details
  const updateProfile = async (name, email, photo) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name, email, photo })
      });
      if (response.ok) {
        const updatedUser = { ...loggedInUser, name, email, photo };
        setLoggedInUser(updatedUser);
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        addToast('Profile settings updated successfully!', 'success');
        return true;
      }
    } catch(err) {
      console.error(err);
    }
    const updatedUser = { ...loggedInUser, name, email, photo };
    setLoggedInUser(updatedUser);
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    addToast('Profile settings saved locally!', 'warning');
    return true;
  };

  const addExpense = async (title, amount) => {
    let newExp = {
      id: Date.now(),
      title,
      amount: parseInt(amount),
      date: new Date().toLocaleDateString()
    };

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title, amount: parseInt(amount), date: newExp.date })
      });
      if (response.ok) {
        const data = await response.json();
        newExp = { ...newExp, id: data.id };
      }
    } catch (e) {
      // offline fallback
    }

    const updatedExpenses = [newExp, ...expenses];
    setExpenses(updatedExpenses);
    localStorage.setItem('aarambh_expenses', JSON.stringify(updatedExpenses));
    logActivity('Add Expense', `Logged expense: ${title} of ₹${amount}`);
    addToast('Expense recorded successfully!', 'success');
    return newExp;
  };

  const editExpense = async (id, title, amount) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ title, amount: parseInt(amount) })
      });
    } catch (e) {
      // offline fallback
    }

    const updatedExpenses = expenses.map(e => e.id === id ? { ...e, title, amount: parseInt(amount) } : e);
    setExpenses(updatedExpenses);
    localStorage.setItem('aarambh_expenses', JSON.stringify(updatedExpenses));
    logActivity('Edit Expense', `Updated expense ID: ${id} to ${title} (₹${amount})`);
    addToast('Expense updated successfully!', 'success');
    return true;
  };

  const removeExpense = async (id) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
    } catch(e) {
      // offline fallback
    }

    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem('aarambh_expenses', JSON.stringify(updatedExpenses));
    logActivity('Remove Expense', `Deleted expense ID: ${id}`);
    addToast('Expense deleted.', 'success');
    return true;
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/history', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Error fetching audit history logs', e);
    }
  };

  const deleteHistoryLog = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(log => log.id !== id));
        addToast('Log entry deleted successfully.', 'success');
        return true;
      }
    } catch (e) {
      addToast('Failed to delete log entry', 'danger');
    }
    return false;
  };

  const clearAllHistoryLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        setHistory([]);
        addToast('All audit logs cleared successfully.', 'success');
        return true;
      }
    } catch (e) {
      addToast('Failed to clear audit logs', 'danger');
    }
    return false;
  };

  const addDoubtTicket = async (subject, description) => {
    try {
      const response = await fetch(`http://localhost:5000/api/doubts`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, description })
      });
      if (response.ok) {
        const newTicket = await response.json();
        setDoubtTickets(prev => [newTicket, ...prev]);
        logActivity('Doubt Clearance', `Submitted ticket for subject ${subject}: ${description.slice(0, 30)}...`);
        addToast('Doubt ticket submitted successfully.', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to submit doubt ticket', 'danger');
      }
    } catch (e) {
      addToast('Connection to server failed', 'danger');
    }
    return false;
  };

  const replyToDoubtTicket = async (ticketId, reply) => {
    try {
      const response = await fetch(`http://localhost:5000/api/doubts/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reply })
      });
      if (response.ok) {
        setDoubtTickets(prev => prev.map(t => t.id === ticketId ? { ...t, reply, status: 'Resolved' } : t));
        addToast('Reply submitted successfully!', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to submit reply', 'danger');
      }
    } catch (e) {
      addToast('Connection to server failed', 'danger');
    }
    return false;
  };

  const addNotification = (title, text, type = 'announcement') => {
    const notifId = Date.now();
    const newNotif = {
      id: notifId,
      title,
      text,
      type,
      read: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('aarambh_notifications', JSON.stringify(updated));
      return updated;
    });

    // Toast alert matched to the type
    setToasts(prev => [...prev, { id: notifId, title, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notifId));
    }, 4000);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('aarambh_notifications', JSON.stringify(updated));
      return updated;
    });
    addToast('All notifications marked as read.', 'success');
  };

  const addSubmission = async (assignmentId, studentId, link, text, file = null) => {
    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('studentId', studentId);
      formData.append('link', link || '');
      formData.append('text', text || '');
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(prev => {
          const filtered = prev.filter(s => !(s.assignmentId === assignmentId && s.studentId === studentId));
          const updated = [...filtered, data];
          return updated;
        });
        logActivity('Assignment Submit', `Submitted assignment ID ${assignmentId}`);
        addNotification('Assignment Submitted', `You turned in your work for assignment ID ${assignmentId}`, 'assignment');
        addToast('Assignment submitted successfully!', 'success');
        return data;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to submit assignment', 'danger');
        return false;
      }
    } catch (e) {
      addOfflineSubmission(assignmentId, studentId, link, text);
      return false;
    }
  };

  const deleteSubmission = async (submissionId) => {
    try {
      // If it is a simulated offline / unsynced submission
      const isOffline = pendingUploads.some(p => p.id === submissionId);
      if (isOffline) {
        const updatedSub = submissions.filter(s => s.id !== submissionId);
        setSubmissions(updatedSub);
        localStorage.setItem('aarambh_submissions', JSON.stringify(updatedSub));

        const updatedPending = pendingUploads.filter(p => p.id !== submissionId);
        setPendingUploads(updatedPending);
        localStorage.setItem('aarambh_pending_uploads', JSON.stringify(updatedPending));

        addToast('Offline queued submission removed successfully.', 'success');
        return true;
      }

      const response = await fetch(`http://localhost:5000/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        addToast('Submission deleted successfully. You can resubmit now.', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to delete submission', 'danger');
      }
    } catch (e) {
      addToast('Connection to server failed', 'danger');
    }
    return false;
  };

  const addOfflineSubmission = (assignmentId, studentId, link, text) => {
    const offlineId = Date.now();
    const tempSubmission = {
      id: offlineId,
      assignmentId,
      studentId,
      link,
      text,
      status: 'Syncing Offline',
      timestamp: new Date().toLocaleString(),
      grade: null
    };
    
    // Add to submissions state so UI displays it
    const updatedSub = [...submissions, tempSubmission];
    setSubmissions(updatedSub);
    localStorage.setItem('aarambh_submissions', JSON.stringify(updatedSub));

    // Save to pending uploads queue
    const updatedPending = [...pendingUploads, tempSubmission];
    setPendingUploads(updatedPending);
    localStorage.setItem('aarambh_pending_uploads', JSON.stringify(updatedPending));
    
    logActivity('Offline Submit', `Queued offline submission for assignment ID ${assignmentId}`);
    addNotification('Offline Queued', `Assignment saved offline (⏳ Syncing Offline). It will sync when online.`, 'assignment');
  };

  const syncOfflineSubmissions = () => {
    const queued = JSON.parse(localStorage.getItem('aarambh_pending_uploads') || '[]');
    if (queued.length === 0) return;

    const currentSubs = JSON.parse(localStorage.getItem('aarambh_submissions') || '[]');
    
    const updatedSubs = currentSubs.map(sub => {
      const match = queued.find(q => q.id === sub.id);
      if (match) {
        return { ...sub, status: 'Submitted' };
      }
      return sub;
    });

    setSubmissions(updatedSubs);
    localStorage.setItem('aarambh_submissions', JSON.stringify(updatedSubs));

    setPendingUploads([]);
    localStorage.setItem('aarambh_pending_uploads', JSON.stringify([]));

    logActivity('Queue Sync', `Synchronized ${queued.length} offline submissions.`);
    addNotification('Sync Success', `[SYNC] Offline assignments synchronized successfully!`, 'success');
  };

  const gradeSubmission = async (submissionId, grade, feedback) => {
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ grade, feedback })
      });
      if (response.ok) {
        setSubmissions(prev => prev.map(sub => {
          if (sub.id === submissionId) {
            return { ...sub, grade, feedback, status: 'Graded' };
          }
          return sub;
        }));
        addToast(`Successfully graded submission with score ${grade}`, 'success');
        logActivity('Grade Submission', `Graded submission ID ${submissionId} with score ${grade}`);
        addNotification('Grade Published', `Your assignment submission was graded: ${grade}`, 'assignment');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to grade submission', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const addCalendarEvent = async (title, date, time, type, description) => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title, date, time, type, description })
      });
      if (response.ok) {
        const newEvent = await response.json();
        setCalendarEvents(prev => [...prev, newEvent]);
        logActivity('Add Calendar Event', `Created calendar event: ${title} for ${date}`);
        addToast('Calendar event created successfully!', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to create calendar event', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (response.ok) {
        setCalendarEvents(prev => prev.filter(ev => ev.id !== eventId));
        logActivity('Delete Calendar Event', `Deleted calendar event ID: ${eventId}`);
        addToast('Calendar event deleted successfully', 'success');
        return true;
      } else {
        const errData = await response.json();
        addToast(errData.error || 'Failed to delete calendar event', 'danger');
        return false;
      }
    } catch (e) {
      addToast('Server connection failed', 'danger');
      return false;
    }
  };

  const API_URL = 'http://localhost:5000/api';
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, userRole, loggedInUser, authToken,
      loginAdmin, registerAdmin, loginStudent, loginTeacher, logout, requestRegistration, approveRequest, rejectRequest,
      theme, setTheme, sidebarCollapsed, setSidebarCollapsed,
      students, teachers, fees, messages, toasts, classes, expenses, attendance,
      assignments, submissions, calendarEvents, library, history, announcements, registrationRequests, doubtTickets,
      notifications, pendingUploads, quizzes, quizAttempts, syllabus,
      sendMessage, recordFeePayment, sendFeeReminders, addToast, showToast: addToast, addStudent, removeStudent, addBatch, editBatch, removeBatch,
      submitUpiPayment, verifyUpiPayment, createQuiz, submitQuizAnswers, deleteQuiz,
      addSyllabusTopic, updateSyllabusTopicStatus, deleteSyllabusTopic,
      addTeacher, removeTeacher, editStudent, editTeacher,
      addAssignment, deleteAssignment, addLibraryMaterial, deleteLibraryMaterial, fetchHistory, updateProfile, addAnnouncement, deleteAnnouncement,
      addExpense, editExpense, removeExpense, markAttendance, triggerMarkAttendance, sendMonthlyAttendanceReport, addDoubtTicket, replyToDoubtTicket, deleteHistoryLog, clearAllHistoryLogs,
      addNotification, markAllNotificationsAsRead, addSubmission, deleteSubmission, addOfflineSubmission, syncOfflineSubmissions, gradeSubmission, API_URL, authHeaders,
      addCalendarEvent, deleteCalendarEvent
    }}>
      {children}
    </AppContext.Provider>
  );
};
