// src/components/marks/MarksEntry.jsx
import React, { useState, useEffect } from 'react';
import { marksApi, studentApi, subjectApi, termApi } from '../../services';

const MarksEntry = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) {
      loadStudentsAndMarks();
    }
  }, [selectedClass, selectedSubject, selectedTerm]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, termsRes, currentTermRes] = await Promise.all([
        subjectApi.getSubjects(),
        termApi.getTerms(),
        termApi.getCurrentTerm()
      ]);
      
      setSubjects(subjectsRes.data.subjects);
      setTerms(termsRes.data.terms);
      setCurrentTerm(currentTermRes.data.term);
      setSelectedTerm(currentTermRes.data.term?.id || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndMarks = async () => {
    try {
      setLoading(true);
      const studentsRes = await studentApi.getStudents(selectedClass);
      setStudents(studentsRes.data.students);

      // Load existing marks for this combination
      const marksRes = await marksApi.getMarks({
        class: selectedClass,
        subject_id: selectedSubject,
        term_id: selectedTerm
      });

      // Initialize marks data
      const initialMarks = {};
      studentsRes.data.students.forEach(student => {
        const existingMark = marksRes.data.marks.find(m => m.student_id === student.id);
        initialMarks[student.id] = existingMark ? existingMark.marks : '';
      });

      setMarksData(initialMarks);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students and marks');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, marks) => {
    // Validate marks (0-100)
    if (marks === '' || (marks >= 0 && marks <= 100)) {
      setMarksData(prev => ({ ...prev, [studentId]: marks }));
    }
  };

  const handleSaveMarks = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const marksToSave = Object.entries(marksData)
        .filter(([_, marks]) => marks !== '' && marks !== null)
        .map(([studentId, marks]) => ({
          student_id: parseInt(studentId),
          subject_id: parseInt(selectedSubject),
          term_id: parseInt(selectedTerm),
          marks: parseFloat(marks)
        }));

      if (marksToSave.length === 0) {
        setError('No marks to save');
        return;
      }

      await marksApi.bulkEnterMarks({
        marksData: marksToSave,
        term_id: parseInt(selectedTerm)
      });

      setSuccess(`Successfully saved marks for ${marksToSave.length} students`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !marksData) return <div className="loading">Loading...</div>;

  return (
    <div className="marks-entry">
      <div className="page-header">
        <h2>Marks Entry</h2>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="marks-filters">
        <div className="form-group">
          <label>Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Class</option>
            <option value="12A1">12A1</option>
            <option value="12A2">12A2</option>
            <option value="13A1">13A1</option>
            <option value="13A2">13A2</option>
          </select>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Subject</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.subject_name} ({subject.stream})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Term</label>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Term</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.term_name} ({term.exam_year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {students.length > 0 && (
        <div className="marks-table-container">
          <div className="table-header">
            <h3>Enter Marks for {selectedClass}</h3>
            <button 
              onClick={handleSaveMarks} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save All Marks'}
            </button>
          </div>

          <table className="marks-table">
            <thead>
              <tr>
                <th>Index No</th>
                <th>Student Name</th>
                <th>Marks (0-100)</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.index_number}</td>
                  <td>{student.name}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={marksData[student.id] || ''}
                      onChange={(e) => handleMarksChange(student.id, e.target.value)}
                      disabled={loading}
                      className="marks-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedClass && selectedSubject && selectedTerm && students.length === 0 && (
        <div className="empty-state">
          <p>No students found in {selectedClass} or students haven't been assigned to this subject.</p>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;