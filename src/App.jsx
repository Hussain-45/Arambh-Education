import React, { useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Messages from './pages/Messages';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import ClassDetails from './pages/ClassDetails';
import StudentDashboard from './pages/StudentDashboard';
import StudentAttendance from './pages/StudentAttendance';
import StudentReceipts from './pages/StudentReceipts';
import TeacherDashboard from './pages/TeacherDashboard';
import Assignments from './pages/Assignments';
import CalendarView from './pages/CalendarView';
import Library from './pages/Library';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import History from './pages/History';
import ProfitLoss from './pages/ProfitLoss';
import { AppProvider, AppContext } from './context/AppContext';
import ToastContainer from './components/Toast';
import Chatbot from './components/Chatbot';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherAssignments from './pages/TeacherAssignments';
import MyBatches from './pages/MyBatches';
import Quizzes from './pages/Quizzes';
import StudyCompanion from './pages/StudyCompanion';
import SyllabusTracker from './pages/SyllabusTracker';
import Flashcards from './pages/Flashcards';
import Leaderboard from './pages/Leaderboard';
import StudyPlanner from './pages/StudyPlanner';
import BatchChat from './pages/BatchChat';

// Admin Protected Route
const AdminRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useContext(AppContext);
  if (!isAuthenticated || userRole !== 'admin') return <Navigate to="/login" replace />;
  return children;
};

// Student Protected Route
const StudentRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useContext(AppContext);
  if (!isAuthenticated || userRole !== 'student') return <Navigate to="/login" replace />;
  return children;
};

// Teacher Protected Route
const TeacherRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useContext(AppContext);
  if (!isAuthenticated || userRole !== 'teacher') return <Navigate to="/login" replace />;
  return children;
};

// General Protected Route (Admin OR Student OR Teacher)
const AuthRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole } = useContext(AppContext);
  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(userRole))) return <Navigate to="/login" replace />;
  return children;
};

// Main App Layout Wrapper
const AppLayout = () => {
  const { isAuthenticated, userRole } = useContext(AppContext);
  
  const getDashboardRoute = () => {
    if (userRole === 'admin') return '/dashboard';
    if (userRole === 'teacher') return '/teacher-dashboard';
    return '/student-dashboard';
  };

  return (
    <div className="app-container">
      <ToastContainer />
      <Chatbot />
      <Routes>
        <Route path="/login" element={
          isAuthenticated 
            ? <Navigate to={getDashboardRoute()} replace /> 
            : <Login />
        } />
        
        {/* Admin Routes */}
        <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/teachers" element={<AdminRoute><Teachers /></AdminRoute>} />
        <Route path="/profit-loss" element={<AdminRoute><ProfitLoss /></AdminRoute>} />
        <Route path="/attendance" element={<AuthRoute allowedRoles={['admin', 'teacher']}>{userRole === 'teacher' ? <TeacherAttendance /> : <Attendance />}</AuthRoute>} />
        <Route path="/fees" element={<AdminRoute><Fees /></AdminRoute>} />
        <Route path="/messages" element={<AuthRoute allowedRoles={['admin', 'teacher']}><Messages /></AuthRoute>} />
        <Route path="/students" element={<AdminRoute><Students /></AdminRoute>} />
        <Route path="/classes" element={<AuthRoute allowedRoles={['admin', 'teacher']}>{userRole === 'teacher' ? <MyBatches /> : <Classes />}</AuthRoute>} />
        <Route path="/classes/:id" element={<AuthRoute allowedRoles={['admin', 'teacher']}>{userRole === 'teacher' ? <MyBatches /> : <ClassDetails />}</AuthRoute>} />
        <Route path="/history" element={<AdminRoute><History /></AdminRoute>} />
        
        {/* Student Routes */}
        <Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/student-attendance" element={<StudentRoute><StudentAttendance /></StudentRoute>} />
        <Route path="/student-receipts" element={<StudentRoute><StudentReceipts /></StudentRoute>} />

        {/* Teacher Routes */}
        <Route path="/teacher-dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        
        {/* Shared Routes (Internal component handles role UI differences) */}
        <Route path="/assignments" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}>{userRole === 'teacher' ? <TeacherAssignments /> : <Assignments />}</AuthRoute>} />
        <Route path="/calendar" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><CalendarView /></AuthRoute>} />
        <Route path="/library" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><Library /></AuthRoute>} />
        <Route path="/requests" element={<AuthRoute allowedRoles={['admin']}><Requests /></AuthRoute>} />
        <Route path="/settings" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><Settings /></AuthRoute>} />
        
        {/* New Features Routes */}
        <Route path="/quizzes" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><Quizzes /></AuthRoute>} />
        <Route path="/study-companion" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><StudyCompanion /></AuthRoute>} />
        <Route path="/syllabus" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><SyllabusTracker /></AuthRoute>} />
        <Route path="/flashcards" element={<StudentRoute><Flashcards /></StudentRoute>} />
        <Route path="/leaderboard" element={<StudentRoute><Leaderboard /></StudentRoute>} />
        <Route path="/study-planner" element={<StudentRoute><StudyPlanner /></StudentRoute>} />
        <Route path="/batch-chat" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><BatchChat /></AuthRoute>} />

        <Route path="*" element={<Navigate to={isAuthenticated ? getDashboardRoute() : "/login"} replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppLayout />
      </Router>
    </AppProvider>
  );
}

export default App;
