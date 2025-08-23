// src/components/subjects/SubjectList.jsx
import React, { useState, useEffect } from 'react';
import { subjectApi } from '../../services/subjectApi';
import SubjectForm from './SubjectForm';

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [streamFilter, setStreamFilter] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectApi.getSubjects();
      setSubjects(response.data.subjects);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (subjectData) => {
    try {
      await subjectApi.createSubject(subjectData);
      setShowForm(false);
      loadSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleUpdateSubject = async (subjectData) => {
    try {
      await subjectApi.updateSubject(editingSubject.id, subjectData);
      setEditingSubject(null);
      loadSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update subject');
    }
  };

  const filteredSubjects = streamFilter
    ? subjects.filter(subject => subject.stream === streamFilter)
    : subjects;

  if (loading) return <div className="loading">Loading subjects...</div>;

  return (
    <div className="subject-management">
      <div className="page-header">
        <h2>Subject Management</h2>
        <div className="header-actions">
          <select 
            value={streamFilter} 
            onChange={(e) => setStreamFilter(e.target.value)}
          >
            <option value="">All Streams</option>
            <option value="Science">Science</option>
            <option value="Commerce">Commerce</option>
            <option value="Arts">Arts</option>
            <option value="Technology">Technology</option>
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Add Subject
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <SubjectForm
          onSubmit={handleCreateSubject}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingSubject && (
        <SubjectForm
          initialData={editingSubject}
          onSubmit={handleUpdateSubject}
          onCancel={() => setEditingSubject(null)}
        />
      )}

      <div className="subjects-table">
        <table>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Stream</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.subject_code}</td>
                <td>{subject.subject_name}</td>
                <td>{subject.stream}</td>
                <td>{subject.description || '-'}</td>
                <td>
                  <button 
                    onClick={() => setEditingSubject(subject)}
                    className="btn-secondary"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubjects.length === 0 && (
        <div className="empty-state">
          <p>No subjects found{streamFilter && ` in ${streamFilter} stream`}</p>
        </div>
      )}
    </div>
  );
};

export default SubjectList;