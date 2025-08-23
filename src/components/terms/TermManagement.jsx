// src/components/terms/TermManagement.jsx
import React, { useState, useEffect } from 'react';
import { termApi } from '../../services/termApi';
import TermForm from './TermForm';


const TermManagement = () => {
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [termsRes, currentTermRes] = await Promise.all([
        termApi.getTerms(),
        termApi.getCurrentTerm()
      ]);
      
      setTerms(termsRes.data?.terms || []);
      setCurrentTerm(currentTermRes.data?.term || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerm = async (termData) => {
    try {
      setError('');
      await termApi.createTerm(termData);
      setShowForm(false);
      await loadTerms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create term');
    }
  };

  const handleSetCurrentTerm = async (termId) => {
    if (!window.confirm('Are you sure you want to set this as the current active term?')) return;
    
    try {
      setError('');
      await termApi.setCurrentTerm(termId);
      await loadTerms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set current term');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading terms...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Term Management</h2>
          <p className="text-gray-600">Manage academic terms and set current active term</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Term
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

      {/* Current Term Card */}
      {currentTerm && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900">Current Active Term</h3>
              </div>
              <div className="space-y-1">
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">{currentTerm.term_name}</span> (Term {currentTerm.term_number})
                </p>
                <p className="text-gray-600">
                  Exam Month: {new Date(currentTerm.exam_year, currentTerm.exam_month - 1).toLocaleString('default', { month: 'long' })} {currentTerm.exam_year}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create Term Modal */}
      {showForm && (
        <TermForm
          onSubmit={handleCreateTerm}
          onCancel={() => setShowForm(false)}
          existingTerms={terms}
        />
      )}

      {/* Terms List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Terms</h3>
          <p className="text-sm text-gray-600">Manage all academic terms and set active term</p>
        </div>

        {terms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {terms.map((term, index) => (
                  <tr key={term.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {currentTerm?.id === term.id && (
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {term.term_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Term {term.term_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(term.exam_year, term.exam_month - 1).toLocaleString('default', { month: 'long' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {term.exam_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(term.status)}`}>
                        {currentTerm?.id === term.id ? 'Active' : (term.status || 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {currentTerm?.id !== term.id && (
                        <button
                          onClick={() => handleSetCurrentTerm(term.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                          Set as Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0v8m-6 0h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No terms found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first term to get started with managing academic periods.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Create First Term
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {terms.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{terms.length}</div>
              <div className="text-sm text-gray-500">Total Terms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {terms.filter(t => currentTerm?.id === t.id).length}
              </div>
              <div className="text-sm text-gray-500">Active Term</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(terms.map(t => t.exam_year)).size}
              </div>
              <div className="text-sm text-gray-500">Academic Years</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {terms.filter(t => t.exam_year === new Date().getFullYear()).length}
              </div>
              <div className="text-sm text-gray-500">Current Year Terms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermManagement;