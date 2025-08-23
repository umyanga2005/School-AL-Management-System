// src/components/students/StudentDetails.jsx
import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/studentApi';
import StudentSubjects from './StudentSubjects';

const StudentDetails = ({ student, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [studentData, setStudentData] = useState(student);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStudentData(student);
  }, [student]);

  const handleUpdate = async (updatedData) => {
    try {
      setLoading(true);
      const response = await studentApi.updateStudent(student.id, updatedData);
      setStudentData(response.data.student);
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Student Details: {studentData.name}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="tabs">
          <button 
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            Personal Details
          </button>
          <button 
            className={activeTab === 'subjects' ? 'active' : ''}
            onClick={() => setActiveTab('subjects')}
          >
            Subjects
          </button>
          <button 
            className={activeTab === 'academic' ? 'active' : ''}
            onClick={() => setActiveTab('academic')}
          >
            Academic Records
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {activeTab === 'details' && (
          <div className="student-details">
            <div className="detail-row">
              <span className="label">Index Number:</span>
              <span className="value">{studentData.index_number}</span>
            </div>
            <div className="detail-row">
              <span className="label">Class:</span>
              <span className="value">{studentData.current_class}</span>
            </div>
            <div className="detail-row">
              <span className="label">Admission Year:</span>
              <span className="value">{studentData.admission_year}</span>
            </div>
            <div className="detail-row">
              <span className="label">Address:</span>
              <span className="value">{studentData.address || 'Not provided'}</span>
            </div>
            
            <h4>Parent/Guardian Information</h4>
            <div className="detail-row">
              <span className="label">Mother:</span>
              <span className="value">{studentData.mother_name || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Mother's Phone:</span>
              <span className="value">{studentData.mother_phone || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Father:</span>
              <span className="value">{studentData.father_name || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Father's Phone:</span>
              <span className="value">{studentData.father_phone || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Guardian:</span>
              <span className="value">{studentData.guardian_name || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Guardian's Phone:</span>
              <span className="value">{studentData.guardian_phone || 'Not provided'}</span>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <StudentSubjects studentId={student.id} />
        )}

        {activeTab === 'academic' && (
          <div className="academic-records">
            <p>Academic records will be displayed here once marks are entered.</p>
            {/* This will be connected to marks components later */}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Close</button>
          {activeTab === 'details' && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="btn-primary"
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
      </div>
    </div>
  );
};

export default StudentDetails;