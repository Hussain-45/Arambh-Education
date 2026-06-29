import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Messages from './pages/Messages';
import Students from './pages/Students';
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
        <Route path="/profit-loss" element={<AdminRoute><ProfitLoss /></AdminRoute>} />
        <Route path="/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
        <Route path="/fees" element={<AdminRoute><Fees /></AdminRoute>} />
        <Route path="/messages" element={<AdminRoute><Messages /></AdminRoute>} />
        <Route path="/students" element={<AdminRoute><Students /></AdminRoute>} />
        <Route path="/classes" element={<AdminRoute><Classes /></AdminRoute>} />
        <Route path="/classes/:id" element={<AdminRoute><ClassDetails /></AdminRoute>} />
        <Route path="/history" element={<AdminRoute><History /></AdminRoute>} />
        
        {/* Student Routes */}
        <Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/student-attendance" element={<StudentRoute><StudentAttendance /></StudentRoute>} />
        <Route path="/student-receipts" element={<StudentRoute><StudentReceipts /></StudentRoute>} />

        {/* Teacher Routes */}
        <Route path="/teacher-dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        
        {/* Shared Routes (Internal component handles role UI differences) */}
        <Route path="/assignments" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><Assignments /></AuthRoute>} />
        <Route path="/calendar" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><CalendarView /></AuthRoute>} />
        <Route path="/library" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><Library /></AuthRoute>} />
        <Route path="/requests" element={<AuthRoute allowedRoles={['admin']}><Requests /></AuthRoute>} />
        <Route path="/settings" element={<AuthRoute allowedRoles={['admin', 'teacher', 'student']}><Settings /></AuthRoute>} />

        <Route path="*" element={<Navigate to={isAuthenticated ? getDashboardRoute() : "/login"} replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <AppLayout />
      </Router>
    </AppProvider>
  );
}

export default App;
