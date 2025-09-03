// components/Dashboard.jsx - UPDATED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../../services/dashboardApi';

// Chart Components (unchanged from your original)
const PerformanceChart = ({ data, viewMode, role, selectedGrade, className }) => {
  if (!data || !data.terms) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-slate-500 text-sm">Loading performance data...</p>
        </div>
      </div>
    );
  }

  const chartData = data.terms.map(term => ({
    year: term.year,
    term1: term.term1,
    term2: term.term2,
    term3: term.term3
  }));

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="year" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#f8fafc'
            }}
            formatter={(value) => [
              viewMode === 'marks' ? `${value}%` : value.toFixed(2),
              viewMode === 'marks' ? 'Marks' : 'Z-Score'
            ]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="term1" 
            stroke="#6366f1" 
            strokeWidth={3}
            name="Term 1"
            dot={{ fill: '#6366f1', r: 6 }}
            activeDot={{ r: 8, fill: '#6366f1' }}
          />
          <Line 
            type="monotone" 
            dataKey="term2" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Term 2"
            dot={{ fill: '#10b981', r: 6 }}
            activeDot={{ r: 8, fill: '#10b981' }}
          />
          <Line 
            type="monotone" 
            dataKey="term3" 
            stroke="#f59e0b" 
            strokeWidth={3}
            name="Term 3"
            dot={{ fill: '#f59e0b', r: 6 }}
            activeDot={{ r: 8, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const TopSubjectsChart = ({ data, year, className }) => {
  if (!data) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-slate-500 text-sm">Loading subject data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="subject" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#f8fafc'
            }}
            formatter={(value) => [`${value}%`, 'Average Score']}
          />
          <Legend />
          <Bar 
            dataKey="average" 
            fill="url(#barGradient1)" 
            name="Average Score"
            radius={[6, 6, 0, 0]}
          />
          <Bar 
            dataKey="students" 
            fill="url(#barGradient2)" 
            name="Number of Students"
            radius={[6, 6, 0, 0]}
          />
          <defs>
            <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06d6a0" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// StatCard component
const StatCard = ({ icon, title, value, subtitle, gradient }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient}`}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
      <div className="text-6xl transform rotate-12">{icon}</div>
    </div>
    <div className="relative">
      <div className="flex items-center mb-2">
        <div className="text-2xl mr-3">{icon}</div>
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
    </div>
  </div>
);

// Main Dashboard Component
const Dashboard = ({ currentUser = { name: 'John Doe', role: 'admin' } }) => {
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
  const [systemStatus, setSystemStatus] = useState({
    api: 'checking',
    database: 'checking',
    storage: 'checking'
  });

  const performanceChartRef = useRef();
  const topSubjectsChartRef = useRef();

  useEffect(() => {
    loadDashboardData();
  }, [selectedGrade]); // Add selectedGrade as a dependency to re-fetch performance data when it changes

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Set system status to 'checking' at the start of data loading
      setSystemStatus({
        api: 'checking',
        database: 'checking',
        storage: 'checking'
      });
      
      // Load all dashboard data using the new dashboardApi
      const [
        statsResponse,
        performanceResponse,
        topSubjectsResponse,
        systemStatusResponse
      ] = await Promise.allSettled([
        dashboardApi.getDashboardStats(),
        dashboardApi.getPerformanceData(selectedGrade),
        dashboardApi.getTopSubjectsData(),
        dashboardApi.checkSystemStatus() // This will now be awaited properly
      ]);

      // Process stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setStats(statsResponse.value.data);
      }

      // Process performance data
      if (performanceResponse.status === 'fulfilled' && performanceResponse.value.success) {
        setPerformanceData(performanceResponse.value.data);
      }

      // Process top subjects data
      if (topSubjectsResponse.status === 'fulfilled' && topSubjectsResponse.value.success) {
        setTopSubjectsData(topSubjectsResponse.value.data);
      }

      // Process system status - this is the key part
      if (systemStatusResponse.status === 'fulfilled' && systemStatusResponse.value.success) {
        setSystemStatus(systemStatusResponse.value.data);
      } else {
        // If system status check fails, explicitly set to offline/inactive
        setSystemStatus({
          api: 'offline',
          database: 'inactive',
          storage: 0 // Or a default value
        });
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Ensure system status is set to offline if there's a general error
      setSystemStatus({
        api: 'offline',
        database: 'inactive',
        storage: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPerformance = async () => {
    try {
      // This would typically call an export API endpoint
      alert('Export functionality would be implemented here');
    } catch (error) {
      console.error('Error exporting performance data:', error);
      alert('Failed to export performance data: ' + error.message);
    }
  };

  const handleExportSubjects = async () => {
    try {
      // This would typically call an export API endpoint
      alert('Export functionality would be implemented here');
    } catch (error) {
      console.error('Error exporting subjects data:', error);
      alert('Failed to export subjects data: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Welcome back, {currentUser.name}! 👋
              </h1>
              <p className="text-slate-600 text-lg">
                {currentUser.role === 'admin' ? 'System Administrator' : 
                 currentUser.role === 'coordinator' ? 'Academic Coordinator' : 'Teacher'} • {stats.currentTerm}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  systemStatus.api === 'online' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span>System {systemStatus.api === 'online' ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="👨‍🎓"
            title="Total Students"
            value={stats.totalStudents}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon="✅"
            title="Attendance Today"
            value={stats.attendanceToday}
            subtitle="Students present today"
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard
            icon="📚"
            title="Total Subjects"
            value={stats.totalSubjects}
            gradient="bg-gradient-to-br from-purple-500 to-violet-600"
          />
          <StatCard
            icon="📅"
            title="Current Term"
            value={stats.currentTerm}
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Performance Chart */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Performance Analysis</h2>
                <p className="text-slate-600">Track student progress over time</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {['admin', 'coordinator'].includes(currentUser.role) && (
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="12">Grade 12</option>
                    <option value="13">Grade 13</option>
                  </select>
                )}

                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="marks">Total Marks</option>
                  <option value="zscore">Z-Scores</option>
                </select>
              </div>
            </div>

            <div ref={performanceChartRef}>
              <PerformanceChart
                data={performanceData}
                viewMode={viewMode}
                role={currentUser.role}
                selectedGrade={selectedGrade}
                className="h-80"
              />
            </div>
          </div>

          {/* Top Subjects Chart */}
          {currentUser.role !== 'teacher' && (
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Top Subjects</h2>
                  <p className="text-slate-600">Best performing subjects</p>
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {[2023, 2024, 2025].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                </div>
              </div>

              <div ref={topSubjectsChartRef}>
                <TopSubjectsChart
                  data={topSubjectsData}
                  year={selectedYear}
                  className="h-80"
                />
              </div>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl mr-4">
                  🌐
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">API Connectivity</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {systemStatus.api === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                systemStatus.api === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>

            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl mr-4">
                  🗄️
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Database</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {systemStatus.database === 'active' ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                systemStatus.database === 'active' ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
            </div>

            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl mr-4">
                  💾
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Storage Usage</p>
                  <p className="text-lg font-semibold text-slate-800">{systemStatus.storage}%</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-orange-200 rounded-full mr-2">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ width: `${systemStatus.storage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
