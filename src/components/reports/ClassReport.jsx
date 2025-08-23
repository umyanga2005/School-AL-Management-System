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
      setError('');
      const response = await termApi.getTerms();
      const termsData = response.data?.terms || [];
      setTerms(termsData);
      if (termsData.length > 0) {
        setSelectedTerm(termsData[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load terms');
    }
  };

  const loadClassData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [studentsRes, marksRes] = await Promise.all([
        studentApi.getStudents(selectedClass),
        marksApi.getMarks({ class: selectedClass, term_id: selectedTerm })
      ]);

      setStudents(studentsRes.data?.students || []);
      setMarks(marksRes.data?.marks || []);
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
    if (studentMarks.length === 0) return '0.00';
    const total = studentMarks.reduce((sum, mark) => sum + parseFloat(mark.marks || 0), 0);
    return (total / studentMarks.length).toFixed(2);
  };

  const getGradeColor = (average) => {
    const avg = parseFloat(average);
    if (avg >= 85) return 'text-green-600';
    if (avg >= 75) return 'text-blue-600';
    if (avg >= 65) return 'text-yellow-600';
    if (avg >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Class Report - {selectedClass || 'Select Class'}
          </h2>
          <p className="text-gray-600">Overview of student performance and marks</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term
          </label>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {students.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
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
                    Subjects & Marks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => {
                  const studentMarks = getStudentMarks(student.id);
                  const average = calculateAverage(studentMarks);
                  
                  return (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.index_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {studentMarks.length > 0 ? (
                          <div className="space-y-1">
                            {studentMarks.map(mark => (
                              <div key={mark.id} className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                                <span className="text-sm text-gray-700">
                                  {mark.subject_name}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {mark.marks}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No marks recorded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-semibold ${getGradeColor(average)}`}>
                          {average}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          studentMarks.length > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {studentMarks.length > 0 ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              Complete
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Statistics */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {students.filter(student => getStudentMarks(student.id).length > 0).length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {students.filter(student => getStudentMarks(student.id).length === 0).length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {students.length > 0 
                    ? ((students.filter(student => getStudentMarks(student.id).length > 0).length / students.length) * 100).toFixed(1)
                    : 0
                  }%
                </div>
                <div className="text-sm text-gray-500">Progress</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedClass ? `No students found in ${selectedClass}` : 'Please select a class to view the report'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassReport;