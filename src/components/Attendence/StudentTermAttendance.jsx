// src/components/attendance/StudentTermAttendance.jsx - UPDATED TO MATCH MARKS ENTRY STYLE
import React, { useState, useEffect } from 'react';
import { termAttendanceApi } from '../../services/termAttendanceApi';
import { useDebounce } from '../../hooks/useDebounce';

const StudentTermAttendance = () => {
  // State management
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [totalSchoolDays, setTotalSchoolDays] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [originalAttendance, setOriginalAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [completionStats, setCompletionStats] = useState({ entered: 0, total: 0, percentage: 0 });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Load existing attendance data when class or term changes
  useEffect(() => {
    if (selectedClass && selectedTerm) {
      loadExistingData();
    } else {
      setStudents([]);
      setAttendanceData({});
      setOriginalAttendance({});
    }
  }, [selectedClass, selectedTerm]);

  useEffect(() => {
    // Calculate completion statistics
    const entered = Object.values(attendanceData).filter(data => 
      data.attendedDays !== '' && data.attendedDays !== null
    ).length;
    const total = students.length;
    const percentage = total > 0 ? Math.round((entered / total) * 100) : 0;
    
    setCompletionStats({ entered, total, percentage });
  }, [attendanceData, students]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading initial data...');
      
      const [classesResult, termsResult] = await Promise.all([
        termAttendanceApi.getClasses(),
        termAttendanceApi.getTerms()
      ]);

      console.log('Classes response:', classesResult);
      console.log('Terms response:', termsResult);
      
      if (classesResult.success) setClasses(classesResult.data);
      if (termsResult.success) setTerms(termsResult.data);
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Load existing attendance data
  const loadExistingData = async () => {
    if (!selectedClass || !selectedTerm) return;

    setLoading(true);
    setError('');
    
    try {
      // Get the selected term to get the exam year
      const selectedTermObj = terms.find(t => t.id.toString() === selectedTerm);
      if (!selectedTermObj) {
        setError('Selected term not found');
        return;
      }

      const academicYear = selectedTermObj.exam_year.toString();
      
      // First, get students for the class
      const studentsResult = await termAttendanceApi.getStudentsByClass(selectedClass);
      
      console.log('Students response:', studentsResult);
      
      if (!studentsResult.success) {
        throw new Error(studentsResult.error || 'Failed to load students');
      }
      
      const classStudents = studentsResult.data || [];
      
      if (classStudents.length === 0) {
        setStudents([]);
        setAttendanceData({});
        setOriginalAttendance({});
        setError(`No students found in class ${selectedClass}`);
        return;
      }
      
      setStudents(classStudents);

      // Load existing attendance data
      const attendanceResult = await termAttendanceApi.getTermAttendance({
        class: selectedClass,
        term_id: selectedTerm,
        academic_year: academicYear
      });

      console.log('Attendance response:', attendanceResult);
      
      const existingAttendance = attendanceResult.data || [];
      console.log(`Found ${existingAttendance.length} existing attendance records`);

      // Initialize attendance data
      const initialAttendance = {};
      const originalAttendanceData = {};
      let schoolDays = 0;
      
      classStudents.forEach(student => {
        const existingRecord = existingAttendance.find(a => a.student_id === student.id);
        initialAttendance[student.id] = {
          attendedDays: existingRecord ? existingRecord.attended_days.toString() : '',
          absentDays: existingRecord ? existingRecord.absent_days : 0,
          percentage: existingRecord ? existingRecord.attendance_percentage : 0
        };
        originalAttendanceData[student.id] = {
          attendedDays: existingRecord ? existingRecord.attended_days.toString() : '',
          absentDays: existingRecord ? existingRecord.absent_days : 0,
          percentage: existingRecord ? existingRecord.attendance_percentage : 0
        };
        
        if (existingRecord) {
          schoolDays = existingRecord.total_school_days;
        }
      });

      setAttendanceData(initialAttendance);
      setOriginalAttendance(originalAttendanceData);
      setTotalSchoolDays(schoolDays.toString());
      
      console.log('Initialized attendance data for', Object.keys(initialAttendance).length, 'students');
      
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load attendance data');
      setStudents([]);
      setAttendanceData({});
      setOriginalAttendance({});
    } finally {
      setLoading(false);
    }
  };

  // Handle attendance input change
  const handleAttendanceChange = (studentId, attendedDays) => {
    const attended = parseInt(attendedDays) || 0;
    const total = parseInt(totalSchoolDays) || 0;
    
    if (attended > total && total > 0) {
      setError('Attended days cannot exceed total school days');
      return;
    }

    const absent = Math.max(0, total - attended);
    const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        attendedDays: attendedDays,
        absentDays: absent,
        percentage: parseFloat(percentage)
      }
    }));

    // Clear error message if valid
    if (attended <= total || total === 0) {
      setError('');
    }
  };

  // Handle total school days change
  const handleTotalDaysChange = (e) => {
    const totalDays = e.target.value;
    setTotalSchoolDays(totalDays);
    
    // Recalculate all percentages when total days change
    if (totalDays && !isNaN(totalDays)) {
      const updatedData = { ...attendanceData };
      Object.keys(updatedData).forEach(studentId => {
        const attended = parseInt(updatedData[studentId].attendedDays) || 0;
        const total = parseInt(totalDays);
        const absent = Math.max(0, total - attended);
        const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;
        
        updatedData[studentId] = {
          ...updatedData[studentId],
          absentDays: absent,
          percentage: parseFloat(percentage)
        };
      });
      setAttendanceData(updatedData);
    }
  };

  // Save attendance data
  const saveAttendance = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!selectedClass || !selectedTerm || !totalSchoolDays) {
        setError('Please select class, term and enter total school days');
        return;
      }

      // Get the selected term to get the exam year
      const selectedTermObj = terms.find(t => t.id.toString() === selectedTerm);
      if (!selectedTermObj) {
        throw new Error('Selected term not found');
      }

      const academicYear = selectedTermObj.exam_year.toString();
      
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        term_id: parseInt(selectedTerm),
        academic_year: academicYear,
        total_school_days: parseInt(totalSchoolDays),
        attended_days: parseInt(attendanceData[student.id]?.attendedDays || 0),
        absent_days: attendanceData[student.id]?.absentDays || 0,
        attendance_percentage: attendanceData[student.id]?.percentage || 0
      }));

      console.log('Saving attendance:', {
        recordsCount: attendanceRecords.length,
        termId: selectedTerm,
        sampleRecord: attendanceRecords[0]
      });

      const response = await termAttendanceApi.saveTermAttendance(attendanceRecords);

      console.log('Save attendance response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to save attendance');
      }

      // Update original attendance after successful save
      const newOriginalAttendance = { ...originalAttendance };
      students.forEach(student => {
        newOriginalAttendance[student.id] = { ...attendanceData[student.id] };
      });
      setOriginalAttendance(newOriginalAttendance);

      setSuccess(`Successfully saved attendance for ${attendanceRecords.length} students`);
      console.log('Attendance saved successfully');
      
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllAttendance = () => {
    const clearedAttendance = {};
    students.forEach(student => {
      clearedAttendance[student.id] = {
        attendedDays: '',
        absentDays: 0,
        percentage: 0
      };
    });
    setAttendanceData(clearedAttendance);
  };

  const handleSelectAllAttendance = (value) => {
    const total = parseInt(totalSchoolDays) || 0;
    const newAttendance = {};
    students.forEach(student => {
      const attended = Math.min(value, total);
      const absent = Math.max(0, total - attended);
      const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;
      
      newAttendance[student.id] = {
        attendedDays: attended.toString(),
        absentDays: absent,
        percentage: parseFloat(percentage)
      };
    });
    setAttendanceData(newAttendance);
  };

  const hasUnsavedChanges = () => {
    return Object.keys(attendanceData).some(studentId => 
      attendanceData[studentId].attendedDays !== originalAttendance[studentId]?.attendedDays
    );
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Poor';
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    student.index_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Safe percentage display function
  const displayPercentage = (percentage) => {
    if (percentage === null || percentage === undefined) return '0.00';
    if (typeof percentage === 'number') return percentage.toFixed(2);
    if (typeof percentage === 'string') {
      const num = parseFloat(percentage);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    }
    return '0.00';
  };

  // Safe percentage value for calculations
  const getPercentageValue = (percentage) => {
    if (percentage === null || percentage === undefined) return 0;
    if (typeof percentage === 'number') return percentage;
    if (typeof percentage === 'string') {
      const num = parseFloat(percentage);
      return isNaN(num) ? 0 : num;
    }
    return 0;
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Term Attendance</h2>
        <p className="text-gray-600">Enter and manage student term attendance</p>
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
              Class <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedClass} 
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedTerm('');
                setStudents([]);
                setAttendanceData({});
                setOriginalAttendance({});
              }}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Class</option>
              {classes.map((className, index) => (
                <option key={index} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={loading || !selectedClass}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Term</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} ({term.exam_year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total School Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={totalSchoolDays}
              onChange={handleTotalDaysChange}
              min="1"
              max="365"
              disabled={loading || !selectedTerm}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter total days"
            />
          </div>
        </div>
      </div>

      {selectedClass && selectedTerm && totalSchoolDays && students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border-b border-gray-200 gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Class {selectedClass} - Term Attendance
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
                      className={`h-full transition-all duration-300 ${
                        completionStats.percentage >= 80 ? 'bg-green-500' : 
                        completionStats.percentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${completionStats.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {completionStats.entered}/{completionStats.total} ({completionStats.percentage}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSelectAllAttendance(parseInt(totalSchoolDays))}
                  disabled={saving}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  title="Set all students to perfect attendance"
                >
                  Set All Present
                </button>
                <button 
                  onClick={handleClearAllAttendance}
                  disabled={saving}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
              <button 
                onClick={saveAttendance} 
                disabled={saving || !hasUnsavedChanges()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {saving ? 'Saving...' : 'Save All Attendance'}
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
                    Attended Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => {
                  const hasChanged = attendanceData[student.id]?.attendedDays !== originalAttendance[student.id]?.attendedDays;
                  const isEmpty = attendanceData[student.id]?.attendedDays === '' || attendanceData[student.id]?.attendedDays === null;
                  const percentageValue = getPercentageValue(attendanceData[student.id]?.percentage);
                  
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
                          max={totalSchoolDays}
                          value={attendanceData[student.id]?.attendedDays || ''}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                          disabled={saving}
                          className={`w-24 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
                            hasChanged ? 'border-yellow-400 bg-yellow-50' : 
                            isEmpty ? 'border-gray-300' : 'border-green-300 bg-green-50'
                          }`}
                          placeholder={`0-${totalSchoolDays}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {attendanceData[student.id]?.absentDays || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          percentageValue >= 75 ? 'bg-green-100 text-green-800' :
                          percentageValue >= 60 ? 'bg-blue-100 text-blue-800' :
                          percentageValue >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {displayPercentage(percentageValue)}%
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

      {selectedClass && selectedTerm && students.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No students found in class {selectedClass}.
          </p>
        </div>
      )}

      {!selectedClass && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Get started</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a class and term to begin entering attendance.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTermAttendance;