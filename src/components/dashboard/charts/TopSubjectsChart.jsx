// components/dashboard/charts/TopSubjectsChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TopSubjectsChart = ({ data, year, className }) => {
  if (!data) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading subject data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="subject" />
          <YAxis label={{ value: 'Average Score', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Average Score']}
          />
          <Legend />
          <Bar 
            dataKey="average" 
            fill="#8884d8" 
            name="Average Score"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="students" 
            fill="#82ca9d" 
            name="Number of Students"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          Top 5 Subjects Performance - Academic Year {year}
        </p>
      </div>
    </div>
  );
};

export default TopSubjectsChart;