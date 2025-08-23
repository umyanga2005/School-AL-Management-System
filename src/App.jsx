// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

// Auth
import LoginForm from './components/auth/LoginForm';
import ChangePasswordForm from './components/auth/ChangePasswordForm';

// Layout
import Header from './components/layout/Header';

// Dashboards
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import CoordinatorDashboard from './components/dashboards/CoordinatorDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

// Student Management
import StudentList from './components/students/StudentList';
import StudentDetails from './components/students/StudentDetails';

// Subject Management
import SubjectList from './components/subjects/SubjectList';

// Term Management
import TermManagement from './components/terms/TermManagement';

// Marks Management
import MarksEntry from './components/marks/MarksEntry';

// Reports
import ClassReport from './components/reports/ClassReport';

// Utils
import apiService from './services/api';
import { sessionStorage, CLASSES } from './utils';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedClass, setSelectedClass] = useState(CLASSES[0] || '');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // -------------------- Session Persistence --------------------
  useEffect(() => {
    const savedSession = sessionStorage.getUser();

    if (savedSession) {
      const { user, token } = savedSession;
      
      // Store token in localStorage for API calls
      localStorage.setItem('token', token);
      
      apiService.verifyToken(token)
        .then(result => {
          if (result.success) {
            setCurrentUser({ ...user, token });
            setCurrentView(user.role);
          } else {
            sessionStorage.clearUser();
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          sessionStorage.clearUser();
          localStorage.removeItem('token');
        });
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.saveUser(currentUser);
      localStorage.setItem('token', currentUser.token);
    } else {
      sessionStorage.clearUser();
      localStorage.removeItem('token');
    }
  }, [currentUser]);

  // -------------------- Fetch Data --------------------
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (currentUser.role === 'admin') {
          const result = await apiService.getUsers(currentUser.token);
          if (result.success) setTeachers(result.data.users || []);
        }

        const attendanceResult = await apiService.getAttendance(currentUser.token);
        if (attendanceResult.success) {
          setAttendanceRecords(attendanceResult.data.records || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // -------------------- Handlers --------------------
  const handleLoginSuccess = (user, view) => {
    setCurrentUser(user);
    setCurrentView(view);
    setActiveMenu('dashboard');
  };

  const handlePasswordChanged = (updatedUser, view) => {
    setCurrentUser(updatedUser);
    setCurrentView(view);
    setActiveMenu('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setAttendanceRecords([]);
    setTeachers([]);
    setActiveMenu('dashboard');
    setSelectedStudent(null);
    sessionStorage.clearUser();
    localStorage.removeItem('token');
  };

  const handleAttendanceUpdate = (newRecords) => {
    setAttendanceRecords(newRecords);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleStudentUpdate = () => {
    setSelectedStudent(null);
    // Refresh student data if needed
  };

  // -------------------- Sidebar Menu --------------------
  const renderSidebar = () => {
    if (!currentUser) return null;

    let menuItems = [{ key: 'dashboard', label: 'Dashboard', icon: '📊' }];

    // Admin menu items
    if (currentUser.role === 'admin') {
      menuItems = [
        ...menuItems,
        { key: 'students', label: 'Students', icon: '👨‍🎓' },
        { key: 'subjects', label: 'Subjects', icon: '📚' },
        { key: 'terms', label: 'Terms', icon: '📅' },
        { key: 'marks', label: 'Marks', icon: '📝' },
        { key: 'reports', label: 'Reports', icon: '📈' },
      ];
    }

    // Teacher menu items
    if (currentUser.role === 'teacher') {
      menuItems = [
        ...menuItems,
        { key: 'marks', label: 'Marks Entry', icon: '📝' },
        { key: 'attendance', label: 'Attendance', icon: '✅' },
      ];
    }

    // Coordinator menu items
    if (currentUser.role === 'coordinator') {
      menuItems = [
        ...menuItems,
        { key: 'reports', label: 'Reports', icon: '📈' },
        { key: 'attendance', label: 'Attendance', icon: '✅' },
      ];
    }

    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Menu</h2>
          {CLASSES.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="class-dropdown"
            >
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}
        </div>
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.key}
              className={activeMenu === item.key ? 'active' : ''}
              onClick={() => setActiveMenu(item.key)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-role">{currentUser.role}</span>
            <span className="user-name">{currentUser.name || currentUser.username}</span>
          </div>
        </div>
      </div>
    );
  };

  // -------------------- Render Active Page --------------------
  const renderActivePage = () => {
    const commonProps = { 
      currentUser, 
      selectedClass,
      token: currentUser?.token 
    };

    switch (activeMenu) {
      case 'students':
        return <StudentList onStudentSelect={handleStudentSelect} />;
      case 'subjects':
        return <SubjectList />;
      case 'terms':
        return <TermManagement />;
      case 'marks':
        return <MarksEntry />;
      case 'reports':
        return <ClassReport {...commonProps} />;
      case 'attendance':
        // This would be your existing attendance component
        return currentUser.role === 'teacher' ? (
          <TeacherDashboard
            currentUser={currentUser}
            attendanceRecords={attendanceRecords}
            onAttendanceUpdate={handleAttendanceUpdate}
            selectedClass={selectedClass}
          />
        ) : (
          <CoordinatorDashboard
            attendanceRecords={attendanceRecords}
            selectedClass={selectedClass}
          />
        );
      default:
        if (currentUser.role === 'admin') return (
          <AdminDashboard
            currentUser={currentUser}
            teachers={teachers}
            setTeachers={setTeachers}
            attendanceRecords={attendanceRecords}
            selectedClass={selectedClass}
          />
        );
        if (currentUser.role === 'teacher') return (
          <TeacherDashboard
            currentUser={currentUser}
            attendanceRecords={attendanceRecords}
            onAttendanceUpdate={handleAttendanceUpdate}
            selectedClass={selectedClass}
          />
        );
        if (currentUser.role === 'coordinator') return (
          <CoordinatorDashboard
            attendanceRecords={attendanceRecords}
            selectedClass={selectedClass}
          />
        );
        return null;
    }
  };

  // -------------------- Main Render --------------------
  return (
    <div className="app-container">
      {currentView === 'login' && (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {currentView === 'change-password' && (
        <ChangePasswordForm
          currentUser={currentUser}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {currentUser && currentView !== 'login' && currentView !== 'change-password' && (
        <>
          <Header currentUser={currentUser} onLogout={handleLogout} />
          <div className="dashboard-container">
            {renderSidebar()}
            <div className="main-content">
              {renderActivePage()}
              {selectedStudent && (
                <StudentDetails
                  student={selectedStudent}
                  onClose={() => setSelectedStudent(null)}
                  onUpdate={handleStudentUpdate}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;