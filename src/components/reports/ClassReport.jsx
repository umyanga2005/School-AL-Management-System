// src/components/reports/ClassReport.jsx - COMPLETE ENHANCED VERSION
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
              {terms.map(term => (
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
                {classes
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
      description: 'Detailed subject statistics'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Export & Share</h3>
          <p className="text-sm text-gray-600 mt-1">
            {currentTerm ? `Term: ${currentTerm.term_name} (${currentTerm.exam_year})` : 'Select a term'} · 
            <span className="ml-1">
              {reportData?.length || 0} students · Filters: {filters.reportType}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {exportOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleExport(opt.onClick, opt.type)}
              disabled={isExporting}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isExporting && exportType === opt.type
                  ? 'bg-gray-300 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={opt.description}
            >
              <span>{opt.icon}</span>
              <span>{isExporting && exportType === opt.type ? 'Working...' : opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Lightweight Student Details Modal
const StudentModal = ({ student, subjects, onClose }) => {
  if (!student) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h4 className="text-lg font-semibold">{student.name} · {student.index_number}</h4>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6">
          <div className="mb-4 text-sm text-gray-700">
            <span className="font-medium">Class:</span> {student.current_class} ·{' '}
            <span className="font-medium">Average:</span> {student.average}% ·{' '}
            <span className="font-medium">Total:</span> {Number(student.totalMarks).toFixed(2)}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Marks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {subjects.map((s) => {
                  const m = student.marks.find(mm => mm.subject_id === s.id);
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{s.subject_name}</td>
                      <td className={`px-4 py-2 text-sm text-right ${m && m.marks < 50 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {m ? m.marks : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-6 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold">Close</button>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN CONTAINER =====
const ClassReport = () => {
  const defaultFilters = {
    reportType: 'class',       // class | grade | stream | term
    termId: '',
    className: '',
    gradeLevel: '',            // '' | '12' | '13'
    streamFilter: '',          // '' | Arts | Commerce | Science | Technology | Common
    academicYear: new Date().getFullYear().toString(),
    includeCommon: true,
    showRanking: true,
    includeStats: true,
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch terms & classes on mount
  useEffect(() => {
    const init = async () => {
      const t = await termApi.getAll();  // expects [{id, term_name, exam_year}, ...]
      setTerms(t || []);
      const c = await classApi.getAll(); // expects [{id, class_name}, ...]
      setClasses(c || []);
    };
    init();
  }, []);

  // Fetch subjects based on chosen class/stream
  const loadSubjects = useCallback(async () => {
    if (filters.reportType === 'class' && filters.className) {
      const subs = await subjectApi.getByClass(filters.className); // /api/subjects/class/:className
      setSubjects(subs || []);
    } else {
      // Fallback: get all or by stream/common (you can adapt to your API)
      const subs = await subjectApi.getAll({
        stream: filters.streamFilter || undefined,
        includeCommon: filters.includeCommon
      });
      setSubjects(subs || []);
    }
  }, [filters.reportType, filters.className, filters.streamFilter, filters.includeCommon]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  // Filters change
  const handleFiltersChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Compute summary from report data
  const computeSummary = useCallback((data, subs) => {
    const totalStudents = data.length;
    const totalSubjects = subs.length;
    let highest = 0;
    let lowest = 100;
    let passCount = 0;
    let sumAverages = 0;

    data.forEach(s => {
      sumAverages += Number(s.average || 0);
      highest = Math.max(highest, Number(s.average || 0));
      lowest = Math.min(lowest, Number(s.average || 100));
      if (Number(s.average || 0) >= 50) passCount += 1;
    });

    const classAverage = totalStudents ? (sumAverages / totalStudents).toFixed(2) : 0;
    const passRate = totalStudents ? ((passCount / totalStudents) * 100).toFixed(2) : 0;

    return {
      totalStudents,
      totalSubjects,
      classAverage,
      highestScore: highest.toFixed(2),
      lowestScore: totalStudents ? lowest.toFixed(2) : 0,
      passRate
    };
  }, []);

  // Generate report
  const handleGenerate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const payload = {
        term_id: filters.termId,
        report_type: filters.reportType,
        class_name: filters.className || undefined,
        grade_level: filters.gradeLevel || undefined,
        stream: filters.streamFilter || undefined,
        include_common: filters.includeCommon,
        academic_year: filters.academicYear
      };

      const term = terms.find(t => String(t.id) === String(filters.termId));
      setCurrentTerm(term || null);

      const data = await reportApi.getTermReport(payload); 
      // expected shape per student: {
      //   id, index_number, name, current_class, rank (optional),
      //   marks: [{subject_id, subject_name, marks}], totalMarks, average
      // }

      // ensure totals/averages exist
      const normalized = (data || []).map(s => {
        const totalMarks = s.totalMarks ?? (s.marks || []).reduce((acc, m) => acc + Number(m.marks || 0), 0);
        const average = s.average ?? (subjects.length ? Math.round((totalMarks / subjects.length) * 100) / 100 : 0);
        return { ...s, totalMarks, average };
      });

      setReportData(normalized);
      setSummary(computeSummary(normalized, subjects));
      setMsg({ type: 'success', text: 'Report generated successfully.' });
    } finally {
      setLoading(false);
    }
  };

  // ===== Exports =====
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const title = `Class Report - ${currentTerm ? `${currentTerm.term_name} ${currentTerm.exam_year}` : ''}`;
    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    const subtitle = [
      `Report Type: ${filters.reportType}`,
      filters.className ? `Class: ${filters.className}` : null,
      filters.gradeLevel ? `Grade: ${filters.gradeLevel}` : null,
      filters.streamFilter ? `Stream: ${filters.streamFilter}` : null,
      `Year: ${filters.academicYear}`
    ].filter(Boolean).join(' · ');
    doc.text(subtitle, 40, 60);

    const head = [
      ...(filters.showRanking ? ['Rank'] : []),
      'Index No', 'Name', 'Class',
      ...subjects.map(s => s.subject_name),
      'Total', 'Average'
    ];

    const body = reportData.map(s => ([
      ...(filters.showRanking ? [s.rank ?? '-'] : []),
      s.index_number,
      s.name,
      s.current_class,
      ...subjects.map(sub => {
        const m = (s.marks || []).find(mm => mm.subject_id === sub.id);
        return m ? m.marks : '-';
      }),
      Number(s.totalMarks).toFixed(2),
      `${s.average}%`
    ]));

    doc.autoTable({
      head: [head],
      body,
      startY: 80,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175] },
      didDrawPage: (data) => {
        // footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleString()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
      }
    });

    const blob = doc.output('blob');
    downloadFile(blob, `class-report-${filters.reportType}-${filters.academicYear}.pdf`);
  };

  const exportCSV = async () => {
    const rows = reportData.map(s => {
      const row = {
        rank: filters.showRanking ? (s.rank ?? '') : undefined,
        index_number: s.index_number,
        name: s.name,
        class: s.current_class
      };
      subjects.forEach(sub => {
        const m = (s.marks || []).find(mm => mm.subject_id === sub.id);
        row[sub.subject_name] = m ? m.marks : '';
      });
      row.total = Number(s.totalMarks).toFixed(2);
      row.average = s.average;
      return row;
    });

    const csv = Papa.unparse(rows, { columns: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `class-report-${filters.reportType}-${filters.academicYear}.csv`);
  };

  const exportExcel = async () => {
    const wb = XLSX.utils.book_new();

    // Marks sheet
    const marksRows = reportData.map(s => {
      const row = {
        ...(filters.showRanking ? { Rank: s.rank ?? '' } : {}),
        'Index No': s.index_number,
        Name: s.name,
        Class: s.current_class
      };
      subjects.forEach(sub => {
        const m = (s.marks || []).find(mm => mm.subject_id === sub.id);
        row[sub.subject_name] = m ? m.marks : '';
      });
      row.Total = Number(s.totalMarks).toFixed(2);
      row.Average = s.average;
      return row;
    });
    const wsMarks = XLSX.utils.json_to_sheet(marksRows);
    XLSX.utils.book_append_sheet(wb, wsMarks, 'Marks');

    // Summary sheet
    const summaryRows = [
      { Metric: 'Total Students', Value: summary.totalStudents || 0 },
      { Metric: 'Total Subjects', Value: summary.totalSubjects || 0 },
      { Metric: 'Class Average', Value: `${summary.classAverage || 0}%` },
      { Metric: 'Highest Score', Value: `${summary.highestScore || 0}%` },
      { Metric: 'Lowest Score', Value: `${summary.lowestScore || 0}%` },
      { Metric: 'Pass Rate', Value: `${summary.passRate || 0}%` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Meta sheet
    const meta = [
      { Key: 'Report Type', Value: filters.reportType },
      { Key: 'Term', Value: currentTerm ? `${currentTerm.term_name} (${currentTerm.exam_year})` : '' },
      { Key: 'Class', Value: filters.className || '' },
      { Key: 'Grade', Value: filters.gradeLevel || '' },
      { Key: 'Stream', Value: filters.streamFilter || '' },
      { Key: 'Academic Year', Value: filters.academicYear },
      { Key: 'Include Common', Value: filters.includeCommon ? 'Yes' : 'No' },
      { Key: 'Show Ranking', Value: filters.showRanking ? 'Yes' : 'No' },
      { Key: 'Generated At', Value: new Date().toLocaleString() }
    ];
    const wsMeta = XLSX.utils.json_to_sheet(meta);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Meta');

    // (Optional) Subject Analysis sheet (pulls from API)
    try {
      const analysis = await reportApi.getSubjectAnalysis({
        term_id: filters.termId,
        class_name: filters.className || undefined,
        grade_level: filters.gradeLevel || undefined,
        stream: filters.streamFilter || undefined,
        include_common: filters.includeCommon
      });
      if (analysis && analysis.length) {
        const wsAnalysis = XLSX.utils.json_to_sheet(analysis);
        XLSX.utils.book_append_sheet(wb, wsAnalysis, 'Subject Analysis');
      }
    } catch (_) {}

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `class-report-${filters.reportType}-${filters.academicYear}.xlsx`);
  };

  const exportSubjectAnalysis = async () => {
    const analysis = await reportApi.getSubjectAnalysis({
      term_id: filters.termId,
      class_name: filters.className || undefined,
      grade_level: filters.gradeLevel || undefined,
      stream: filters.streamFilter || undefined,
      include_common: filters.includeCommon
    });
    const csv = Papa.unparse(analysis || [], { columns: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `subject-analysis-${filters.academicYear}.csv`);
  };

  return (
    <div className="bg-white rounded-xl shadow max-w-[100vw]">
      {/* Filters */}
      <FilterSection
        filters={filters}
        onFiltersChange={handleFiltersChange}
        terms={terms}
        classes={classes}
        subjects={subjects}
        loading={loading}
        onGenerate={handleGenerate}
      />

      {/* Messages */}
      {msg?.type && (
        <MessageCard
          type={msg.type}
          message={msg.text}
          onClose={() => setMsg(null)}
        />
      )}

      {/* Summary */}
      {filters.includeStats && reportData.length > 0 && (
        <SummaryStats
          summary={summary}
          reportType={filters.reportType}
          className={filters.className}
          gradeLevel={filters.gradeLevel}
        />
      )}

      {/* Data Table / Cards */}
      {loading ? (
        <LoadingSpinner message="Crunching numbers and building your report..." />
      ) : (
        <DataTable
          reportData={reportData}
          subjects={subjects}
          showRanking={filters.showRanking}
          onStudentClick={setSelectedStudent}
        />
      )}

      {/* Export Controls */}
      <div className="mt-6">
        <ExportControls
          onExportPDF={exportPDF}
          onExportCSV={exportCSV}
          onExportExcel={exportExcel}
          onExportSubjectAnalysis={exportSubjectAnalysis}
          reportData={reportData}
          currentTerm={currentTerm}
          filters={filters}
        />
      </div>

      {/* Student Modal */}
      <StudentModal
        student={selectedStudent}
        subjects={subjects}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default ClassReport;
