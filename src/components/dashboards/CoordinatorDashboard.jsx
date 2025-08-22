// components/dashboards/CoordinatorDashboard.jsx
import React, { useState } from 'react';
import { Filter, BarChart3, Users, Calendar } from 'lucide-react';
import { CLASSES, filters, statistics, formatters } from '../../utils';

const CoordinatorDashboard = ({ attendanceRecords }) => {
  const [filterState, setFilterState] = useState({ year: '', month: '', class: '' });

  const filteredRecords = filters.filterRecordsByDateAndClass(attendanceRecords, filterState);

  const clearFilters = () => {
    setFilterState({ year: '', month: '', class: '' });
  };

  const totalStudents = statistics.calculateTotalStudents(filteredRecords);
  const averagePerDay = statistics.calculateAveragePerDay(filteredRecords);

  return (
    <div className="dashboard-container">
      <div className="card">
        <div className="card-header">
          <Filter size={20} />
          <h2>Filter Attendance Records</h2>
        </div>
        
        <div className="filter-form">
          <div className="form-group">
            <label>Year</label>
            <input 
              type="text" 
              placeholder="e.g., 2024"
              value={filterState.year} 
              onChange={e => setFilterState({...filterState, year: e.target.value})}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          
          <div className="form-group">
            <label>Month</label>
            <input 
              type="text" 
              placeholder="e.g., 01-12"
              value={filterState.month} 
              onChange={e => setFilterState({...filterState, month: e.target.value})}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          
          <div className="form-group">
            <label>Class</label>
            <select value={filterState.class} onChange={e => setFilterState({...filterState, class: e.target.value})}>
              <option value="">All Classes</option>
              {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
            <button 
              onClick={clearFilters} 
              style={{ 
                background: '#6b7280', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Total Records</p>
                <p className="stat-value">{filteredRecords.length}</p>
              </div>
              <BarChart3 size={32} className="stat-icon blue" />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Total Students</p>
                <p className="stat-value">{totalStudents}</p>
              </div>
              <Users size={32} className="stat-icon green" />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Average per Day</p>
                <p className="stat-value">{averagePerDay}</p>
              </div>
              <Calendar size={32} className="stat-icon purple" />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Boys</th>
                <th>Girls</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.slice(0, 50).map(r => (
                <tr key={r.id}>
                  <td>{formatters.formatDate(r.date)}</td>
                  <td>{r.class}</td>
                  <td>{r.teacherName || r.teachername || 'Unknown'}</td>
                  <td>{r.boys}</td>
                  <td>{r.girls}</td>
                  <td className="total-cell">{r.total}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No records found matching your filters. Try adjusting your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredRecords.length > 50 && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
              Showing first 50 records of {filteredRecords.length} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;