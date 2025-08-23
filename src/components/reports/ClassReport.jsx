// src/components/reports/ClassReport.jsx
import React, { useState, useEffect } from 'react';
import { marksApi, studentApi, termApi } from '../../services';

const ClassReport = ({ currentUser, selectedClass }) => {
  const [students, setStudents] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTerms();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedTerm) {
      loadClassData();
    }
  }, [selectedClass, selectedTerm]);

  const loadTerms = async () => {
    try {
      const response = await termApi.getTerms();
      setTerms(response.data.terms);
      if (response.data.terms.length > 0) {
        setSelectedTerm(response.data.terms[0].id);
      }
    } catch (err) {
      setError('Failed to load terms');
    }
  };

  const loadClassData = async () => {
    try {
      setLoading(true);
      const [studentsRes, marksRes] = await Promise.all([
        studentApi.getStudents(selectedClass),
        marksApi.getMarks({ class: selectedClass, term_id: selectedTerm })
      ]);

      setStudents(studentsRes.data.students);
      setMarks(marksRes.data.marks);
    } catch (err) {
      setError('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentMarks = (studentId) => {
    return marks.filter(mark => mark.student_id === studentId);
  };

  const calculateAverage = (studentMarks) => {
    if (studentMarks.length === 0) return 0;
    const total = studentMarks.reduce((sum, mark) => sum + parseFloat(mark.marks), 0);
    return (total / studentMarks.length).toFixed(2);
  };

  if (loading) return <div className="loading">Loading report...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="class-report">
      <div className="page-header">
        <h2>Class Report - {selectedClass}</h2>
        <div className="report-controls">
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.term_name} ({term.exam_year})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="report-content">
        <table className="report-table">
          <thead>
            <tr>
              <th>Index No</th>
              <th>Student Name</th>
              <th>Subjects</th>
              <th>Average</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const studentMarks = getStudentMarks(student.id);
              const average = calculateAverage(studentMarks);
              
              return (
                <tr key={student.id}>
                  <td>{student.index_number}</td>
                  <td>{student.name}</td>
                  <td>
                    {studentMarks.length > 0 ? (
                      <div className="subjects-list">
                        {studentMarks.map(mark => (
                          <span key={mark.id} className="subject-mark">
                            {mark.subject_name}: {mark.marks}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-marks">No marks recorded</span>
                    )}
                  </td>
                  <td className="average">{average}</td>
                  <td>
                    <span className={`status ${studentMarks.length > 0 ? 'complete' : 'pending'}`}>
                      {studentMarks.length > 0 ? 'Complete' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {students.length === 0 && (
        <div className="empty-state">
          <p>No students found in {selectedClass}</p>
        </div>
      )}
    </div>
  );
};

export default ClassReport;