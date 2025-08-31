// components/dashboards/TeacherDashboard.jsx
import React, { useState } from 'react';
import { Plus, Calendar, Save } from 'lucide-react';
import apiService from '../../services/api';
import { getSriLankaDate, CLASSES, validators, filters, formatters } from '../../utils';

const TeacherDashboard = ({ currentUser, attendanceRecords, onAttendanceUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    date: getSriLankaDate(),
    class: currentUser?.assignedClass || '',
    boys: '',
    girls: ''
  });

  const handleSubmitAttendance = async () => {
    if (!attendanceForm.boys || !attendanceForm.girls || !attendanceForm.class) {
      alert('Please fill in all fields');
      return;
    }

    const boys = parseInt(attendanceForm.boys);
    const girls = parseInt(attendanceForm.girls);
    
    if (!validators.isValidStudentCount(boys) || !validators.isValidStudentCount(girls)) {
      alert('Student counts cannot be negative');
      return;
    }

    const total = boys + girls;

    setLoading(true);
    try {
      const attendanceData = {
        date: getSriLankaDate(), // Always use current Sri Lanka date
        class: attendanceForm.class,
        boys,
        girls,
        total,
        teacherId: currentUser.id,
        teacherName: currentUser.name
      };

      const result = await apiService.createAttendance(currentUser.token, attendanceData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh attendance records after adding new one
      const recordsResult = await apiService.getAttendance(currentUser.token);
      if (recordsResult.success) {
        onAttendanceUpdate(recordsResult.data.records || []);
      }

      setAttendanceForm({ 
        date: getSriLankaDate(), 
        class: currentUser.assignedClass, 
        boys: '', 
        girls: '' 
      });
      alert('Attendance recorded successfully!');
    } catch (err) {
      console.error('Submit attendance error:', err);
      alert(err.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Filter teacher's own records with proper ID comparison
  const myRecords = filters.filterRecordsByTeacher(attendanceRecords, currentUser.id);

  console.log(`📊 Total records: ${attendanceRecords.length}, Teacher's records: ${myRecords.length}`);

  return (
    <div className="dashboard-container">
      <div className="card">
        <div className="card-header">
          <Plus size={20} />
          <h2>Record Daily Attendance</h2>
        </div>
        
        <div className="attendance-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date (Sri Lanka Time)</label>
              <input 
                type="date" 
                value={attendanceForm.date} 
                disabled={true}
                style={{ 
                  backgroundColor: '#f3f4f6', 
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                Date is automatically set to today's date in Sri Lanka time
              </small>
            </div>
            
            <div className="form-group">
              <label>Class</label>
              <select 
                value={attendanceForm.class} 
                onChange={e => setAttendanceForm({...attendanceForm, class: e.target.value})}
              >
                <option value="">Select Class</option>
                {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Boys Count</label>
              <input 
                type="number" 
                min="0" 
                value={attendanceForm.boys} 
                onChange={e => setAttendanceForm({...attendanceForm, boys: e.target.value})}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            
            <div className="form-group">
              <label>Girls Count</label>
              <input 
                type="number" 
                min="0" 
                value={attendanceForm.girls} 
                onChange={e => setAttendanceForm({...attendanceForm, girls: e.target.value})}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>
          
          <div className="form-footer">
            <div className="total-count">
              Total: {(parseInt(attendanceForm.boys) || 0) + (parseInt(attendanceForm.girls) || 0)} students
            </div>
            <button onClick={handleSubmitAttendance} disabled={loading} className="save-btn">
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <Calendar size={20} />
          <h2>My Recent Records ({myRecords.length})</h2>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Boys</th>
                <th>Girls</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {myRecords.slice(0, 20).map(r => (
                <tr key={r.id}>
                  <td>{formatters.formatDate(r.date)}</td>
                  <td>{r.class}</td>
                  <td>{r.boys}</td>
                  <td>{r.girls}</td>
                  <td className="total-cell">{r.total}</td>
                </tr>
              ))}
              {myRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No attendance records found for your account. Use the form above to record attendance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {myRecords.length > 20 && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
              Showing first 20 records of {myRecords.length} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;