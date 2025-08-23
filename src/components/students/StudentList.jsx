// src/components/students/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/studentApi';
import StudentForm from './StudentForm';
import StudentDetails from './StudentDetails';
import ClassPromotion from './ClassPromotion';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPromotion, setShowPromotion] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [classFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getStudents(classFilter);
      setStudents(response.data.students);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (studentData) => {
    try {
      await studentApi.createStudent(studentData);
      setShowForm(false);
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await studentApi.deleteStudent(id);
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete student');
    }
  };

  if (loading) return <div className="loading">Loading students...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="student-management">
      <div className="page-header">
        <h2>Student Management</h2>
        <div className="header-actions">
          <select 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
            className="class-filter"
          >
            <option value="">All Classes</option>
            <option value="12A1">12A1</option>
            <option value="12A2">12A2</option>
            <option value="13A1">13A1</option>
            <option value="13A2">13A2</option>
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Add Student
          </button>
          <button onClick={() => setShowPromotion(true)} className="btn-secondary">
            Class Promotion
          </button>
        </div>
      </div>

      {showForm && (
        <StudentForm
          onSubmit={handleCreateStudent}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showPromotion && (
        <ClassPromotion
          onClose={() => setShowPromotion(false)}
          onPromote={loadStudents}
        />
      )}

      {selectedStudent && (
        <StudentDetails
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdate={loadStudents}
        />
      )}

      <div className="students-grid">
        {students.map((student) => (
          <div key={student.id} className="student-card">
            <div className="student-info">
              <h3>{student.name}</h3>
              <p>Index: {student.index_number}</p>
              <p>Class: {student.current_class}</p>
              <p>Admission: {student.admission_year}</p>
            </div>
            <div className="student-actions">
              <button 
                onClick={() => setSelectedStudent(student)}
                className="btn-secondary"
              >
                View Details
              </button>
              <button 
                onClick={() => handleDeleteStudent(student.id)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {students.length === 0 && (
        <div className="empty-state">
          <p>No students found{classFilter && ` in class ${classFilter}`}</p>
        </div>
      )}
    </div>
  );
};

export default StudentList;