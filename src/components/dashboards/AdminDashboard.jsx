// components/dashboards/AdminDashboard.jsx
import React, { useState } from 'react';
import { User, Users, BarChart3, Edit, X } from 'lucide-react';
import apiService from '../../services/api';
import { CLASSES, validators, formatters, statistics } from '../../utils';

const AdminDashboard = ({ currentUser, teachers, setTeachers, attendanceRecords }) => {
  const [loading, setLoading] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', username: '', assignedClass: '' });
  const [newCoordinator, setNewCoordinator] = useState({ name: '', username: '' });
  const [editTeacher, setEditTeacher] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.username || !newTeacher.assignedClass) {
      alert('Please fill in all fields');
      return;
    }

    if (!validators.isValidName(newTeacher.name)) {
      alert('Teacher name must be at least 2 characters long');
      return;
    }

    if (!validators.isValidUsername(newTeacher.username)) {
      alert('Username must be at least 3 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const teacherData = {
        ...newTeacher, 
        username: formatters.sanitizeUsername(newTeacher.username),
        role: 'teacher'
      };

      const result = await apiService.createUser(currentUser.token, teacherData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setTeachers([...teachers, result.data.user]);
      setNewTeacher({ name: '', username: '', assignedClass: '' });
      alert('Teacher added successfully!');
    } catch (err) {
      console.error('Add teacher error:', err);
      alert(err.message || 'Failed to add teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditTeacher({ ...teacher });
    setShowEditModal(true);
  };

  const handleUpdateTeacherClass = async () => {
    if (!editTeacher.assignedClass) {
      alert('Please select a class');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.updateUserClass(
        currentUser.token, 
        editTeacher.id, 
        { assignedClass: editTeacher.assignedClass }
      );
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update teachers list
      setTeachers(teachers.map(t => 
        t.id === editTeacher.id 
          ? { ...t, assignedClass: editTeacher.assignedClass }
          : t
      ));

      setShowEditModal(false);
      setEditTeacher(null);
      alert('Teacher class updated successfully!');
    } catch (err) {
      console.error('Update teacher error:', err);
      alert(err.message || 'Failed to update teacher class');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoordinator = async () => {
    if (!newCoordinator.name || !newCoordinator.username) {
      alert('Please fill in all fields');
      return;
    }

    if (!validators.isValidName(newCoordinator.name)) {
      alert('Coordinator name must be at least 2 characters long');
      return;
    }

    if (!validators.isValidUsername(newCoordinator.username)) {
      alert('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);
    try {
      const coordinatorData = { 
        ...newCoordinator,
        username: formatters.sanitizeUsername(newCoordinator.username),
        role: 'coordinator',
        temp_password: true,
        password: formatters.generateTempPassword()
      };

      const result = await apiService.createUser(currentUser.token, coordinatorData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Coordinator added successfully!');
      setNewCoordinator({ name: '', username: '' });
    } catch (err) {
      console.error('Add coordinator error:', err);
      alert(err.message || 'Failed to add coordinator');
    } finally {
      setLoading(false);
    }
  };

  const totalRecords = attendanceRecords.length;
  const totalStudentsRecorded = statistics.calculateTotalStudents(attendanceRecords);

  return (
    <div className="dashboard-container">
      {/* System Overview Card */}
      <div className="card">
        <div className="card-header">
          <BarChart3 size={20} />
          <h2>System Overview</h2>
        </div>
        <div className="overview-stats">
          <div className="overview-item">
            <span className="overview-label">Total Teachers</span>
            <span className="overview-value">{teachers.length}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Total Records</span>
            <span className="overview-value">{totalRecords}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Students Recorded</span>
            <span className="overview-value">{totalStudentsRecorded}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Classes Available</span>
            <span className="overview-value">{CLASSES.length}</span>
          </div>
        </div>
      </div>

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                Edit Teacher Class
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditTeacher(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#6b7280'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                <strong>Teacher:</strong> {editTeacher?.name}
              </p>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
                <strong>Current Class:</strong> {editTeacher?.assignedClass}
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                New Assigned Class
              </label>
              <select
                value={editTeacher?.assignedClass || ''}
                onChange={e => setEditTeacher({...editTeacher, assignedClass: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select Class</option>
                {CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditTeacher(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeacherClass}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-grid">
        {/* Add Teacher Card */}
        <div className="card">
          <div className="card-header">
            <User size={20} />
            <h2>Add New Teacher</h2>
          </div>
          <div className="form-container">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Enter teacher's full name"
                value={newTeacher.name} 
                onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter unique username"
                value={newTeacher.username} 
                onChange={e => setNewTeacher({...newTeacher, username: formatters.sanitizeUsername(e.target.value)})}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>Assigned Class</label>
              <select value={newTeacher.assignedClass} onChange={e => setNewTeacher({...newTeacher, assignedClass: e.target.value})}>
                <option value="">Select Class</option>
                {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <button onClick={handleAddTeacher} disabled={loading} className="add-btn">
              {loading ? 'Adding...' : 'Add Teacher'}
            </button>
          </div>
        </div>

        {/* Current Teachers Card */}
        <div className="card">
          <div className="card-header">
            <Users size={20} />
            <h2>Current Teachers ({teachers.length})</h2>
          </div>
          <div className="teachers-list">
            {teachers.map(t => (
              <div key={t.id} className="teacher-item">
                <div className="teacher-info">
                  <h3>{t.name}</h3>
                  <p><strong>Username:</strong> {t.username}</p>
                  <p><strong>Class:</strong> {t.assignedClass}</p>
                  <p><strong>Status:</strong> <span style={{ color: t.tempPassword ? '#dc2626' : '#16a34a' }}>
                    {t.tempPassword ? 'Temporary Password' : 'Active'}
                  </span></p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => handleEditTeacher(t)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Edit size={16} />
                    Edit Class
                  </button>
                </div>
              </div>
            ))}
            {teachers.length === 0 && (
              <div className="empty-state">
                No teachers added yet. Use the form above to add teachers to the system.
              </div>
            )}
          </div>
        </div>

        {/* Add Coordinator Card */}
        <div className="card">
          <div className="card-header">
            <User size={20} />
            <h2>Add New Coordinator</h2>
          </div>
          <div className="form-container">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={newCoordinator.name} 
                onChange={e => setNewCoordinator({...newCoordinator, name: e.target.value})} 
                placeholder="Enter coordinator's full name"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={newCoordinator.username} 
                onChange={e => setNewCoordinator({...newCoordinator, username: formatters.sanitizeUsername(e.target.value)})} 
                placeholder="Enter unique username"
              />
            </div>
            <button onClick={handleAddCoordinator} className="add-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Coordinator'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;