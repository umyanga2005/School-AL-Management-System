// components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { studentApi, subjectApi, termApi, marksApi, reportApi } from '../../services';
import { useDebounce } from '../../hooks/useDebounce';
import PerformanceChart from './charts/PerformanceChart';
import TopSubjectsChart from './charts/TopSubjectsChart';
import { exportComponentAsPNG } from 'react-component-export-image';

const Dashboard = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceToday: 0,
    totalSubjects: 0,
    currentTerm: ''
  });
  const [performanceData, setPerformanceData] = useState(null);
  const [topSubjectsData, setTopSubjectsData] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('12');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('marks');
  const [attendanceData, setAttendanceData] = useState(null);

  const performanceChartRef = useRef();
  const topSubjectsChartRef = useRef();

  const debouncedYear = useDebounce(selectedYear, 500);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (performanceData) {
      loadPerformanceData();
    }
  }, [selectedGrade, viewMode, debouncedYear]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        loadTotalStudents(),
        loadAttendanceToday(),
        loadTotalSubjects(),
        loadCurrentTerm(),
        loadPerformanceData(),
        loadTopSubjectsData()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalStudents = async () => {
    try {
      const response = await studentApi.getStudents('', 1, 1);
      if (response.success) {
        setStats(prev => ({
          ...prev,
          totalStudents: response.data.totalCount || response.data.students?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error loading total students:', error);
    }
  };

  const loadAttendanceToday = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Simulate attendance data - replace with actual API call
      const mockAttendance = {
        date: today,
        present: Math.floor(stats.totalStudents * 0.92),
        absent: Math.floor(stats.totalStudents * 0.08),
        percentage: 92
      };
      
      setStats(prev => ({
        ...prev,
        attendanceToday: mockAttendance.percentage
      }));
      setAttendanceData(mockAttendance);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const loadTotalSubjects = async () => {
    try {
      const response = await subjectApi.getSubjects();
      if (response.success) {
        setStats(prev => ({
          ...prev,
          totalSubjects: response.data.subjects?.length || response.data.length || 0
        }));
      }
    } catch (error) {
      console.error('Error loading total subjects:', error);
    }
  };

  const loadCurrentTerm = async () => {
    try {
      const response = await termApi.getCurrentTerm();
      if (response.success && response.data) {
        setStats(prev => ({
          ...prev,
          currentTerm: response.data.name || `Term ${response.data.term_number}`
        }));
      }
    } catch (error) {
      console.error('Error loading current term:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Mock performance data - replace with actual API call
      const mockPerformanceData = {
        terms: [
          { year: 2023, term1: 75, term2: 82, term3: 78 },
          { year: 2024, term1: 80, term2: 85, term3: 88 }
        ],
        grade: selectedGrade,
        viewMode: viewMode
      };
      
      setPerformanceData(mockPerformanceData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const loadTopSubjectsData = async () => {
    if (currentUser.role === 'teacher') return;

    try {
      // Mock top subjects data - replace with actual API call
      const mockTopSubjects = [
        { subject: 'Mathematics', average: 85, students: 120 },
        { subject: 'Science', average: 82, students: 115 },
        { subject: 'English', average: 78, students: 110 },
        { subject: 'History', average: 75, students: 95 },
        { subject: 'Art', average: 88, students: 85 }
      ];
      
      setTopSubjectsData(mockTopSubjects);
    } catch (error) {
      console.error('Error loading top subjects data:', error);
    }
  };

  const handleDownloadPerformanceChart = () => {
    exportComponentAsPNG(performanceChartRef, {
      fileName: `performance-chart-${selectedGrade}-${viewMode}-${selectedYear}`
    });
  };

  const handleDownloadTopSubjectsChart = () => {
    exportComponentAsPNG(topSubjectsChartRef, {
      fileName: `top-subjects-${selectedYear}`
    });
  };

  const getRoleBasedTitle = () => {
    const roleTitles = {
      admin: 'System Administrator',
      coordinator: 'Academic Coordinator',
      teacher: 'Teacher'
    };
    
    return roleTitles[currentUser.role] || 'User';
  };

  const getTeacherClassInfo = () => {
    if (currentUser.role === 'teacher' && currentUser.assigned_class) {
      return ` • Class ${currentUser.assigned_class}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {currentUser.name || currentUser.username}!
        </h1>
        <p className="text-gray-600">
          {getRoleBasedTitle()}{getTeacherClassInfo()} • {stats.currentTerm}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Students */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        {/* Attendance Today */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Today</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.attendanceToday}%</p>
              {attendanceData && (
                <p className="text-xs text-gray-500">
                  {attendanceData.present} present • {attendanceData.absent} absent
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Total Subjects */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
            </div>
          </div>
        </div>

        {/* Current Term */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Term</p>
              <p className="text-lg font-bold text-gray-900">{stats.currentTerm}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <h2 className="text-lg font-bold text-gray-800">Student Performance Analysis</h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Grade Selector */}
            {['admin', 'coordinator'].includes(currentUser.role) && (
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12">Grade 12</option>
                <option value="13">Grade 13</option>
              </select>
            )}

            {/* View Mode Toggle */}
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="marks">Total Marks</option>
              <option value="zscore">Z-Scores</option>
            </select>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Download Button */}
            <button
              onClick={handleDownloadPerformanceChart}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              📥 Download
            </button>
          </div>
        </div>

        <div ref={performanceChartRef}>
          <PerformanceChart
            data={performanceData}
            viewMode={viewMode}
            role={currentUser.role}
            selectedGrade={selectedGrade}
            className="h-64 md:h-80"
          />
        </div>
      </div>

      {/* Top Subjects Chart */}
      {currentUser.role !== 'teacher' && (
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
            <h2 className="text-lg font-bold text-gray-800">Top 5 Subjects Performance</h2>
            
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <button
                onClick={handleDownloadTopSubjectsChart}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                📥 Download
              </button>
            </div>
          </div>

          <div ref={topSubjectsChartRef}>
            <TopSubjectsChart
              data={topSubjectsData}
              year={selectedYear}
              className="h-64 md:h-80"
            />
          </div>
        </div>
      )}

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="text-blue-600">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Marks updated for Mathematics</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-full">
                <span className="text-green-600">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Attendance submitted</p>
                <p className="text-xs text-gray-500">Today at 10:30 AM</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Connectivity</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Storage</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">78% Used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;