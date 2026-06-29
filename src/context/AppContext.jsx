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

  // Serverless LocalStorage DB State
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [library, setLibrary] = useState([]);
  const [history, setHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Initialize DB on first load
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  // Seed default data if not initialized
  useEffect(() => {
    const initialized = localStorage.getItem('aarambh_db_initialized');
    if (!initialized) {
      const defaultUsers = [
        { id: 1, name: 'System Admin', username: 'admin', password: 'pass', role: 'admin', email: 'admin@aarambh.edu' },
        { id: 2, name: 'S. Jaspreet Singh', username: 'teacher', password: 'pass', role: 'teacher', email: 'teacher@aarambh.edu' },
        { id: 3, name: 'Jaspreet Kaur', username: 'student', password: 'pass', role: 'student', fatherName: 'Jaspreet Singh', class: '10th Math', admission_number: 'AES1001', parentPhone: '9876543210' }
      ];
      const defaultClasses = [
        { id: 1, name: '10th Math', grade: 'Class A', time: '10:00 AM' },
        { id: 2, name: '10th Science', grade: 'Class B', time: '11:30 AM' }
      ];
      const defaultStudents = [
        { id: 3, name: 'Jaspreet Kaur', class: '10th Math', parentPhone: '9876543210', fatherName: 'Jaspreet Singh', username: 'student', admission_number: 'AES1001' }
      ];
      const defaultTeachers = [
        { id: 2, name: 'S. Jaspreet Singh', email: 'teacher@aarambh.edu', username: 'teacher' }
      ];
      
      // Seed 12 months fees for default student
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const defaultFees = months.map((month, idx) => ({
        id: idx + 1,
        studentId: 3,
        month,
        total: 1000,
        paid: idx < 5 ? 1000 : 0,
        status: idx < 5 ? 'Paid' : 'Pending',
        dueDate: `10/${(idx + 1).toString().padStart(2, '0')}/2026`,
        paymentMode: idx < 5 ? 'Cash' : null,
        paymentDate: idx < 5 ? `05/${(idx + 1).toString().padStart(2, '0')}/2026` : null
      }));

      const defaultLibrary = [
        { id: 1, title: 'Algebra Core Guide', subject: '10th Math', type: 'E-Book', link: 'https://example.com/algebra' }
      ];
      const defaultAssignments = [
        { id: 1, title: 'Quadratic Equations Worksheet', subject: '10th Math', due_date: 'July 10, 2026' }
      ];
      const defaultAnnouncements = [
        { id: 1, title: 'Special Physics Session', content: 'Sunday special lecture rescheduled to 9 AM.', target_class: 'All', date: new Date().toLocaleDateString() }
      ];
      const defaultRequests = [
        { id: 101, role: 'student', name: 'Simran Singh', username: 'simran', password: 'pass', parentPhone: '9999988888', className: '10th Math', admission_number: 'AES1002', fatherName: 'Gurbaksh Singh', status: 'pending' }
      ];

      localStorage.setItem('aarambh_users', JSON.stringify(defaultUsers));
      localStorage.setItem('aarambh_classes', JSON.stringify(defaultClasses));
      localStorage.setItem('aarambh_students', JSON.stringify(defaultStudents));
      localStorage.setItem('aarambh_teachers', JSON.stringify(defaultTeachers));
      localStorage.setItem('aarambh_fees', JSON.stringify(defaultFees));
      localStorage.setItem('aarambh_library', JSON.stringify(defaultLibrary));
      localStorage.setItem('aarambh_assignments', JSON.stringify(defaultAssignments));
      localStorage.setItem('aarambh_announcements', JSON.stringify(defaultAnnouncements));
      localStorage.setItem('aarambh_requests', JSON.stringify(defaultRequests));
      localStorage.setItem('aarambh_history', JSON.stringify([]));
      localStorage.setItem('aarambh_messages', JSON.stringify([]));
      localStorage.setItem('aarambh_db_initialized', 'true');
    }

    // Load state from localStorage
    setClasses(JSON.parse(localStorage.getItem('aarambh_classes') || '[]'));
    setStudents(JSON.parse(localStorage.getItem('aarambh_students') || '[]'));
    setTeachers(JSON.parse(localStorage.getItem('aarambh_teachers') || '[]'));
    setFees(JSON.parse(localStorage.getItem('aarambh_fees') || '[]'));
    setLibrary(JSON.parse(localStorage.getItem('aarambh_library') || '[]'));
    setAssignments(JSON.parse(localStorage.getItem('aarambh_assignments') || '[]'));
    setAnnouncements(JSON.parse(localStorage.getItem('aarambh_announcements') || '[]'));
    setRegistrationRequests(JSON.parse(localStorage.getItem('aarambh_requests') || '[]'));
    setHistory(JSON.parse(localStorage.getItem('aarambh_history') || '[]'));
    setMessages(JSON.parse(localStorage.getItem('aarambh_messages') || '[]'));
  }, []);

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
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const admin = users.find(u => u.username === username && u.password === password && u.role === 'admin');
    if (admin) {
      setAuthToken('admin-mock-token');
      setUserRole('admin');
      setLoggedInUser(admin);
      addToast(`Welcome back, ${admin.name}!`);
      return true;
    }
    addToast('Invalid admin credentials', 'danger');
    return false;
  };

  const registerAdmin = async (name, username, password) => {
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    if (users.some(u => u.username === username)) {
      addToast('Username already exists', 'danger');
      return false;
    }
    const newUser = { id: Date.now(), name, username, password, role: 'admin' };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));
    addToast('Admin registered successfully. You can log in.');
    return true;
  };

  const loginStudent = async (username, password) => {
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const student = users.find(u => u.username === username && u.password === password && u.role === 'student');
    if (student) {
      setAuthToken('student-mock-token');
      setUserRole('student');
      setLoggedInUser(student);
      addToast(`Logged in successfully!`);
      return true;
    }
    addToast('Invalid student credentials', 'danger');
    return false;
  };

  const loginTeacher = async (username, password) => {
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const teacher = users.find(u => u.username === username && u.password === password && u.role === 'teacher');
    if (teacher) {
      setAuthToken('teacher-mock-token');
      setUserRole('teacher');
      setLoggedInUser(teacher);
      addToast(`Logged in successfully!`);
      return true;
    }
    addToast('Invalid teacher credentials', 'danger');
    return false;
  };

  const logout = () => {
    setAuthToken(null);
    setUserRole(null);
    setLoggedInUser(null);
    setIsAuthenticated(false);
    addToast('Logged out successfully.');
  };

  // Student Registrations Request
  const requestRegistration = async (studentData) => {
    const requests = JSON.parse(localStorage.getItem('aarambh_requests') || '[]');
    const newRequest = {
      ...studentData,
      id: Date.now(),
      status: 'pending'
    };
    const updatedRequests = [...requests, newRequest];
    setRegistrationRequests(updatedRequests);
    localStorage.setItem('aarambh_requests', JSON.stringify(updatedRequests));
    addToast('Registration request submitted successfully. Waiting for admin approval.');
    return true;
  };

  const approveRequest = async (id) => {
    const requests = JSON.parse(localStorage.getItem('aarambh_requests') || '[]');
    const req = requests.find(r => r.id === id);
    if (!req) return false;

    // 1. Add to students list
    const newStudent = {
      id: req.id,
      name: req.name,
      class: req.className,
      parentPhone: req.parentPhone,
      fatherName: req.fatherName,
      username: req.username,
      admission_number: req.admission_number || `AES${Date.now().toString().slice(-4)}`
    };
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('aarambh_students', JSON.stringify(updatedStudents));

    // 2. Add to users list for login access
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const newUser = {
      id: req.id,
      name: req.name,
      username: req.username,
      password: req.password,
      role: 'student',
      parentPhone: req.parentPhone,
      className: req.className,
      admission_number: newStudent.admission_number,
      fatherName: req.fatherName
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
    const newMsg = {
      id: Date.now(),
      recipient: to,
      channel,
      content,
      date: new Date().toLocaleString(),
      status: 'Delivered',
      previewUrl: null
    };
    const updatedMessages = [newMsg, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem('aarambh_messages', JSON.stringify(updatedMessages));
    
    // Log message dispatch in audit log
    logActivity('Send Message', `Dispatched notification to ${to} via ${channel}`);
    addToast(`Message dispatched via ${channel}!`);
    return true;
  };

  // Record fee payments
  const recordFeePayment = async (studentId, amount, paymentMode, paymentDate, month) => {
    const updatedFees = fees.map(f => {
      if (f.studentId === studentId && f.month === month) {
        return {
          ...f,
          paid: f.paid + amount,
          status: f.paid + amount >= f.total ? 'Paid' : 'Pending',
          paymentMode,
          paymentDate: paymentDate || new Date().toLocaleDateString()
        };
      }
      return f;
    });
    setFees(updatedFees);
    localStorage.setItem('aarambh_fees', JSON.stringify(updatedFees));

    const student = students.find(s => s.id === studentId);
    logActivity('Fee Payment', `Recorded ₹${amount} fee payment for ${student?.name || 'Student'} for the month of ${month}`);
    addToast('Payment recorded successfully!');
    return true;
  };

  // Student Roster Management
  const addStudent = async (studentData) => {
    const id = Date.now();
    const newStudent = {
      id,
      name: studentData.name,
      class: studentData.class,
      parentPhone: studentData.parentPhone,
      fatherName: studentData.fatherName,
      username: studentData.username || `stu_${id.toString().slice(-4)}`,
      admission_number: studentData.admission_number || `AES${id.toString().slice(-4)}`
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('aarambh_students', JSON.stringify(updatedStudents));

    // Register login user credentials
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const newUser = {
      id,
      name: studentData.name,
      username: newStudent.username,
      password: studentData.password || 'pass',
      role: 'student',
      parentPhone: studentData.parentPhone,
      className: studentData.class,
      admission_number: newStudent.admission_number,
      fatherName: studentData.fatherName
    };
    localStorage.setItem('aarambh_users', JSON.stringify([...users, newUser]));

    // Initialize 12 monthly fees
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const newFees = months.map((month, idx) => ({
      id: id + idx,
      studentId: id,
      month,
      total: studentData.monthlyFee || 1000,
      paid: 0,
      status: 'Pending',
      dueDate: `10/${(idx + 1).toString().padStart(2, '0')}/2026`,
      paymentMode: null,
      paymentDate: null
    }));
    const updatedFees = [...fees, ...newFees];
    setFees(updatedFees);
    localStorage.setItem('aarambh_fees', JSON.stringify(updatedFees));

    logActivity('Add Student', `Manually added student ${studentData.name} to class ${studentData.class}`);
    addToast('Student added successfully!');
    return true;
  };

  const removeStudent = async (studentId) => {
    const updatedStudents = students.filter(s => s.id !== studentId);
    setStudents(updatedStudents);
    localStorage.setItem('aarambh_students', JSON.stringify(updatedStudents));

    const updatedFees = fees.filter(f => f.studentId !== studentId);
    setFees(updatedFees);
    localStorage.setItem('aarambh_fees', JSON.stringify(updatedFees));

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const updatedUsers = users.filter(u => u.id !== studentId);
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));

    logActivity('Remove Student', `Removed student ID: ${studentId} from systems`);
    addToast('Student removed successfully.');
    return true;
  };

  // Class Batches Management
  const removeBatch = async (batchId) => {
    const batch = classes.find(c => c.id === batchId);
    if (!batch) return false;

    const updatedClasses = classes.filter(c => c.id !== batchId);
    setClasses(updatedClasses);
    localStorage.setItem('aarambh_classes', JSON.stringify(updatedClasses));

    logActivity('Remove Batch', `Removed batch: ${batch.name}`);
    addToast(`Batch ${batch.name} removed successfully.`);
    return true;
  };

  // Academic Assignments
  const addAssignment = async (title, subject, dueDate) => {
    const newAssn = {
      id: Date.now(),
      title,
      subject,
      due_date: dueDate
    };
    const updatedAssignments = [...assignments, newAssn];
    setAssignments(updatedAssignments);
    localStorage.setItem('aarambh_assignments', JSON.stringify(updatedAssignments));

    logActivity('Add Assignment', `Created assignment: ${title} for subject ${subject}`);
    addToast('Assignment posted successfully!');
    return true;
  };

  // E-Books & Study Materials Library
  const addLibraryMaterial = async (title, subject, type, link) => {
    const newMaterial = {
      id: Date.now(),
      title,
      subject,
      type,
      link: link || '#'
    };
    const updatedLibrary = [...library, newMaterial];
    setLibrary(updatedLibrary);
    localStorage.setItem('aarambh_library', JSON.stringify(updatedLibrary));

    logActivity('Add Library Material', `Added study material ${title} to ${subject} library`);
    addToast('Library material added successfully!');
    return true;
  };

  // Bulletins & Announcements
  const addAnnouncement = async (title, content, targetClass) => {
    const newAnn = {
      id: Date.now(),
      title,
      content,
      target_class: targetClass,
      date: new Date().toLocaleDateString()
    };
    const updatedAnnouncements = [newAnn, ...announcements];
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('aarambh_announcements', JSON.stringify(updatedAnnouncements));

    logActivity('Add Announcement', `Published notice: "${title}" to ${targetClass}`);
    addToast('Announcement published!');
    return true;
  };

  const deleteAnnouncement = async (id) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('aarambh_announcements', JSON.stringify(updatedAnnouncements));

    logActivity('Delete Announcement', `Removed announcement ID: ${id}`);
    addToast('Announcement removed.');
    return true;
  };

  // Profile Details
  const updateProfile = async (name, email) => {
    const updatedUser = { ...loggedInUser, name, email };
    setLoggedInUser(updatedUser);
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const updatedUsers = users.map(u => u.id === loggedInUser.id ? { ...u, name, email } : u);
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));

    addToast('Profile settings updated successfully!');
    return true;
  };

  const fetchHistory = () => {
    // Audit logs are updated reactively on states
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, userRole, loggedInUser,
      loginAdmin, registerAdmin, loginStudent, loginTeacher, logout, requestRegistration, approveRequest, rejectRequest,
      theme, setTheme, 
      students, teachers, fees, messages, toasts, classes,
      assignments, submissions, calendarEvents, library, history, announcements, registrationRequests,
      sendMessage, recordFeePayment, addToast, addStudent, removeStudent, removeBatch,
      addAssignment, addLibraryMaterial, fetchHistory, updateProfile, addAnnouncement, deleteAnnouncement
    }}>
      {children}
    </AppContext.Provider>
  );
};
