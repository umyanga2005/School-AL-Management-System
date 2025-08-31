// components/dashboard/charts/PerformanceChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ data, viewMode, role, selectedGrade, className }) => {
  if (!data || !data.terms) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading performance data...</p>
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
    <div className={`bg-white rounded-lg ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Academic Year', position: 'insideBottom', offset: -5 }} 
          />
          <YAxis 
            label={{ 
              value: viewMode === 'marks' ? 'Average Marks' : 'Z-Score', 
              angle: -90, 
              position: 'insideLeft' 
            }} 
          />
          <Tooltip 
            formatter={(value) => [
              viewMode === 'marks' ? `${value}%` : value.toFixed(2),
              viewMode === 'marks' ? 'Marks' : 'Z-Score'
            ]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="term1" 
            stroke="#8884d8" 
            strokeWidth={2}
            name="Term 1"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="term2" 
            stroke="#82ca9d" 
            strokeWidth={2}
            name="Term 2"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="term3" 
            stroke="#ffc658" 
            strokeWidth={2}
            name="Term 3"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          {viewMode === 'marks' ? 'Average Marks' : 'Z-Scores'} for {
            role === 'teacher' ? 'Your Class' : `Grade ${selectedGrade}`
          }
        </p>
      </div>
    </div>
  );
};

export default PerformanceChart;