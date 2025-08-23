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

  const classes = ['12A1', '12A2', '13A1', '13A2'];

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
      setError('');
      
      const [subjectsRes, termsRes, currentTermRes] = await Promise.all([
        subjectApi.getSubjects(),
        termApi.getTerms(),
        termApi.getCurrentTerm()
      ]);
      
      setSubjects(subjectsRes.data?.subjects || []);
      setTerms(termsRes.data?.terms || []);
      setCurrentTerm(currentTermRes.data?.term || null);
      setSelectedTerm(currentTermRes.data?.term?.id?.toString() || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndMarks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const studentsRes = await studentApi.getStudents(selectedClass);
      const studentsData = studentsRes.data?.students || [];
      setStudents(studentsData);

      // Load existing marks for this combination
      const marksRes = await marksApi.getMarks({
        class: selectedClass,
        subject_id: selectedSubject,
        term_id: selectedTerm
      });

      const existingMarks = marksRes.data?.marks || [];

      // Initialize marks data
      const initialMarks = {};
      studentsData.forEach(student => {
        const existingMark = existingMarks.find(m => m.student_id === student.id);
        initialMarks[student.id] = existingMark ? existingMark.marks.toString() : '';
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
    const numericValue = parseFloat(marks);
    if (marks === '' || (numericValue >= 0 && numericValue <= 100)) {
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

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Marks Entry</h2>
        <p className="text-gray-600">Enter and manage student marks for selected class and subject</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {success}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name} ({subject.stream})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
      </div>

      {students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Enter Marks for {selectedClass}
            </h3>
            <button 
              onClick={handleSaveMarks} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading ? 'Saving...' : 'Save All Marks'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks (0-100)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.index_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={marksData[student.id] || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={loading}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="0-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedClass && selectedSubject && selectedTerm && students.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No students found in {selectedClass} or students haven't been assigned to this subject.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;