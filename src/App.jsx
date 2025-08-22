// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

// Import components
import LoginForm from './components/auth/LoginForm';
import ChangePasswordForm from './components/auth/ChangePasswordForm';
import Header from './components/layout/Header';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import CoordinatorDashboard from './components/dashboards/CoordinatorDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

// Import services and utilities
import apiService from './services/api';
import { sessionStorage } from './utils';

const AttendanceApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Session persistence - Load user from localStorage on app start
  useEffect(() => {
    const savedSession = sessionStorage.getUser();
    
    if (savedSession) {
      const { user, token } = savedSession;
      
      // Verify token is still valid
      apiService.verifyToken(token)
        .then(result => {
          if (result.success) {
            setCurrentUser({...user, token});
            setCurrentView(user.role);
            console.log('Session restored for:', user.username);
          } else {
            // Token invalid, clear storage
            sessionStorage.clearUser();
            console.log('Invalid session, cleared storage');
          }
        })
        .catch(() => {
          // Error verifying, clear storage
          sessionStorage.clearUser();
          console.log('Error verifying session, cleared storage');
        });
    }
  }, []);

  // Save user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      sessionStorage.saveUser(currentUser);
    } else {
      sessionStorage.clearUser();
    }
  }, [currentUser]);

  // Fetch data when user logs in
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Admin: fetch teachers
        if (currentUser.role === 'admin') {
          const result = await apiService.getUsers(currentUser.token);
          if (result.success) {
            setTeachers(result.data.users || []);
          }
        }

        // Fetch attendance records
        const attendanceResult = await apiService.getAttendance(currentUser.token);
        if (attendanceResult.success) {
          console.log('📊 Fetched attendance records:', attendanceResult.data.records?.length || 0);
          console.log('👤 Current user ID:', currentUser.id, 'Type:', typeof currentUser.id);
          
          // Debug: Log sample records to understand data structure
          if (attendanceResult.data.records && attendanceResult.data.records.length > 0) {
            console.log('📋 Sample attendance record:', JSON.stringify(attendanceResult.data.records[0], null, 2));
          }
          
          setAttendanceRecords(attendanceResult.data.records || []);
        } else {
          console.error('Failed to fetch attendance records:', attendanceResult.error);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        // Don't show alert for data fetch failures, just log them
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Handle login success
  const handleLoginSuccess = (user, view) => {
    setCurrentUser(user);
    setCurrentView(view);
  };

  // Handle password change success
  const handlePasswordChanged = (updatedUser, view) => {
    setCurrentUser(updatedUser);
    setCurrentView(view);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setAttendanceRecords([]);
    setTeachers([]);
  };

  // Handle attendance records update
  const handleAttendanceUpdate = (newRecords) => {
    setAttendanceRecords(newRecords);
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
      
      {currentUser && currentView === 'teacher' && (
        <>
          <Header 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <div className="main-content">
            <TeacherDashboard 
              currentUser={currentUser}
              attendanceRecords={attendanceRecords}
              onAttendanceUpdate={handleAttendanceUpdate}
            />
          </div>
        </>
      )}
      
      {currentUser && currentView === 'coordinator' && (
        <>
          <Header 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <div className="main-content">
            <CoordinatorDashboard 
              attendanceRecords={attendanceRecords}
            />
          </div>
        </>
      )}
      
      {currentUser && currentView === 'admin' && (
        <>
          <Header 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <div className="main-content">
            <AdminDashboard 
              currentUser={currentUser}
              teachers={teachers}
              setTeachers={setTeachers}
              attendanceRecords={attendanceRecords}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceApp;