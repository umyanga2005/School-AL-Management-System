// src/components/students/StudentSubjects.jsx
import React, { useState, useEffect } from 'react';
import { studentApi, subjectApi } from '../../services';

const StudentSubjects = ({ studentId }) => {
  const [subjects, setSubjects] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [studentId, academicYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, studentSubjectsRes] = await Promise.all([
        subjectApi.getSubjects(),
        studentApi.getStudentSubjects(studentId, academicYear)
      ]);
      
      setSubjects(subjectsRes.data.subjects);
      setStudentSubjects(studentSubjectsRes.data.studentSubjects);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subjectId, isSelected) => {
    const updatedSelection = isSelected
      ? [...studentSubjects.map(s => s.subject_id), subjectId]
      : studentSubjects.filter(s => s.subject_id !== subjectId).map(s => s.subject_id);
    
    setStudentSubjects(
      subjects.filter(s => updatedSelection.includes(s.id))
        .map(s => ({ subject_id: s.id, subject_name: s.subject_name }))
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await studentApi.assignStudentSubjects(studentId, {
        subject_ids: studentSubjects.map(s => s.subject_id),
        academic_year: academicYear
      });
      setError('');
      alert('Subjects assigned successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading subjects...</div>;

  return (
    <div className="student-subjects">
      <div className="subject-header">
        <h4>Assigned Subjects for {academicYear}</h4>
        <select 
          value={academicYear} 
          onChange={(e) => setAcademicYear(parseInt(e.target.value))}
        >
          {[2023, 2024, 2025].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="subjects-grid">
        {subjects.map(subject => {
          const isSelected = studentSubjects.some(s => s.subject_id === subject.id);
          return (
            <label key={subject.id} className="subject-checkbox">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                disabled={loading}
              />
              <span className="subject-name">{subject.subject_name}</span>
              <span className="subject-stream">({subject.stream})</span>
            </label>
          );
        })}
      </div>

      <div className="subject-actions">
        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Subjects'}
        </button>
      </div>
    </div>
  );
};

export default StudentSubjects;