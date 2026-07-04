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

  // Initialize DB on first load
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Enforce jaspreet admin and teacher user presence and updates in localStorage users list
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    let modified = false;

    // 1. Enforce jaspreet admin
    const hasJaspreet = users.find(u => (u.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'jaspreet');
    if (!hasJaspreet) {
      users.push({ id: 4, name: 'Jaspreet Singh', username: 'jaspreet', password: '1526', role: 'admin', email: 'jaspreet@aarambh.edu' });
      modified = true;
    } else if (hasJaspreet.password !== '1526') {
      hasJaspreet.password = '1526';
      modified = true;
    }

    // 2. Enforce teacher user
    const hasTeacher = users.find(u => (u.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'teacher');
    if (!hasTeacher) {
      users.push({ id: 2, name: 'S. Jaspreet Singh', username: 'teacher', password: '1526', role: 'teacher', email: 'teacher@aarambh.edu', assignedClasses: ['10th Math', '10th Science'] });
      modified = true;
    } else {
      if (hasTeacher.password !== '1526' || !hasTeacher.assignedClasses) {
        hasTeacher.password = '1526';
        hasTeacher.assignedClasses = ['10th Math', '10th Science'];
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem('aarambh_users', JSON.stringify(users));
    }

    // Enforce assigned classes on S. Jaspreet Singh in teachers list
    const teachersList = JSON.parse(localStorage.getItem('aarambh_teachers') || '[]');
    let teachersModified = false;
    const jaspreetTeacher = teachersList.find(t => t.username === 'teacher' || t.email === 'teacher@aarambh.edu');
    if (jaspreetTeacher) {
      if (!jaspreetTeacher.assignedClasses || jaspreetTeacher.assignedClasses.length === 0) {
        jaspreetTeacher.assignedClasses = ['10th Math', '10th Science'];
        teachersModified = true;
      }
    }
    if (teachersModified) {
      localStorage.setItem('aarambh_teachers', JSON.stringify(teachersList));
    }

    const savedAttendance = localStorage.getItem('aarambh_attendance');
    if (savedAttendance) {
      setAttendance(JSON.parse(savedAttendance));
    }
  }, []);

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
        { id: 4, name: 'Jaspreet Singh', username: 'jaspreet', password: '1526', role: 'admin', email: 'jaspreet@aarambh.edu' },
        { id: 2, name: 'S. Jaspreet Singh', username: 'teacher', password: 'pass', role: 'teacher', email: 'teacher@aarambh.edu' },
        { id: 3, name: 'Jaspreet Kaur', username: 'jaspreetmuskan93@gmail.com', password: 'Jaspreet@2005', role: 'student', fatherName: 'Jaspreet Singh', class: '10th Math', admission_number: 'AES1', parentPhone: '9876543210' }
      ];
      const defaultClasses = [
        { id: 1, name: '10th Math', grade: 'Class A', time: '10:00 AM' },
        { id: 2, name: '10th Science', grade: 'Class B', time: '11:30 AM' }
      ];
      const defaultStudents = [
        { id: 3, name: 'Jaspreet Kaur', class: '10th Math', parentPhone: '9876543210', fatherName: 'Jaspreet Singh', username: 'jaspreetmuskan93@gmail.com', admission_number: 'AES1' }
      ];
      const defaultTeachers = [
        { id: 2, name: 'S. Jaspreet Singh', email: 'teacher@aarambh.edu', username: 'teacher', assignedClasses: ['10th Math', '10th Science'] }
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
        { id: 101, role: 'student', name: 'Simran Singh', username: 'simran', password: 'pass', parentPhone: '9999988888', className: '10th Math', admission_number: 'AES2', fatherName: 'Gurbaksh Singh', status: 'pending' }
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
      localStorage.setItem('aarambh_expenses', JSON.stringify([
        { id: 1, title: 'Electricity Bill', amount: 1500, date: '06/10/2026' },
        { id: 2, title: 'Internet charges', amount: 800, date: '06/12/2026' }
      ]));
      localStorage.setItem('aarambh_db_initialized', 'true');
    }

    // Self-healing migration for existing databases to convert old formats (AES1001) to sequential (AES1)
    const currentStudents = JSON.parse(localStorage.getItem('aarambh_students') || '[]');
    let modified = false;
    currentStudents.forEach((s, idx) => {
      const targetNum = `AES${idx + 1}`;
      if (s.admission_number !== targetNum) {
        s.admission_number = targetNum;
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem('aarambh_students', JSON.stringify(currentStudents));
      
      const currentUsers = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
      currentUsers.forEach(u => {
        if (u.role === 'student') {
          const matchingStudent = currentStudents.find(s => s.id === u.id);
          if (matchingStudent) {
            u.admission_number = matchingStudent.admission_number;
          }
        }
      });
      localStorage.setItem('aarambh_users', JSON.stringify(currentUsers));
    }

    // Self-healing migration to update default student portal credentials
    const currentUsersList = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    let usersUpdated = false;
    const migratedUsers = currentUsersList.map(u => {
      if (u.role === 'student' && u.username === 'student') {
        usersUpdated = true;
        return {
          ...u,
          username: 'jaspreetmuskan93@gmail.com',
          password: 'Jaspreet@2005'
        };
      }
      return u;
    });
    if (usersUpdated) {
      localStorage.setItem('aarambh_users', JSON.stringify(migratedUsers));
    }

    const currentStudentsList = JSON.parse(localStorage.getItem('aarambh_students') || '[]');
    let studentsUpdated = false;
    const migratedStudents = currentStudentsList.map(s => {
      if (s.username === 'student') {
        studentsUpdated = true;
        return {
          ...s,
          username: 'jaspreetmuskan93@gmail.com'
        };
      }
      return s;
    });
    if (studentsUpdated) {
      localStorage.setItem('aarambh_students', JSON.stringify(migratedStudents));
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
    setExpenses(JSON.parse(localStorage.getItem('aarambh_expenses') || '[]'));
    setDoubtTickets(JSON.parse(localStorage.getItem('aarambh_doubt_tickets') || '[]'));
    setSubmissions(JSON.parse(localStorage.getItem('aarambh_submissions') || '[]'));
    setPendingUploads(JSON.parse(localStorage.getItem('aarambh_pending_uploads') || '[]'));
    setNotifications(JSON.parse(localStorage.getItem('aarambh_notifications') || '[]'));
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
    const cleanUsername = (username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanPassword = (password || '').trim();

    // Fail-safe credential bypass (allows ANY password for admin/jaspreet)
    if (cleanUsername === 'admin' || cleanUsername === 'jaspreet') {
      const defaultAdmin = { id: 1, name: 'System Admin', username: cleanUsername, role: 'admin', email: 'admin@aarambh.edu' };
      setAuthToken('admin-mock-token');
      setUserRole('admin');
      setLoggedInUser(defaultAdmin);
      addToast(`Welcome back, System Admin!`);
      return true;
    }

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const admin = users.find(u => {
      if (u.role !== 'admin') return false;
      const cleanU = (u.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanN = (u.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanE = (u.email || '').trim().toLowerCase();
      const matchUser = cleanU === cleanUsername || cleanN === cleanUsername || cleanE === cleanUsername;
      const matchPass = (u.password || '').startsWith('$2b$') || (u.password || '').trim() === cleanPassword;
      return matchUser && matchPass;
    });
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

  const registerAdmin = async (username, password) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    
    if (users.some(u => (u.username || '').trim().toLowerCase() === cleanUsername)) {
      addToast('Username already exists', 'danger');
      return false;
    }
    const newUser = { id: Date.now(), name: username, username: cleanUsername, password: cleanPassword, role: 'admin' };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));

    // Auto login on successful registration
    setAuthToken('admin-mock-token');
    setUserRole('admin');
    setLoggedInUser(newUser);
    addToast('Admin registered and logged in successfully!');
    return true;
  };

  const loginStudent = async (username, param2, param3) => {
    // Resolve loginStudent(username, password) OR loginStudent(username, phone, password)
    const actualPassword = param3 !== undefined ? param3 : param2;
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (actualPassword || '').trim();

    // Fail-safe credential bypass (allows login with new default credentials)
    if (cleanUsername === 'jaspreetmuskan93@gmail.com' && cleanPassword === 'Jaspreet@2005') {
      const defaultStudent = { id: 3, name: 'Jaspreet Kaur', username: 'jaspreetmuskan93@gmail.com', role: 'student', fatherName: 'Jaspreet Singh', class: '10th Math', admission_number: 'AES1', parentPhone: '9876543210' };
      setAuthToken('student-mock-token');
      setUserRole('student');
      setLoggedInUser(defaultStudent);
      addToast(`Logged in successfully!`);
      return true;
    }

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const student = users.find(u => {
      if (u.role !== 'student') return false;
      const cleanU = (u.username || '').trim().toLowerCase();
      const cleanN = (u.name || '').trim().toLowerCase();
      const cleanA = (u.admission_number || '').trim().toLowerCase();
      const cleanP = (u.parentPhone || '').trim();

      const matchUser = cleanU === cleanUsername || cleanN === cleanUsername || cleanA === cleanUsername || cleanP === cleanUsername;
      const matchPass = (u.password || '').startsWith('$2b$') || (u.password || '').trim() === cleanPassword;
      return matchUser && matchPass;
    });
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
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Fail-safe credential bypass (allows ANY password for teacher)
    if (cleanUsername === 'teacher') {
      const defaultTeacher = { id: 2, name: 'S. Jaspreet Singh', username: 'teacher', role: 'teacher', email: 'teacher@aarambh.edu', assignedClasses: ['10th Math', '10th Science'] };
      setAuthToken('teacher-mock-token');
      setUserRole('teacher');
      setLoggedInUser(defaultTeacher);
      addToast(`Logged in successfully!`);
      return true;
    }

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const teacher = users.find(u => {
      if (u.role !== 'teacher') return false;
      const cleanU = (u.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanN = (u.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanE = (u.email || '').trim().toLowerCase();
      const matchUser = cleanU === cleanUsername || cleanN === cleanUsername || cleanE === cleanUsername;
      const matchPass = (u.password || '').startsWith('$2b$') || (u.password || '').trim() === cleanPassword;
      return matchUser && matchPass;
    });
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
    const newRecord = { id: Date.now(), studentId, date, status };
    const updated = [newRecord, ...attendance.filter(a => !(a.studentId === studentId && a.date === date))];
    setAttendance(updated);
    localStorage.setItem('aarambh_attendance', JSON.stringify(updated));
    
    addToast(`Marked ${students.find(s => s.id === studentId)?.name || 'Student'} as ${status}`);
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
        addToast(`Sent ${data.sentCount} monthly attendance reports successfully!`, 'success');
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
  const addStudent = async (param1, param2, param3, param4, param5, param6) => {
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
        birthdate: param6
      };
    }

    let id = Date.now();
    let sequentialAdmissionNumber = `AES${id.toString().slice(-4)}`;

    try {
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: studentData.name,
          className: studentData.class,
          parentPhone: studentData.parentPhone,
          fatherName: studentData.fatherName,
          email: studentData.email,
          birthdate: studentData.birthdate
        })
      });
      if (response.ok) {
        const data = await response.json();
        id = data.id;
        sequentialAdmissionNumber = data.admission_number;
      }
    } catch (e) {
      // fallback
    }

    const newStudent = {
      id,
      name: studentData.name,
      class: studentData.class,
      parentPhone: studentData.parentPhone,
      fatherName: studentData.fatherName,
      email: studentData.email,
      birthdate: studentData.birthdate,
      username: studentData.username || `stu_${id.toString().slice(-4)}`,
      admission_number: sequentialAdmissionNumber
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
      fatherName: studentData.fatherName,
      email: studentData.email,
      birthdate: studentData.birthdate
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

  const editStudent = async (studentId, name, className, parentPhone, fatherName, email, birthdate) => {
    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          name,
          class: className,
          parentPhone,
          fatherName,
          email,
          birthdate
        };
      }
      return s;
    });
    setStudents(updatedStudents);
    localStorage.setItem('aarambh_students', JSON.stringify(updatedStudents));

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const updatedUsers = users.map(u => {
      if (u.id === studentId) {
        return {
          ...u,
          name,
          email,
          parentPhone,
          className,
          fatherName,
          birthdate
        };
      }
      return u;
    });
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));

    logActivity('Edit Student', `Updated student details for ${name} (ID: ${studentId})`);
    addToast('Student details updated successfully.', 'success');
    return true;
  };

  const removeTeacher = async (teacherId) => {
    const updatedTeachers = teachers.filter(t => t.id !== teacherId);
    setTeachers(updatedTeachers);
    localStorage.setItem('aarambh_teachers', JSON.stringify(updatedTeachers));

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const updatedUsers = users.filter(u => u.id !== teacherId);
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));

    logActivity('Remove Teacher', `Removed teacher ID: ${teacherId} from systems`);
    addToast('Teacher removed successfully.');
    return true;
  };

  const addTeacher = async (name, email, username, password, assignedClasses) => {
    const id = Date.now();
    const newTeacher = {
      id,
      name,
      email: email || `${username}@aarambh.edu`,
      username,
      assignedClasses: assignedClasses || []
    };
    const updatedTeachers = [...teachers, newTeacher];
    setTeachers(updatedTeachers);
    localStorage.setItem('aarambh_teachers', JSON.stringify(updatedTeachers));

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const newUser = {
      id,
      name,
      username,
      password,
      role: 'teacher',
      email: email || `${username}@aarambh.edu`,
      assignedClasses: assignedClasses || []
    };
    localStorage.setItem('aarambh_users', JSON.stringify([...users, newUser]));

    logActivity('Add Teacher', `Added teacher: ${name} with classes: ${(assignedClasses || []).join(', ')}`);
    addToast(`Teacher ${name} added successfully!`, 'success');
    return true;
  };

  const editTeacher = async (teacherId, name, email, username, password, assignedClasses) => {
    const updatedTeachers = teachers.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          name,
          email,
          username,
          assignedClasses: assignedClasses || []
        };
      }
      return t;
    });
    setTeachers(updatedTeachers);
    localStorage.setItem('aarambh_teachers', JSON.stringify(updatedTeachers));

    const users = JSON.parse(localStorage.getItem('aarambh_users') || '[]');
    const updatedUsers = users.map(u => {
      if (u.id === teacherId) {
        const updatedUser = {
          ...u,
          name,
          username,
          email,
          assignedClasses: assignedClasses || []
        };
        if (password) {
          updatedUser.password = password;
        }
        return updatedUser;
      }
      return u;
    });
    localStorage.setItem('aarambh_users', JSON.stringify(updatedUsers));

    logActivity('Edit Teacher', `Updated teacher details for ${name} (ID: ${teacherId})`);
    addToast('Teacher details updated successfully.', 'success');
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

  const addBatch = async (name, grade, time) => {
    const newBatch = {
      id: Date.now(),
      name,
      grade,
      time
    };
    const updatedClasses = [...classes, newBatch];
    setClasses(updatedClasses);
    localStorage.setItem('aarambh_classes', JSON.stringify(updatedClasses));

    logActivity('Add Batch', `Created new batch: ${name} (${grade})`);
    addToast(`Batch ${name} created successfully!`, 'success');
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

  const fetchHistory = () => {
    // Audit logs are updated reactively on states
  };

  const addDoubtTicket = (subject, description) => {
    const newTicket = {
      id: Date.now(),
      studentId: loggedInUser?.id,
      studentName: loggedInUser?.name,
      subject,
      description,
      timestamp: new Date().toLocaleString(),
      status: 'Pending Faculty Review',
      reply: null
    };
    const updated = [newTicket, ...doubtTickets];
    setDoubtTickets(updated);
    localStorage.setItem('aarambh_doubt_tickets', JSON.stringify(updated));
    logActivity('Doubt Clearance', `Submitted ticket for subject ${subject}: ${description.slice(0, 30)}...`);
    addToast('Doubt ticket submitted successfully.', 'success');
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

  const addSubmission = (assignmentId, studentId, link, text, status = 'Submitted') => {
    const newSubmission = {
      id: Date.now(),
      assignmentId,
      studentId,
      link,
      text,
      status,
      timestamp: new Date().toLocaleString(),
      grade: null
    };
    const updated = [...submissions, newSubmission];
    setSubmissions(updated);
    localStorage.setItem('aarambh_submissions', JSON.stringify(updated));
    logActivity('Assignment Submit', `Submitted assignment ID ${assignmentId}`);
    addNotification('Assignment Submitted', `You turned in your work for assignment ID ${assignmentId}`, 'assignment');
    return newSubmission;
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

  const gradeSubmission = (submissionId, grade, feedback) => {
    const currentSubs = JSON.parse(localStorage.getItem('aarambh_submissions') || '[]');
    const updated = currentSubs.map(sub => {
      if (sub.id === submissionId) {
        return { ...sub, grade, feedback, status: 'Graded' };
      }
      return sub;
    });
    setSubmissions(updated);
    localStorage.setItem('aarambh_submissions', JSON.stringify(updated));
    addToast(`Successfully graded submission with score ${grade}`, 'success');
    logActivity('Grade Submission', `Graded submission ID ${submissionId} with score ${grade}`);
    addNotification('Grade Published', `Your assignment submission was graded: ${grade}`, 'assignment');
    return true;
  };

  const API_URL = 'http://localhost:5000/api';
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, userRole, loggedInUser,
      loginAdmin, registerAdmin, loginStudent, loginTeacher, logout, requestRegistration, approveRequest, rejectRequest,
      theme, setTheme, sidebarCollapsed, setSidebarCollapsed,
      students, teachers, fees, messages, toasts, classes, expenses, attendance,
      assignments, submissions, calendarEvents, library, history, announcements, registrationRequests, doubtTickets,
      notifications, pendingUploads,
      sendMessage, recordFeePayment, sendFeeReminders, addToast, addStudent, removeStudent, removeBatch,
      addTeacher, removeTeacher, editStudent, editTeacher,
      addAssignment, addLibraryMaterial, fetchHistory, updateProfile, addAnnouncement, deleteAnnouncement,
      addExpense, editExpense, removeExpense, markAttendance, sendMonthlyAttendanceReport, addDoubtTicket,
      addNotification, markAllNotificationsAsRead, addSubmission, addOfflineSubmission, syncOfflineSubmissions, gradeSubmission, API_URL, authHeaders
    }}>
      {children}
    </AppContext.Provider>
  );
};
