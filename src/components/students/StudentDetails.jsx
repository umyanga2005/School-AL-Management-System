// src/components/students/StudentDetails.jsx
import React, { useState, useEffect } from 'react';
import { studentApi, termApi, marksApi} from '../../services';
import StudentSubjects from './StudentSubjects';
import StudentForm from './StudentForm';
import AcademicRecords from './AcademicRecords';

const StudentDetails = ({ student, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [studentData, setStudentData] = useState(student);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [academicRecords, setAcademicRecords] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [reportType, setReportType] = useState('single');

  useEffect(() => {
    setStudentData(student);
    if (activeTab === 'academic') {
      loadAcademicRecords();
    }
  }, [student, activeTab]);

  const loadAcademicRecords = async () => {
    try {
      setLoading(true);
      
      // Get all terms to check which ones the student has marks for
      const termsResponse = await termApi.getTerms();
      
      if (termsResponse.success) {
        const terms = termsResponse.data.terms || termsResponse.data || [];
        
        // Check each term for student marks
        const recordsWithMarks = await Promise.all(
          terms.map(async (term) => {
            const marksResponse = await marksApi.getStudentTermMarks(student.id, term.id);
            return {
              term,
              hasMarks: marksResponse.success && marksResponse.data && 
                       marksResponse.data.marks && marksResponse.data.marks.length > 0,
              marksData: marksResponse.success ? marksResponse.data : null
            };
          })
        );
        
        // Filter to only terms with marks
        const validRecords = recordsWithMarks.filter(record => record.hasMarks);
        setAcademicRecords(validRecords);
      }
    } catch (err) {
      console.error('Error loading academic records:', err);
      setError('Failed to load academic records');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = (term = null, type = 'single') => {
    setSelectedTerm(term);
    setReportType(type);
    setShowReportModal(true);
  };

  const handleUpdate = async (updatedData) => {
    try {
      setLoading(true);
      const response = await studentApi.updateStudent(student.id, updatedData);
      
      if (response.success) {
        setStudentData(response.data.student);
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        setError(response.error || 'Failed to update student');
      }
    } catch (err) {
      setError(err.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Student Details: {studentData.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Personal Details
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subjects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('subjects')}
              >
                Subjects
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'academic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('academic')}
              >
                Academic Records
              </button>
            </nav>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Index Number</span>
                    <span className="block text-sm text-gray-900 mt-1">{studentData.index_number}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Class</span>
                    <span className="block text-sm text-gray-900 mt-1">{studentData.current_class}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Admission Year</span>
                    <span className="block text-sm text-gray-900 mt-1">{studentData.admission_year}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Name with Initials</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.name_with_initials || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Address</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.address || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h4>
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Mother's Name</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.mother_name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Mother's Phone</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.mother_phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Father's Name</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.father_name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Father's Phone</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.father_phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Guardian's Name</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.guardian_name || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Guardian's Phone</span>
                    <span className="block text-sm text-gray-900 mt-1">
                      {studentData.guardian_phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <StudentSubjects studentId={student.id} />
          )}

          {activeTab === 'academic' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-medium text-gray-900">Academic Records</h4>

              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading academic records...</p>
                </div>
              ) : academicRecords.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Academic Records Found</h3>
                  <p className="mt-1 text-sm text-gray-500">No exam marks have been recorded for this student yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {academicRecords.map((record, index) => (
                    <div key={record.term.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {record.term.term_name} - {record.term.exam_year}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {record.marksData?.marks?.length || 0} subjects with marks
                          </p>
                        </div>
                        <button
                          onClick={() => handleGenerateReport(record.term, 'single')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                        >
                          Download Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Close
            </button>
            {activeTab === 'details' && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Details'}
              </button>
            )}
          </div>

          {isEditing && (
            <StudentForm
              initialData={studentData}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          )}

          {showReportModal && (
            <AcademicRecords
              student={studentData}
              selectedTerm={selectedTerm}
              reportType={reportType}
              onClose={() => {
                setShowReportModal(false);
                setSelectedTerm(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;