// src/components/students/StudentList.jsx - UPDATED VERSION
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // Changed from selectedStudent to editingStudent
  const [selectedStudent, setSelectedStudent] = useState(null); // For viewing details
  const [showPromotion, setShowPromotion] = useState(false);

  const classes = ['12A1', '12A2', '12B1', '12B2', '13A1', '13A2', '13B1', '13B2'];

  useEffect(() => {
    loadStudents();
  }, [classFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentApi.getStudents(classFilter);
      
      // Handle different response structures
      if (response.success) {
        setStudents(response.data?.students || response.data || []);
      } else {
        setError(response.error || 'Failed to load students');
        setStudents([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: This is the key change - handleStudentSubmit function
  const handleStudentSubmit = async (studentData) => {
    try {
      setError('');
      let result;
      
      if (editingStudent) {
        // Update existing student
        result = await studentApi.updateStudent(editingStudent.id, studentData);
      } else {
        // Create new student
        result = await studentApi.createStudent(studentData);
      }
      
      if (result.success) {
        // Refresh the student list
        await loadStudents();
        return result; // Return the result so StudentForm can use it
      } else {
        throw new Error(result.error || 'Failed to save student');
      }
    } catch (error) {
      console.error('Error saving student:', error);
      setError(error.message || 'Failed to save student');
      throw error; // Re-throw so StudentForm can handle it
    }
  };

  // UPDATED: Form cancel handler
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    setError(''); // Clear any errors
  };

  // NEW: Handle edit student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowForm(true);
    setSelectedStudent(null); // Close details view if open
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    
    try {
      setError('');
      const response = await studentApi.deleteStudent(id);
      
      if (response.success) {
        await loadStudents();
      } else {
        setError(response.error || 'Failed to delete student');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete student');
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.index_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h2>
          <p className="text-gray-600">Manage student records and information</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          <select 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <button 
            onClick={() => {
              setEditingStudent(null); // Make sure we're in create mode
              setShowForm(true);
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Student
          </button>
          <button 
            onClick={() => setShowPromotion(true)} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Class Promotion
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search students by name or index number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Modals - UPDATED */}
      {showForm && (
        <StudentForm
          initialData={editingStudent} // Pass editing student data if available
          onSubmit={handleStudentSubmit} // Use the updated submit handler
          onCancel={handleFormCancel} // Use the updated cancel handler
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

      {/* Students Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Index: {student.index_number}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Class: {student.current_class}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0v8m-6 0h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Admission: {student.admission_year}
                  </div>
                </div>

                {/* UPDATED: Action buttons with edit functionality */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleEditStudent(student)}
                    className="flex-shrink-0 bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-md transition-colors duration-200"
                    title="Edit Student"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteStudent(student.id)}
                    className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-md transition-colors duration-200"
                    title="Delete Student"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? `No students match "${searchTerm}"`
              : classFilter 
                ? `No students found in class ${classFilter}`
                : 'Get started by adding your first student'
            }
          </p>
          {!searchTerm && !classFilter && (
            <div className="mt-6">
              <button 
                onClick={() => {
                  setEditingStudent(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Add First Student
              </button>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {filteredStudents.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
              <div className="text-sm text-gray-500">
                {searchTerm || classFilter ? 'Filtered' : 'Total'} Students
              </div>
            </div>
            {classes.map(cls => (
              <div key={cls} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.current_class === cls).length}
                </div>
                <div className="text-sm text-gray-500">Class {cls}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;