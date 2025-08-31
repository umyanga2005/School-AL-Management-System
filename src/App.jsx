// App.jsx
import React, { useState, useEffect } from 'react';

// Styles
import './App.css';

// Auth
import LoginForm from './components/auth/LoginForm';
import ChangePasswordForm from './components/auth/ChangePasswordForm';

// Layout
import Header from './components/layout/Header';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// AttendenceDashboards
import TeacherAttendenceDashboard from './components/Attendence/TeacherAttendenceDashboard';
import CoordinatorAttendenceDashboard from './components/Attendence/CoordinatorAttendenceDashboard';
import AdminAttendenceDashboard from './components/Attendence/AdminAttendenceDashboard';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleMenuClick = (menuKey) => {
    setActiveMenu(menuKey);
    setSidebarOpen(false); // Close mobile sidebar when menu item is clicked
  };

  // -------------------- Sidebar Menu --------------------
  const getMenuItems = () => {
    if (!currentUser) return [];

    let menuItems = [
      { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
      { key: 'attendance', label: 'Attendance', icon: '📊' }
    ];

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
        { key: 'reports', label: 'Reports', icon: '📈' },
      ];
    }

    // Coordinator menu items
    if (currentUser.role === 'coordinator') {
      menuItems = [
        ...menuItems,
        { key: 'reports', label: 'Reports', icon: '📈' },
      ];
    }

    return menuItems;
  };

  const renderDesktopSidebar = () => {
    const menuItems = getMenuItems();

    return (
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map(item => (
              <button
                key={item.key}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                  activeMenu === item.key 
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleMenuClick(item.key)}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {(currentUser.name || currentUser.username)?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser.name || currentUser.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomNav = () => {
    const menuItems = getMenuItems();
    
    // For mobile, we'll show only the most important items
    const mobileMenuItems = menuItems.filter(item => 
      ['dashboard', 'attendance', 'students', 'marks', 'reports'].includes(item.key)
    );

    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {mobileMenuItems.map(item => (
            <button
              key={item.key}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                activeMenu === item.key 
                  ? 'text-blue-600' 
                  : 'text-gray-600'
              }`}
              onClick={() => handleMenuClick(item.key)}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
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
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
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
        if (currentUser.role === 'admin') return (
          <AdminAttendenceDashboard
            currentUser={currentUser}
            teachers={teachers}
            setTeachers={setTeachers}
            attendanceRecords={attendanceRecords}
            selectedClass={selectedClass}
          />
        );
        if (currentUser.role === 'teacher') return (
          <TeacherAttendenceDashboard
            currentUser={currentUser}
            attendanceRecords={attendanceRecords}
            onAttendanceUpdate={handleAttendanceUpdate}
            selectedClass={selectedClass}
          />
        );
        if (currentUser.role === 'coordinator') return (
          <CoordinatorAttendenceDashboard
            attendanceRecords={attendanceRecords}
            selectedClass={selectedClass}
          />
        );
        return null;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  // -------------------- Main Render --------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'login' && (
        <div className="min-h-screen flex items-center justify-center">
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            loading={loading}
            setLoading={setLoading}
          />
        </div>
      )}

      {currentView === 'change-password' && (
        <div className="min-h-screen flex items-center justify-center">
          <ChangePasswordForm
            currentUser={currentUser}
            onPasswordChanged={handlePasswordChanged}
          />
        </div>
      )}

      {currentUser && currentView !== 'login' && currentView !== 'change-password' && (
        <>
          <Header 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="flex pt-16"> {/* pt-16 to account for fixed header */}
            {renderDesktopSidebar()}
            <div className="flex-1 lg:ml-0 overflow-hidden pb-16 lg:pb-0"> {/* pb-16 for mobile bottom nav */}
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                <div className="container mx-auto px-4 py-6">
                  {renderActivePage()}
                </div>
              </main>
              {selectedStudent && (
                <StudentDetails
                  student={selectedStudent}
                  onClose={() => setSelectedStudent(null)}
                  onUpdate={handleStudentUpdate}
                />
              )}
            </div>
            {renderMobileBottomNav()}
          </div>
        </>
      )}
    </div>
  );
};

export default App;