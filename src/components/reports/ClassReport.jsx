// src/components/reports/ClassReport.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { termApi, classApi, reportApi, subjectApi } from '../../services';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Enhanced Loading Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-96 p-8">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
    </div>
    <div className="mt-4 text-center">
      <p className="text-lg font-medium text-gray-700">{message}</p>
      <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
      </div>
    </div>
  </div>
);

// Enhanced Message Components
const MessageCard = ({ type, message, onClose, details }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
      </svg>
    )
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${styles[type]} relative`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{message}</p>
          {details && (
            <div className="mt-2 text-sm opacity-80">
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </div>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Mobile-Responsive Filter Component
const FilterSection = ({ filters, onFiltersChange, terms, classes, subjects, loading, onGenerate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Grade levels mapping
  const gradeLevels = [
    { value: '', label: 'All Grades' },
    { value: '12', label: 'Grade 12' },
    { value: '13', label: 'Grade 13' }
  ];

  // Stream options
  const streamOptions = [
    { value: '', label: 'All Streams' },
    { value: 'Arts', label: 'Arts Stream' },
    { value: 'Commerce', label: 'Commerce Stream' },
    { value: 'Science', label: 'Science Stream' },
    { value: 'Technology', label: 'Technology Stream' },
    { value: 'Common', label: 'Common Subjects' }
  ];

  // Report type options
  const reportTypes = [
    { value: 'class', label: 'Single Class Report' },
    { value: 'grade', label: 'Grade Level Report' },
    { value: 'stream', label: 'Stream Report' },
    { value: 'term', label: 'Full Term Report' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-lg font-semibold">Report Filters</h3>
            <p className="text-sm text-blue-100 mt-1">
              {filters.reportType === 'class' ? `Class: ${filters.className}` : 
               filters.reportType === 'grade' ? `Grade: ${filters.gradeLevel}` :
               filters.reportType === 'stream' ? `Stream: ${filters.streamFilter}` :
               'Full Term Report'}
            </p>
          </div>
          <svg
            className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h3 className="text-xl font-bold">Advanced Report Filters</h3>
        <p className="text-blue-100 mt-1">Configure your report parameters</p>
      </div>

      {/* Filter Content */}
      <div className={`${isExpanded || 'lg:block' ? 'block' : 'hidden'} p-4 lg:p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          
          {/* Report Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Report Type</label>
            <select
              name="reportType"
              value={filters.reportType}
              onChange={onFiltersChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Term Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              name="termId"
              value={filters.termId}
              onChange={onFiltersChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              required
            >
              <option value="">Select Term</option>
                {Array.isArray(terms) && terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.term_name} ({term.exam_year})
                  </option>
                ))}
            </select>
          </div>

          {/* Grade Level Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Grade Level</label>
            <select
              name="gradeLevel"
              value={filters.gradeLevel}
              onChange={onFiltersChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {gradeLevels.map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>

          {/* Stream Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Stream Filter</label>
            <select
              name="streamFilter"
              value={filters.streamFilter}
              onChange={onFiltersChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {streamOptions.map(stream => (
                <option key={stream.value} value={stream.value}>{stream.label}</option>
              ))}
            </select>
          </div>

          {/* Class Selection - Conditional */}
          {filters.reportType === 'class' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                name="className"
                value={filters.className}
                onChange={onFiltersChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                required={filters.reportType === 'class'}
              >
                <option value="">Select Class</option>
                  {Array.isArray(classes) && classes
                    .filter(c => !filters.gradeLevel || c.class_name.includes(filters.gradeLevel))
                    .map(c => (
                      <option key={c.id} value={c.class_name}>{c.class_name}</option>
                    ))}
              </select>
            </div>
          )}

          {/* Academic Year */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Academic Year</label>
            <select
              name="academicYear"
              value={filters.academicYear}
              onChange={onFiltersChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Advanced Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Advanced Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="includeCommon"
                checked={filters.includeCommon}
                onChange={onFiltersChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Common Subjects</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="showRanking"
                checked={filters.showRanking}
                onChange={onFiltersChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Show Student Rankings</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="includeStats"
                checked={filters.includeStats}
                onChange={onFiltersChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Statistical Analysis</span>
            </label>

          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onGenerate}
            disabled={loading || !filters.termId}
            className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading || !filters.termId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </div>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Summary Statistics Component
const SummaryStats = ({ summary, reportType, className, gradeLevel }) => {
  const stats = [
    {
      label: 'Total Students',
      value: summary.totalStudents || 0,
      icon: '👥',
      color: 'bg-blue-500',
      change: summary.studentChange || 0
    },
    {
      label: 'Total Subjects',
      value: summary.totalSubjects || 0,
      icon: '📚',
      color: 'bg-green-500',
      change: summary.subjectChange || 0
    },
    {
      label: 'Average Score',
      value: `${summary.classAverage || 0}%`,
      icon: '📊',
      color: 'bg-yellow-500',
      change: summary.averageChange || 0
    },
    {
      label: 'Highest Score',
      value: `${summary.highestScore || 0}%`,
      icon: '🏆',
      color: 'bg-purple-500',
      change: summary.highestChange || 0
    },
    {
      label: 'Lowest Score',
      value: `${summary.lowestScore || 0}%`,
      icon: '📉',
      color: 'bg-red-500',
      change: summary.lowestChange || 0
    },
    {
      label: 'Pass Rate',
      value: `${summary.passRate || 0}%`,
      icon: '✅',
      color: 'bg-indigo-500',
      change: summary.passRateChange || 0
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Performance Summary</h3>
            <p className="text-sm text-gray-600 mt-1">
              {reportType === 'class' ? `Class: ${className}` :
               reportType === 'grade' ? `Grade Level: ${gradeLevel}` :
               'Overall Performance'}
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Real-time Data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                  {stat.icon}
                </div>
                {stat.change !== 0 && (
                  <div className={`flex items-center text-xs ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <svg className={`w-3 h-3 mr-1 ${stat.change > 0 ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mobile-Optimized Data Table
const DataTable = ({ reportData, subjects, onStudentClick, showRanking }) => {
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [searchTerm, setSearchTerm] = useState('');

  // Sort and filter data
  const processedData = useMemo(() => {
    let filtered = reportData.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.index_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'name') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [reportData, sortField, sortDirection, searchTerm]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => (
    <svg 
      className={`w-4 h-4 ml-1 transition-all ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`}
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
    </svg>
  );

  if (reportData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Report Data</h3>
          <p className="mt-2 text-gray-500">
            Configure your filters and generate a report to view student data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Table Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Student Performance Data</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {processedData.length} of {reportData.length} students
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Display */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showRanking && (
                  <th 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center">
                      Rank
                      <SortIcon field="rank" />
                    </div>
                  </th>
                )}
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('index_number')}
                >
                  <div className="flex items-center">
                    Index No
                    <SortIcon field="index_number" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Class
                </th>
                
                {/* Subject Columns */}
                {subjects.map(subject => (
                  <th key={subject.id} className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {subject.subject_name}
                  </th>
                ))}
                
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                  {showRanking && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.rank}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.index_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.current_class}
                  </td>
                  
                  {/* Subject Marks */}
                  {subjects.map(subject => {
                    const subjectMark = student.marks.find(m => m.subject_id === subject.id);
                    const markValue = subjectMark ? subjectMark.marks : '-';
                    const isLowScore = markValue !== '-' && markValue < 50;
                    const isHighScore = markValue !== '-' && markValue >= 75;
                    
                    return (
                      <td key={subject.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                        isLowScore ? 'text-red-600 font-bold' : 
                        isHighScore ? 'text-green-600 font-bold' : 
                        'text-gray-900'
                      }`}>
                        {markValue}
                      </td>
                    );
                  })}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600">
                    {student.totalMarks.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600">
                    {student.average}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Card View for Mobile
        <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedData.map((student) => (
            <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{student.name}</h4>
                  <p className="text-sm text-gray-600">{student.index_number}</p>
                </div>
                {showRanking && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Rank #{student.rank}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-sm">
                  <span className="text-gray-600">Class:</span>
                  <span className="font-medium ml-1">{student.current_class}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Average:</span>
                  <span className="font-medium ml-1 text-green-600">{student.average}%</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">Top Subjects:</h5>
                {student.marks
                  .sort((a, b) => b.marks - a.marks)
                  .slice(0, 3)
                  .map((mark, index) => (
                    <div key={index} className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700">{mark.subject_name}</span>
                      <span className={`font-medium ${
                        mark.marks < 50 ? 'text-red-600' : 
                        mark.marks >= 75 ? 'text-green-600' : 
                        'text-gray-900'
                      }`}>
                        {mark.marks}
                      </span>
                    </div>
                  ))}
              </div>
              
              <button
                onClick={() => onStudentClick(student)}
                className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Full Details →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Export Controls Component
const ExportControls = ({ 
  onExportPDF, 
  onExportCSV, 
  onExportExcel, 
  onExportSubjectAnalysis, 
  reportData, 
  currentTerm, 
  filters 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  const handleExport = async (fn, type) => {
    setIsExporting(true);
    setExportType(type);
    try {
      await fn();
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  const exportOptions = [
    {
      label: 'PDF Report',
      icon: '📄',
      onClick: onExportPDF,
      type: 'pdf',
      description: 'Printable mark sheet format'
    },
    {
      label: 'CSV Data',
      icon: '📊',
      onClick: onExportCSV,
      type: 'csv',
      description: 'Raw data for analysis'
    },
    {
      label: 'Excel Workbook',
      icon: '📑',
      onClick: onExportExcel,
      type: 'excel',
      description: 'Multiple sheets with formatting'
    },
    {
      label: 'Subject Analysis',
      icon: '📈',
      onClick: onExportSubjectAnalysis,
      type: 'analysis',
      description: 'Detailed subject performance'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Export Reports</h3>
            <p className="text-sm text-gray-600 mt-1">
              Download reports in various formats for offline use
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {exportOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleExport(option.onClick, option.type)}
                disabled={isExporting || reportData.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isExporting || reportData.length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:text-blue-900 hover:shadow-md'
                }`}
              >
                {isExporting && exportType === option.type ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="mr-2 text-lg">{option.icon}</span>
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const ClassReport = () => {
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);

  const [filters, setFilters] = useState({
    termId: '',
    className: '',
    gradeLevel: '',
    streamFilter: '',
    reportType: 'class',
    academicYear: new Date().getFullYear(),
    includeCommon: true,
    showRanking: true,
    includeStats: true
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load terms - FIXED data access
      const termsResponse = await termApi.getAll();
      if (termsResponse.success) {
        // Handle different response formats
        let termsData = termsResponse.data;
        if (Array.isArray(termsData)) {
          setTerms(termsData);
        } else if (termsData && Array.isArray(termsData.terms)) {
          setTerms(termsData.terms);
        } else if (termsData && termsData.data && Array.isArray(termsData.data)) {
          setTerms(termsData.data);
        } else {
          console.warn('Unexpected terms response format:', termsResponse);
          setTerms([]);
        }
      } else {
        throw new Error(termsResponse.error || 'Failed to load terms');
      }

      // Load classes - FIXED data access
      const classesResponse = await classApi.getAll();
      if (classesResponse.success) {
        // Handle different response formats
        let classesData = classesResponse.data;
        if (Array.isArray(classesData)) {
          setClasses(classesData);
        } else if (classesData && Array.isArray(classesData.classes)) {
          setClasses(classesData.classes);
        } else if (classesData && classesData.data && Array.isArray(classesData.data)) {
          setClasses(classesData.data);
        } else {
          console.warn('Unexpected classes response format:', classesResponse);
          setClasses([]);
        }
      } else {
        throw new Error(classesResponse.error || 'Failed to load classes');
      }

      // Load subjects - FIXED data access
      const subjectsResponse = await subjectApi.getAll();
      if (subjectsResponse.success) {
        // Handle different response formats
        let subjectsData = subjectsResponse.data;
        if (Array.isArray(subjectsData)) {
          setSubjects(subjectsData);
        } else if (subjectsData && Array.isArray(subjectsData.subjects)) {
          setSubjects(subjectsData.subjects);
        } else if (subjectsData && subjectsData.data && Array.isArray(subjectsData.data)) {
          setSubjects(subjectsData.data);
        } else {
          console.warn('Unexpected subjects response format:', subjectsResponse);
          setSubjects([]);
        }
      } else {
        throw new Error(subjectsResponse.error || 'Failed to load subjects');
      }

    } catch (err) {
      setError(err.message);
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateReport = async () => {
    if (!filters.termId) {
      setError('Please select a term');
      return;
    }

    if (filters.reportType === 'class' && !filters.className) {
      setError('Please select a class');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('Generating report with filters:', filters);

      const response = await reportApi.getClassReport({
        termId: filters.termId,
        className: filters.className,
        gradeLevel: filters.gradeLevel,
        streamFilter: filters.streamFilter,
        reportType: filters.reportType,
        academicYear: filters.academicYear,
        includeCommon: filters.includeCommon
      });

      console.log('Report API response:', response);

      if (response.success) {
        // Handle the nested response structure
        const responseData = response.data || {};
        
        // Set report data with safe defaults and proper structure
        const reportData = responseData.reportData || [];
        console.log('Processing report data:', reportData.length, 'students');
        
        setReportData(reportData);
        setSummary(responseData.summary || {});
        setCurrentTerm(responseData.term || null);
        
        const termName = responseData.term?.term_name || 'selected term';
        setSuccess(`Report generated successfully for ${termName} - Found ${reportData.length} students`);
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Class Performance Report', 105, 15, { align: 'center' });
      
      // Add term info
      doc.setFontSize(12);
      doc.text(`Term: ${currentTerm?.term_name || 'N/A'}`, 20, 25);
      doc.text(`Academic Year: ${filters.academicYear}`, 20, 35);
      
      if (filters.reportType === 'class') {
        doc.text(`Class: ${filters.className}`, 20, 45);
      }
      
      // Add table
      doc.autoTable({
        startY: 55,
        head: [['Index No', 'Name', 'Class', 'Total Marks', 'Average']],
        body: reportData.map(student => [
          student.index_number,
          student.name,
          student.current_class,
          student.totalMarks.toFixed(2),
          `${student.average}%`
        ])
      });
      
      doc.save(`class-report-${filters.className}-${filters.academicYear}.pdf`);
      setSuccess('PDF exported successfully');
    } catch (err) {
      setError('Failed to export PDF');
      console.error('PDF export error:', err);
    }
  };

  const exportCSV = async () => {
    try {
      const csvData = reportData.map(student => ({
        'Index Number': student.index_number,
        'Name': student.name,
        'Class': student.current_class,
        'Total Marks': student.totalMarks.toFixed(2),
        'Average': `${student.average}%`,
        ...student.marks.reduce((acc, mark) => {
          acc[mark.subject_name] = mark.marks;
          return acc;
        }, {})
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `class-report-${filters.className}-${filters.academicYear}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('CSV exported successfully');
    } catch (err) {
      setError('Failed to export CSV');
      console.error('CSV export error:', err);
    }
  };

  const exportExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Main data sheet
      const wsData = XLSX.utils.json_to_sheet(
        reportData.map(student => ({
          'Index Number': student.index_number,
          'Name': student.name,
          'Class': student.current_class,
          'Total Marks': student.totalMarks.toFixed(2),
          'Average': `${student.average}%`,
          ...student.marks.reduce((acc, mark) => {
            acc[mark.subject_name] = mark.marks;
            return acc;
          }, {})
        }))
      );
      
      XLSX.utils.book_append_sheet(wb, wsData, 'Student Data');
      
      // Summary sheet
      const wsSummary = XLSX.utils.json_to_sheet([
        { 'Metric': 'Total Students', 'Value': summary.totalStudents || 0 },
        { 'Metric': 'Total Subjects', 'Value': summary.totalSubjects || 0 },
        { 'Metric': 'Class Average', 'Value': `${summary.classAverage || 0}%` },
        { 'Metric': 'Highest Score', 'Value': `${summary.highestScore || 0}%` },
        { 'Metric': 'Lowest Score', 'Value': `${summary.lowestScore || 0}%` },
        { 'Metric': 'Pass Rate', 'Value': `${summary.passRate || 0}%` }
      ]);
      
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      
      XLSX.writeFile(wb, `class-report-${filters.className}-${filters.academicYear}.xlsx`);
      setSuccess('Excel file exported successfully');
    } catch (err) {
      setError('Failed to export Excel file');
      console.error('Excel export error:', err);
    }
  };

  const exportSubjectAnalysis = async () => {
    try {
      // Implement subject analysis export logic here
      setSuccess('Subject analysis export feature coming soon');
    } catch (err) {
      setError('Failed to export subject analysis');
      console.error('Subject analysis export error:', err);
    }
  };

  const handleStudentClick = (student) => {
    // Implement student detail view
    console.log('Student clicked:', student);
    setSuccess(`Viewing details for ${student.name}`);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading && terms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <LoadingSpinner message="Loading report system..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Class Performance Reports
          </h1>
          <p className="text-lg text-gray-600">
            Generate comprehensive academic performance reports for classes, grades, and streams
          </p>
        </div>

        {/* Messages */}
        <div className="mb-6">
          {error && (
            <MessageCard 
              type="error" 
              message="Error" 
              details={error} 
              onClose={clearMessages}
            />
          )}
          {success && (
            <MessageCard 
              type="success" 
              message="Success" 
              details={success} 
              onClose={clearMessages}
            />
          )}
        </div>

        {/* Filters */}
        <FilterSection
          filters={filters}
          onFiltersChange={handleFiltersChange}
          terms={terms}
          classes={classes}
          subjects={subjects}
          loading={loading}
          onGenerate={generateReport}
        />

        {/* Export Controls */}
        {reportData.length > 0 && (
          <ExportControls
            onExportPDF={exportPDF}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportSubjectAnalysis={exportSubjectAnalysis}
            reportData={reportData}
            currentTerm={currentTerm}
            filters={filters}
          />
        )}

        {/* Summary Statistics */}
        {reportData.length > 0 && (
          <SummaryStats
            summary={summary}
            reportType={filters.reportType}
            className={filters.className}
            gradeLevel={filters.gradeLevel}
          />
        )}

        {/* Data Table */}
        {loading ? (
          <LoadingSpinner message="Generating report data..." />
        ) : (
          reportData.length > 0 && (
            <DataTable
              reportData={reportData}
              subjects={subjects}
              onStudentClick={handleStudentClick}
              showRanking={filters.showRanking}
            />
          )
        )}

        {/* Empty State */}
        {!loading && reportData.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated Yet</h3>
            <p className="text-gray-500 mb-6">
              Configure your filters above and click "Generate Report" to view class performance data.
            </p>
            <div className="text-sm text-gray-400">
              <p>• Select a term and class to get started</p>
              <p>• Choose from different report types for various insights</p>
              <p>• Export reports in multiple formats for offline use</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassReport;