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
      
      if (subjectsRes.success) {
        setSubjects(subjectsRes.data.subjects || []);
      }
      
      if (studentSubjectsRes.success) {
        setStudentSubjects(studentSubjectsRes.data.studentSubjects || []);
      }
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
      const response = await studentApi.assignStudentSubjects(studentId, {
        subject_ids: studentSubjects.map(s => s.subject_id),
        academic_year: academicYear
      });
      
      if (response.success) {
        setError('');
        alert('Subjects assigned successfully!');
        loadData(); // Reload data to confirm changes
      } else {
        setError(response.error || 'Failed to assign subjects');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4">Loading subjects...</div>;

  return (
    <div className="student-subjects p-4">
      <div className="subject-header flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold">Assigned Subjects for {academicYear}</h4>
        <select 
          value={academicYear} 
          onChange={(e) => setAcademicYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          {[2023, 2024, 2025].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {error && <div className="error text-red-600 mb-4">{error}</div>}

      <div className="subjects-grid grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {subjects.map(subject => {
          const isSelected = studentSubjects.some(s => s.subject_id === subject.id);
          return (
            <label key={subject.id} className="subject-checkbox flex items-center p-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                disabled={loading}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <span className="subject-name font-medium">{subject.subject_name}</span>
              <span className="subject-stream text-sm text-gray-500 ml-2">({subject.stream})</span>
            </label>
          );
        })}
      </div>

      <div className="subject-actions">
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-400"
        >
          {loading ? 'Saving...' : 'Save Subjects'}
        </button>
      </div>
    </div>
  );
};

export default StudentSubjects;