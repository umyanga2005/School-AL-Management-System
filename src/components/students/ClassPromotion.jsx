// src/components/students/ClassPromotion.jsx - FIXED VERSION
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
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    if (fromClass) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [fromClass]);

  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      setError('');
      const response = await studentApi.getStudents(fromClass);
      
      // Handle different response structures
      if (response.success) {
        const studentData = response.data.students || response.data || [];
        setStudents(studentData);
        setSelectedStudents(studentData.map(s => s.id));
      } else {
        setError(response.error || 'Failed to load students');
        setStudents([]);
        setSelectedStudents([]);
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err.message || 'Failed to load students');
      setStudents([]);
      setSelectedStudents([]);
    } finally {
      setIsLoadingStudents(false);
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
      setError('');
      const response = await studentApi.promoteStudents({
        studentIds: selectedStudents,
        fromClass,
        toClass,
        academicYear
      });
      
      if (response.success) {
        alert(`Successfully promoted ${selectedStudents.length} students from ${fromClass} to ${toClass}`);
        if (onPromote) onPromote();
        onClose();
      } else {
        setError(response.error || 'Failed to promote students');
      }
    } catch (err) {
      console.error('Error promoting students:', err);
      setError(err.message || 'Failed to promote students');
    } finally {
      setLoading(false);
    }
  };

  const classOptions = ['12A1', '12A2', '12B1', '12B2', '13A1', '13A2', '13B1', '13B2'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Class Promotion</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Class <span className="text-red-500">*</span>
              </label>
              <select 
                value={fromClass} 
                onChange={(e) => setFromClass(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Class</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Class <span className="text-red-500">*</span>
              </label>
              <select 
                value={toClass} 
                onChange={(e) => setToClass(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Class</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="number"
                value={academicYear}
                onChange={(e) => setAcademicYear(parseInt(e.target.value))}
                min="2000"
                max="2030"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {fromClass && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-700">
                  Students in {fromClass} 
                  {!isLoadingStudents && <span> ({students.length})</span>}
                </h4>
                {students.length > 0 && (
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      disabled={loading || isLoadingStudents || students.length === 0}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    Select All
                  </label>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto p-4">
                {isLoadingStudents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No students found in {fromClass}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                          disabled={loading}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900 flex-1">
                          {student.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {student.index_number}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              onClick={handlePromote} 
              disabled={loading || selectedStudents.length === 0 || !fromClass || !toClass}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors duration-200 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading ? 'Promoting...' : `Promote ${selectedStudents.length} Students`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassPromotion;