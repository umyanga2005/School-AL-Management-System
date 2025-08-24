// src/components/terms/TermStatsCard.jsx
import React, { useState } from 'react';

const TermStatsCard = ({ stats }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  if (!stats) return null;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getYearColor = (year) => {
    const currentYear = new Date().getFullYear();
    if (year === currentYear) return 'text-blue-600 bg-blue-100';
    if (year > currentYear) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalTerms}</div>
          <div className="text-sm text-gray-600">Total Terms</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeTerms}</div>
          <div className="text-sm text-gray-600">Active Terms</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-purple-600 mb-1">{stats.termsByYear?.length || 0}</div>
          <div className="text-sm text-gray-600">Academic Years</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-indigo-600 mb-1">{stats.currentYearTerms}</div>
          <div className="text-sm text-gray-600">Current Year Terms</div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Statistics</h3>
          <p className="text-sm text-gray-600">Comprehensive overview of your term data</p>
        </div>

        <div className="divide-y divide-gray-200">
          {/* Terms by Status */}
          {stats.termsByStatus && stats.termsByStatus.length > 0 && (
            <div className="p-4">
              <button
                onClick={() => toggleSection('status')}
                className="flex items-center justify-between w-full text-left focus:outline-none hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <h4 className="text-md font-medium text-gray-900">Terms by Status</h4>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedSection === 'status' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSection === 'status' && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.termsByStatus.map((item) => (
                    <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-xl font-bold mb-1 ${getStatusColor(item.status).split(' ')[0]}`}>
                        {item.count}
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                        {item.status || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Terms by Year */}
          {stats.termsByYear && stats.termsByYear.length > 0 && (
            <div className="p-4">
              <button
                onClick={() => toggleSection('year')}
                className="flex items-center justify-between w-full text-left focus:outline-none hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <h4 className="text-md font-medium text-gray-900">Terms by Academic Year</h4>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedSection === 'year' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSection === 'year' && (
                <div className="mt-3 space-y-2">
                  {stats.termsByYear.map((item) => (
                    <div key={item.exam_year} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getYearColor(item.exam_year)}`}>
                          {item.exam_year}
                        </span>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {item.count} term{item.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-500">
                          {((item.count / 3) * 100).toFixed(0)}% complete
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min((item.count / 3) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Academic Years Overview */}
          {stats.academicYearsOverview && stats.academicYearsOverview.length > 0 && (
            <div className="p-4">
              <button
                onClick={() => toggleSection('overview')}
                className="flex items-center justify-between w-full text-left focus:outline-none hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <h4 className="text-md font-medium text-gray-900">Academic Years Overview</h4>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedSection === 'overview' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSection === 'overview' && (
                <div className="mt-3 space-y-3">
                  {stats.academicYearsOverview.map((year) => (
                    <div key={year.exam_year} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-lg font-semibold text-gray-900">{year.exam_year}</h5>
                        <div className="flex items-center gap-2">
                          {year.active_terms > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {year.active_terms} Active
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {year.total_terms} Total
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{year.total_terms}/3</div>
                          <div className="text-gray-500">Terms Created</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{year.min_term}</div>
                          <div className="text-gray-500">First Term</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{year.max_term}</div>
                          <div className="text-gray-500">Last Term</div>
                        </div>
                      </div>
                      
                      {/* Progress bar for year completion */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Year Progress</span>
                          <span>{((year.total_terms / 3) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${year.total_terms === 3 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((year.total_terms / 3) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {year.total_terms < 3 && (
                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          Missing terms: {[1, 2, 3].filter(num => num < year.min_term || num > year.max_term).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Terms with Marks */}
          {stats.termsWithMarks && stats.termsWithMarks.length > 0 && (
            <div className="p-4">
              <button
                onClick={() => toggleSection('marks')}
                className="flex items-center justify-between w-full text-left focus:outline-none hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <h4 className="text-md font-medium text-gray-900">
                  Terms with Marks Data ({stats.termsWithMarks.length})
                </h4>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedSection === 'marks' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSection === 'marks' && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {stats.termsWithMarks.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{term.term_name}</div>
                        <div className="text-sm text-gray-500">
                          Term {term.term_number} - {term.exam_year}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{term.marks_count}</div>
                        <div className="text-sm text-gray-500">marks</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermStatsCard;