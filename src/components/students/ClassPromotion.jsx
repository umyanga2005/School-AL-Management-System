// src/components/students/ClassPromotion.jsx
import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/studentApi';

const ClassPromotion = ({ onClose, onPromote }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fromClass) {
      loadStudents();
    }
  }, [fromClass]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getStudents(fromClass);
      setStudents(response.data.students);
      setSelectedStudents(response.data.students.map(s => s.id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId, isSelected) => {
    setSelectedStudents(prev => 
      isSelected 
        ? [...prev, studentId]
        : prev.filter(id => id !== studentId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedStudents(isSelected ? students.map(s => s.id) : []);
  };

  const handlePromote = async () => {
    if (!fromClass || !toClass || selectedStudents.length === 0) {
      setError('Please select classes and at least one student');
      return;
    }

    try {
      setLoading(true);
      await studentApi.promoteStudents({
        studentIds: selectedStudents,
        fromClass,
        toClass,
        academicYear
      });
      
      alert(`Successfully promoted ${selectedStudents.length} students from ${fromClass} to ${toClass}`);
      if (onPromote) onPromote();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to promote students');
    } finally {
      setLoading(false);
    }
  };

  const classOptions = ['12A1', '12A2', '13A1', '13A2'];

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Class Promotion</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="promotion-controls">
          <div className="form-group">
            <label>From Class</label>
            <select 
              value={fromClass} 
              onChange={(e) => setFromClass(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Class</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>To Class</label>
            <select 
              value={toClass} 
              onChange={(e) => setToClass(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Class</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Academic Year</label>
            <input
              type="number"
              value={academicYear}
              onChange={(e) => setAcademicYear(parseInt(e.target.value))}
              min="2000"
              max="2030"
            />
          </div>
        </div>

        {fromClass && (
          <div className="students-list">
            <div className="list-header">
              <h4>Students in {fromClass} ({students.length})</h4>
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={loading}
                />
                Select All
              </label>
            </div>

            <div className="students-checkboxes">
              {students.map(student => (
                <label key={student.id} className="student-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                    disabled={loading}
                  />
                  <span className="student-name">{student.name}</span>
                  <span className="student-index">({student.index_number})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button 
            onClick={handlePromote} 
            disabled={loading || selectedStudents.length === 0}
            className="btn-primary"
          >
            {loading ? 'Promoting...' : `Promote ${selectedStudents.length} Students`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassPromotion;