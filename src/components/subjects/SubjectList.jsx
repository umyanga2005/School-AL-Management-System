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
  const [searchTerm, setSearchTerm] = useState('');

  const streams = ['Science', 'Commerce', 'Arts', 'Technology'];

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await subjectApi.getSubjects();
      setSubjects(response.data?.subjects || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (subjectData) => {
    try {
      setError('');
      await subjectApi.createSubject(subjectData);
      setShowForm(false);
      await loadSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleUpdateSubject = async (subjectData) => {
    try {
      setError('');
      await subjectApi.updateSubject(editingSubject.id, subjectData);
      setEditingSubject(null);
      await loadSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;
    
    try {
      setError('');
      await subjectApi.deleteSubject(id);
      await loadSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  // Filter subjects based on stream and search term
  const filteredSubjects = subjects.filter(subject => {
    const matchesStream = !streamFilter || subject.stream === streamFilter;
    const matchesSearch = !searchTerm || 
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStream && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading subjects...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Subject Management</h2>
          <p className="text-gray-600">Manage subjects and their streams</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Subject
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
        </svg>
        {error}
      </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select 
            value={streamFilter} 
            onChange={(e) => setStreamFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Streams</option>
            {streams.map(stream => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modals */}
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

      {/* Subjects Table */}
      {filteredSubjects.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stream
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects.map((subject, index) => (
                  <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subject.subject_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.subject_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subject.stream === 'Science' ? 'bg-blue-100 text-blue-800' :
                        subject.stream === 'Commerce' ? 'bg-green-100 text-green-800' :
                        subject.stream === 'Arts' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {subject.stream}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {subject.description ? (
                          <span className="max-w-xs truncate block">{subject.description}</span>
                        ) : (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setEditingSubject(subject)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          title="Edit Subject"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors duration-200"
                          title="Delete Subject"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || streamFilter
              ? 'No subjects match your current filters'
              : 'Get started by adding your first subject'
            }
          </p>
          {!searchTerm && !streamFilter && (
            <div className="mt-6">
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Add First Subject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {subjects.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredSubjects.length}</div>
              <div className="text-sm text-gray-500">
                {searchTerm || streamFilter ? 'Filtered' : 'Total'} Subjects
              </div>
            </div>
            {streams.map(stream => {
              const count = subjects.filter(s => s.stream === stream).length;
              return (
                <div key={stream} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500">{stream}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectList;