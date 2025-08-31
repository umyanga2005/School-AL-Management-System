// components/dashboard/Dashboard.jsx
import React from 'react';

const Dashboard = ({ currentUser }) => {
  // Sample dashboard data - you can replace with real data
  const stats = [
    { title: 'Total Students', value: '245', icon: '👨‍🎓', color: 'blue' },
    { title: 'Attendance Today', value: '92%', icon: '✅', color: 'green' },
    { title: 'Pending Tasks', value: '12', icon: '📋', color: 'yellow' },
    { title: 'New Messages', value: '5', icon: '✉️', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {currentUser.name || currentUser.username}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your school today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="text-blue-600">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Attendance submitted for Class 10A</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full">
              <span className="text-green-600">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">Math test scores updated</p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-full">
              <span className="text-purple-600">👨‍🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium">New student registered</p>
              <p className="text-xs text-gray-500">2 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-100 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-200 transition-colors">
            <span className="text-2xl block mb-2">📊</span>
            <span className="text-sm">Take Attendance</span>
          </button>
          <button className="bg-green-100 text-green-700 p-4 rounded-lg text-center hover:bg-green-200 transition-colors">
            <span className="text-2xl block mb-2">📝</span>
            <span className="text-sm">Enter Marks</span>
          </button>
          <button className="bg-yellow-100 text-yellow-700 p-4 rounded-lg text-center hover:bg-yellow-200 transition-colors">
            <span className="text-2xl block mb-2">📈</span>
            <span className="text-sm">View Reports</span>
          </button>
          <button className="bg-purple-100 text-purple-700 p-4 rounded-lg text-center hover:bg-purple-200 transition-colors">
            <span className="text-2xl block mb-2">👨‍🎓</span>
            <span className="text-sm">Student List</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;