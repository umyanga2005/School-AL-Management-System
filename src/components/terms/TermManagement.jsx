// src/components/terms/TermManagement.jsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { termApi } from '../../services/termApi';
import TermForm from './TermForm';
import BulkTermForm from './BulkTermForm';
import TermEditModal from './TermEditModal';
import TermStatsCard from './TermStatsCard';

const TermManagement = () => {
  const [terms, setTerms] = useState([]);
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    year: '',
    term_number: '',
    search: '',
    sort_by: 'exam_year',
    sort_order: 'DESC'
  });

  const [view, setView] = useState('table');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTerms();
  }, [terms, filters]);

  const loadData = async () => {
    await Promise.all([loadTerms(), loadCurrentTerm(), loadStats()]);
  };

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await termApi.getTerms(filters);
      if (response.success) {
        const termsList = response.data?.terms || response.terms || [];
        setTerms(termsList);
      } else {
        setError(response.error || 'Failed to load terms');
      }
    } catch (err) {
      setError(err.message || 'Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const filterTerms = () => {
    let filtered = [...terms];
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(term => term.status === filters.status);
    }
    
    if (filters.year) {
      filtered = filtered.filter(term => term.exam_year.toString() === filters.year);
    }
    
    if (filters.term_number) {
      filtered = filtered.filter(term => term.term_number.toString() === filters.term_number);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(term => 
        term.term_name.toLowerCase().includes(searchLower) ||
        term.exam_year.toString().includes(searchLower)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const order = filters.sort_order === 'ASC' ? 1 : -1;
      return a[filters.sort_by] > b[filters.sort_by] ? order : -order;
    });
    
    setFilteredTerms(filtered);
  };

  const loadCurrentTerm = async () => {
    try {
      const response = await termApi.getCurrentTerm();
      if (response.success) {
        setCurrentTerm(response.data?.term || response.term || null);
      }
    } catch (err) {
      console.error('Failed to load current term:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await termApi.getStats();
      if (response.success) {
        setStats(response.data?.stats || response.stats || null);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleCreateTerm = async (termData) => {
    try {
      setError('');
      const response = await termApi.createTerm(termData);
      if (response.success) {
        setShowForm(false);
        await loadData();
        showSuccess('Term created successfully!');
      } else {
        setError(response.error || 'Failed to create term');
      }
    } catch (err) {
      setError(err.message || 'Failed to create term');
    }
  };

  const handleBulkCreate = async (yearData) => {
    try {
      setError('');
      const response = await termApi.createBulkTerms(yearData);
      if (response.success) {
        setShowBulkForm(false);
        await loadData();
        showSuccess(`Successfully created ${response.data?.terms?.length || 3} terms for year ${yearData.exam_year}!`);
      } else {
        setError(response.error || 'Failed to create terms');
      }
    } catch (err) {
      setError(err.message || 'Failed to create terms');
    }
  };

  const handleSetCurrentTerm = async (termId) => {
    if (!window.confirm('Are you sure you want to set this as the current active term?')) return;
    
    try {
      setError('');
      const response = await termApi.setCurrentTerm(termId);
      if (response.success) {
        await loadData();
        showSuccess('Current term updated successfully!');
      } else {
        setError(response.error || 'Failed to set current term');
      }
    } catch (err) {
      setError(err.message || 'Failed to set current term');
    }
  };

  const handleUpdateTerm = async (termData) => {
    try {
      setError('');
      const response = await termApi.updateTerm(editingTerm.id, termData);
      if (response.success) {
        setEditingTerm(null);
        await loadData();
        showSuccess('Term updated successfully!');
      } else {
        setError(response.error || 'Failed to update term');
      }
    } catch (err) {
      setError(err.message || 'Failed to update term');
    }
  };

  const handleDeleteTerm = async (term, force = false) => {
    const confirmMessage = force 
      ? `Are you sure you want to force delete "${term.term_name}"? This will also delete all related marks and cannot be undone.`
      : `Are you sure you want to delete "${term.term_name}"?`;
      
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setError('');
      const response = await termApi.deleteTerm(term.id, force);
      if (response.success) {
        await loadData();
        showSuccess('Term deleted successfully!');
      } else {
        const errorData = response;
        if (errorData?.marks_count && !force) {
          if (window.confirm(`${errorData.error} Would you like to force delete it anyway?`)) {
            handleDeleteTerm(term, true);
          }
        } else {
          setError(errorData?.error || 'Failed to delete term');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete term');
    }
  };

  const handleCloneTerm = async (term) => {
    const targetYear = prompt(`Clone "${term.term_name}" to which year?`, new Date().getFullYear() + 1);
    if (!targetYear) return;
    
    const newName = prompt('Enter name for cloned term:', term.term_name);
    if (newName === null) return;
    
    try {
      setError('');
      const response = await termApi.cloneTerm(term.id, {
        target_year: parseInt(targetYear),
        new_term_name: newName || term.term_name
      });
      if (response.success) {
        await loadData();
        showSuccess(`Term cloned successfully to year ${targetYear}!`);
      } else {
        setError(response.error || 'Failed to clone term');
      }
    } catch (err) {
      setError(err.message || 'Failed to clone term');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      year: '',
      term_number: '',
      search: '',
      sort_by: 'exam_year',
      sort_order: 'DESC'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueYears = () => {
    return [...new Set(terms.map(t => t.exam_year))].sort((a, b) => b - a);
  };

  // Prevent activating 2026 terms (only allow current year + 1 max)
  const canActivateTerm = (term) => {
    const currentYear = new Date().getFullYear();
    return term.exam_year <= currentYear + 1;
  };

  if (loading && terms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading terms...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Term Management</h2>
          <p className="text-gray-600">Manage academic terms and set current active term</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Term
          </button>
          <button
            onClick={() => setShowBulkForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Bulk Create
          </button>
          <button
            onClick={() => setView(view === 'table' ? 'stats' : 'table')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {view === 'table' ? 'View Stats' : 'View Table'}
          </button>
        </div>
      </div>

      {/* Current Term Banner */}
      {currentTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">Current Active Term</h3>
              <p className="text-blue-700">
                {currentTerm.term_name} ({currentTerm.exam_year} - Term {currentTerm.term_number})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <span className="text-red-600">⚠️</span>
            <span className="ml-2 font-medium">Error: {error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <span className="text-green-600">✓</span>
            <span className="ml-2 font-medium">{success}</span>
          </div>
        </div>
      )}

      {view === 'stats' && stats && (
        <TermStatsCard stats={stats} />
      )}

      {view === 'table' && (
        <>
          {/* Filters */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={filters.term_number}
                  onChange={(e) => handleFilterChange('term_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Terms</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="exam_year">Year</option>
                  <option value="term_number">Term</option>
                  <option value="created_at">Created Date</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={filters.sort_order}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DESC">Descending</option>
                  <option value="ASC">Ascending</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search terms..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mt-6"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terms Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {filteredTerms.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? 'No terms match your current filters.' 
                    : 'No terms have been created yet.'
                  }
                </p>
                {Object.values(filters).some(f => f) ? (
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create First Term
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Term
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTerms.map((term) => (
                      <tr key={term.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold">{term.term_number}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {term.term_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Term {term.term_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{term.exam_year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(term.exam_year, term.exam_month - 1).toLocaleString('default', { month: 'long' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(term.status)}`}>
                            {term.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {term.total_marks_entries || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(term.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {term.status !== 'active' && canActivateTerm(term) && (
                              <button
                                onClick={() => handleSetCurrentTerm(term.id)}
                                className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-100"
                                title="Set as Current Term"
                              >
                                Activate
                              </button>
                            )}
                            {term.status !== 'active' && !canActivateTerm(term) && (
                              <span 
                                className="text-gray-400 px-2 py-1 cursor-not-allowed"
                                title="Cannot activate future terms beyond next year"
                              >
                                Activate
                              </span>
                            )}
                            <button
                              onClick={() => setEditingTerm(term)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100"
                              title="Edit Term"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCloneTerm(term)}
                              className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-100"
                              title="Clone Term"
                            >
                              Clone
                            </button>
                            <button
                              onClick={() => handleDeleteTerm(term)}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-100"
                              title="Delete Term"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Info */}
          {filteredTerms.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredTerms.length} of {terms.length} terms
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showForm && (
        <TermForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateTerm}
          existingTerms={terms}
        />
      )}

      {showBulkForm && (
        <BulkTermForm
          onClose={() => setShowBulkForm(false)}
          onSubmit={handleBulkCreate}
          existingTerms={terms}
        />
      )}

      {editingTerm && (
        <TermEditModal
          term={editingTerm}
          onClose={() => setEditingTerm(null)}
          onSubmit={handleUpdateTerm}
          existingTerms={terms}
        />
      )}
    </div>
  );
};

export default TermManagement;