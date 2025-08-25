// src/components/marks/MarksEntry.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { marksApi, studentApi, subjectApi, termApi } from '../../services';
import { useDebounce } from '../../hooks/useDebounce';

const MarksEntry = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [marksData, setMarksData] = useState({});
  const [originalMarks, setOriginalMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [completionStats, setCompletionStats] = useState({ entered: 0, total: 0, percentage: 0 });

  const classes = ['12A1', '12A2', '12B1', '12B2', '13A1', '13A2', '13B1', '13B2'];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) {
      loadStudentsAndMarks();
    }
  }, [selectedClass, selectedSubject, selectedTerm]);

  useEffect(() => {
    // Calculate completion statistics
    const entered = Object.values(marksData).filter(mark => mark !== '' && mark !== null).length;
    const total = students.length;
    const percentage = total > 0 ? Math.round((entered / total) * 100) : 0;
    
    setCompletionStats({ entered, total, percentage });
  }, [marksData, students]);

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
      
      // Filter students based on search term
      const filteredStudents = studentsData.filter(student => 
        student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        student.index_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      
      setStudents(filteredStudents);

      // Filter subjects based on what students in this class are actually taking
      await filterSubjectsByClass(studentsData);

      // Load existing marks for this combination
      const marksRes = await marksApi.getMarks({
        class: selectedClass,
        subject_id: selectedSubject,
        term_id: selectedTerm
      });

      const existingMarks = marksRes.data?.marks || [];

      // Initialize marks data
      const initialMarks = {};
      const originalMarksData = {};
      
      filteredStudents.forEach(student => {
        const existingMark = existingMarks.find(m => m.student_id === student.id);
        initialMarks[student.id] = existingMark ? existingMark.marks.toString() : '';
        originalMarksData[student.id] = existingMark ? existingMark.marks.toString() : '';
      });

      setMarksData(initialMarks);
      setOriginalMarks(originalMarksData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students and marks');
    } finally {
      setLoading(false);
    }
  };

  const filterSubjectsByClass = async (studentsData) => {
    try {
      if (studentsData.length === 0) {
        setFilteredSubjects([]);
        return;
      }

      // Get current year for filtering
      const currentYear = new Date().getFullYear();
      
      // Get subjects assigned to students in this class using the new API endpoint
      const subjectsRes = await subjectApi.getClassSubjects(selectedClass, currentYear);
      
      if (subjectsRes.success && subjectsRes.data?.subjects) {
        setFilteredSubjects(subjectsRes.data.subjects);
        
        // If no subject is selected but we have filtered subjects, auto-select the first one
        if (!selectedSubject && subjectsRes.data.subjects.length > 0) {
          setSelectedSubject(subjectsRes.data.subjects[0].id.toString());
        }
      } else {
        // Fallback: show all subjects if filtering fails
        setFilteredSubjects(subjects);
      }
    } catch (err) {
      console.error('Error filtering subjects by class:', err);
      // Fallback: show all subjects if filtering fails
      setFilteredSubjects(subjects);
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

      // Update original marks after successful save
      const newOriginalMarks = { ...originalMarks };
      marksToSave.forEach(({ student_id, marks }) => {
        newOriginalMarks[student_id] = marks.toString();
      });
      setOriginalMarks(newOriginalMarks);

      setSuccess(`Successfully saved marks for ${marksToSave.length} students`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllMarks = () => {
    const clearedMarks = {};
    students.forEach(student => {
      clearedMarks[student.id] = '';
    });
    setMarksData(clearedMarks);
  };

  const handleSelectAllMarks = (value) => {
    const newMarks = {};
    students.forEach(student => {
      newMarks[student.id] = value.toString();
    });
    setMarksData(newMarks);
  };

  const hasUnsavedChanges = () => {
    return Object.keys(marksData).some(studentId => 
      marksData[studentId] !== originalMarks[studentId]
    );
  };

  const getGrade = (marks) => {
    if (marks === '' || marks === null) return '-';
    const numericMarks = parseFloat(marks);
    if (numericMarks >= 75) return 'A';
    if (numericMarks >= 65) return 'B';
    if (numericMarks >= 50) return 'C';
    if (numericMarks >= 35) return 'S';
    return 'F';
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    student.index_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select 
              value={selectedClass} 
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject('');
                setStudents([]);
                setFilteredSubjects([]);
              }}
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
              disabled={loading || !selectedClass || filteredSubjects.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map(subject => (
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

        {selectedClass && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredSubjects.length > 0 ? (
                <span>{filteredSubjects.length} subjects being taken by students in {selectedClass}</span>
              ) : (
                <span className="text-yellow-600">No subjects found for students in {selectedClass}</span>
              )}
            </div>
            <div className="text-sm text-blue-600">
              {currentTerm && (
                <span>Current Term: {currentTerm.term_name} ({currentTerm.exam_year})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-200 gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enter Marks for {selectedClass} - {filteredSubjects.find(s => s.id === parseInt(selectedSubject))?.subject_name}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-24 rounded-full bg-gray-200 overflow-hidden`}>
                    <div 
                      className={`h-full ${
                        completionStats.percentage >= 80 ? 'bg-green-500' : 
                        completionStats.percentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${completionStats.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{completionStats.percentage}% complete</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSelectAllMarks(75)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium"
                  title="Set all to A grade (75)"
                >
                  Set All A
                </button>
                <button 
                  onClick={handleClearAllMarks}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
              <button 
                onClick={handleSaveMarks} 
                disabled={loading || !hasUnsavedChanges()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? 'Saving...' : 'Save All Marks'}
              </button>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => {
                  const hasChanged = marksData[student.id] !== originalMarks[student.id];
                  const isEmpty = marksData[student.id] === '' || marksData[student.id] === null;
                  
                  return (
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
                          className={`w-24 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            hasChanged ? 'border-yellow-400 bg-yellow-50' : 
                            isEmpty ? 'border-gray-300' : 'border-green-300 bg-green-50'
                          }`}
                          placeholder="0-100"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getGrade(marksData[student.id]) === 'A' ? 'bg-green-100 text-green-800' :
                          getGrade(marksData[student.id]) === 'B' ? 'bg-blue-100 text-blue-800' :
                          getGrade(marksData[student.id]) === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          getGrade(marksData[student.id]) === 'S' ? 'bg-orange-100 text-orange-800' :
                          getGrade(marksData[student.id]) === 'F' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getGrade(marksData[student.id])}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hasChanged ? (
                          <span className="text-yellow-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Unsaved
                          </span>
                        ) : isEmpty ? (
                          <span className="text-gray-500">Not entered</span>
                        ) : (
                          <span className="text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students match your search for "{searchTerm}".
              </p>
            </div>
          )}
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