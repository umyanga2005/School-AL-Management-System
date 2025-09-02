// src/components/reports/ClassReport.jsx - UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { termApi, classApi, reportApi, savedReportsApi } from '../../services';
import { ReportPDF } from './ReportPDF';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// A simple loading spinner component
const Spinner = () => (
  <div className="flex items-center justify-center min-h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// An error message component
const ErrorMessage = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
    <div className="flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
      </svg>
      {message}
    </div>
  </div>
);

// A success message component
const SuccessMessage = ({ message }) => (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
    <div className="flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
      {message}
    </div>
  </div>
);

const ClassReport = () => {
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [filteredReportData, setFilteredReportData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState({});
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [activeTerms, setActiveTerms] = useState([]);
  const [sections, setSections] = useState([]);

  const [filters, setFilters] = useState({
    reportType: 'class',
    termId: '',
    className: '',
    academicYear: new Date().getFullYear(),
    includeCommon: true,
    rankingMethod: 'totalMarks',
    section: ''
  });

  // Load initial data for dropdowns
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [termsRes, classesRes, yearsRes, activeTermsRes] = await Promise.all([
        termApi.getTerms(),
        classApi.getClasses(),
        termApi.getStats(),
        termApi.getCurrentTerm()
      ]);
      
      const termsData = termsRes.data?.terms || [];
      setTerms(termsData);
      
      const classesData = classesRes.data?.classes || [];
      setClasses(classesData);
      
      // Extract sections from class names (Grade 12, Grade 13, etc.)
      const uniqueSections = [...new Set(classesData
        .map(c => c.class_name)
        .filter(name => name.match(/^(12|13)[A-Za-z0-9]*$/)) // Match classes starting with 12 or 13
        .map(name => name.substring(0, 2)) // Get first 2 characters (12 or 13)
        .map(grade => `Grade ${grade}`) // Format as "Grade 12", "Grade 13"
      )].sort();
      
      setSections(uniqueSections);
      
      if (classesData.length > 0) {
        setFilters(prev => ({ ...prev, className: classesData[0].class_name }));
      }

      // Extract academic years from terms
      const years = [...new Set(termsData.map(term => term.exam_year))].sort((a, b) => b - a);
      setAcademicYears(years);
      
      // Set active term if available
      if (activeTermsRes.data?.term) {
        setActiveTerms([activeTermsRes.data.term]);
        setFilters(prev => ({ ...prev, termId: activeTermsRes.data.term.id.toString() }));
      } else if (termsData.length > 0) {
        const recentTerm = termsData.sort((a, b) => b.exam_year - a.exam_year || b.term_number - a.term_number)[0];
        setFilters(prev => ({ ...prev, termId: recentTerm.id.toString() }));
      }

    } catch (err) {
      setError('Failed to load initial terms and classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter classes based on selected section
  useEffect(() => {
    if (filters.section) {
      const gradeNumber = filters.section.replace('Grade ', ''); // Extract "12" or "13"
      const filteredClasses = classes.filter(c => c.class_name.startsWith(gradeNumber));
      if (filteredClasses.length > 0 && !filteredClasses.some(c => c.class_name === filters.className)) {
        setFilters(prev => ({ ...prev, className: filteredClasses[0].class_name }));
      }
    }
  }, [filters.section, classes]);

  // Filter students based on search input
  useEffect(() => {
    if (studentSearch.trim() === '') {
      setFilteredReportData(reportData);
    } else {
      const searchTerm = studentSearch.toLowerCase();
      const filtered = reportData.filter(student => 
        student.name.toLowerCase().includes(searchTerm) || 
        student.index_number.toString().includes(searchTerm)
      );
      setFilteredReportData(filtered);
    }
  }, [studentSearch, reportData]);

  // Add new state for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'rank',
    direction: 'ascending'
  });

  // Add sorting handler
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to filteredReportData
  useEffect(() => {
    if (filteredReportData.length > 0 && sortConfig.key) {
      const sortedData = [...filteredReportData].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'rank':
            aValue = a.rank;
            bValue = b.rank;
            break;
          case 'index_number':
            aValue = a.index_number;
            bValue = b.index_number;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'class':
            aValue = a.current_class;
            bValue = b.current_class;
            break;
          case 'total':
            aValue = a.totalMarks;
            bValue = b.totalMarks;
            break;
          case 'average':
            const aNonCommon = a.marks.filter(m => 
              subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
            );
            aValue = aNonCommon.length > 0 
              ? aNonCommon.reduce((sum, m) => sum + m.marks, 0) / aNonCommon.length 
              : 0;
            
            const bNonCommon = b.marks.filter(m => 
              subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
            );
            bValue = bNonCommon.length > 0 
              ? bNonCommon.reduce((sum, m) => sum + m.marks, 0) / bNonCommon.length 
              : 0;
            break;
          default:
            const subjectMarkA = a.marks.find(m => {
              const subject = subjects.find(s => s.name === sortConfig.key);
              return subject && m.subject_id === subject.id;
            });
            const subjectMarkB = b.marks.find(m => {
              const subject = subjects.find(s => s.name === sortConfig.key);
              return subject && m.subject_id === subject.id;
            });
            
            aValue = subjectMarkA ? subjectMarkA.marks : 0;
            bValue = subjectMarkB ? subjectMarkB.marks : 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
      
      setFilteredReportData(sortedData);
    }
  }, [sortConfig, reportData, subjects]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilters(prev => {
      const newFilters = { 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      };
      
      // If report type is changed to full term, clear the class name
      if (name === 'reportType' && value === 'term') {
        newFilters.className = '';
      }
      
      // If ranking method is average or zscore, disable includeCommon
      if (name === 'rankingMethod' && (value === 'average' || value === 'zscore')) {
        newFilters.includeCommon = false;
      }
      
      return newFilters;
    });
  };

  const handleStudentSearch = (e) => {
    setStudentSearch(e.target.value);
  };

  // Calculate Z-Score for a student based on per-subject Z-scores
  const calculateZScore = (student, allStudents, subjects) => {
    const nonCommonSubjects = subjects.filter(subject => subject.stream !== 'Common');
    
    if (nonCommonSubjects.length === 0) return 0;

    let totalZScore = 0;
    let subjectsWithMarksCount = 0;

    nonCommonSubjects.forEach(subject => {
      const studentMark = student.marks.find(m => m.subject_id === subject.id && m.marks !== null);
      
      if (studentMark) {
        const allStudentsMarksForSubject = allStudents
          .map(s => s.marks.find(m => m.subject_id === subject.id && m.marks !== null)?.marks)
          .filter(mark => mark !== undefined);

        if (allStudentsMarksForSubject.length > 1) { // Need at least 2 data points for std dev
          const mean = allStudentsMarksForSubject.reduce((sum, mark) => sum + mark, 0) / allStudentsMarksForSubject.length;
          const squaredDiffs = allStudentsMarksForSubject.map(mark => Math.pow(mark - mean, 2));
          const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / allStudentsMarksForSubject.length;
          const stdDev = Math.sqrt(variance);

          if (stdDev !== 0) {
            totalZScore += (studentMark.marks - mean) / stdDev;
            subjectsWithMarksCount++;
          }
        }
      }
    });

    return subjectsWithMarksCount > 0 ? totalZScore / subjectsWithMarksCount : 0;
  };

  // Apply ranking based on selected method
  const applyRanking = (students, rankingMethod, subjects) => {
    let rankedStudents = [...students];
    
    if (rankingMethod === 'totalMarks') {
      rankedStudents.sort((a, b) => b.totalMarks - a.totalMarks);
    } else if (rankingMethod === 'average') {
      rankedStudents.sort((a, b) => {
        const aNonCommon = a.marks.filter(m => subjects.find(s => s.id === m.subject_id)?.stream !== 'Common' && m.marks !== null);
        const bNonCommon = b.marks.filter(m => subjects.find(s => s.id === m.subject_id)?.stream !== 'Common' && m.marks !== null);
        
        const aAvg = aNonCommon.length > 0 ? aNonCommon.reduce((sum, m) => sum + m.marks, 0) / aNonCommon.length : 0;
        const bAvg = bNonCommon.length > 0 ? bNonCommon.reduce((sum, m) => sum + m.marks, 0) / bNonCommon.length : 0;
        
        return bAvg - aAvg;
      });
    } else if (rankingMethod === 'zscore') {
      rankedStudents.forEach(student => {
        student.zScore = calculateZScore(student, students, subjects);
      });
      
      rankedStudents.sort((a, b) => b.zScore - a.zScore);
    }
    
    let currentRank = 0;
    let lastValue = -1;
    
    rankedStudents.forEach((student, index) => {
      let currentValue;
      
      if (rankingMethod === 'totalMarks') {
        currentValue = student.totalMarks;
      } else if (rankingMethod === 'average') {
        const nonCommon = student.marks.filter(m => subjects.find(s => s.id === m.subject_id)?.stream !== 'Common' && m.marks !== null);
        currentValue = nonCommon.length > 0 ? nonCommon.reduce((sum, m) => sum + m.marks, 0) / nonCommon.length : 0;
      } else {
        currentValue = student.zScore;
      }
      
      if (currentValue !== lastValue) {
        currentRank = index + 1;
        lastValue = currentValue;
      }
      
      student.rank = currentRank;
    });
    
    return rankedStudents;
  };

  // Function to handle blank mark sheet download
  const handleExportBlankMarksheet = () => {
    if (!filters.termId) {
      setError("Please select a term first.");
      return;
    }
    
    if (filters.reportType === 'class' && !filters.className) {
      setError("Please select a class for the blank mark sheet.");
      return;
    }

    // Check if we have student data
    const hasStudentData = filteredReportData.length > 0 || reportData.length > 0;
    
    if (!hasStudentData) {
      setError("No student data available. Please generate a report first.");
      return;
    }

    // Create blank data structure with all students but no marks
    const blankData = filteredReportData.length > 0 
      ? filteredReportData 
      : reportData;
    
    // Create blank mark sheet data
    const blankMarksheetData = blankData.map(student => {
      const blankStudent = { ...student };
      blankStudent.marks = subjects.map(subject => ({
        subject_id: subject.id,
        marks: "", // Mark as absent
        subject_name: subject.name
      }));
      blankStudent.totalMarks = 0;
      blankStudent.rank = 0;
      return blankStudent;
    });

    // Generate PDF with blank data
    ReportPDF.generatePDF({
      students: blankMarksheetData,
      subjects,
      summary: {
        totalStudents: blankMarksheetData.length,
        totalSubjects: subjects.length,
        classAverage: 0,
        highestScore: 0,
        lowestScore: 0
      },
      currentTerm,
      filters,
      className: filters.className
    });
  };

  const handleGenerateReport = async () => {
    if (!filters.termId) {
      setError("Please select a term.");
      return;
    }
    if (filters.reportType === 'class' && !filters.className) {
      setError("Please select a class for the class report.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setReportData([]);
    setFilteredReportData([]);
    setSubjects([]);
    setSummary({});
    setCurrentTerm(null);

    try {
      const reportFilters = { 
        term_id: filters.termId,
        include_common: filters.includeCommon,
        include_all_students: true // Ensure all students are returned
      };
      
      if (filters.reportType === 'class') {
        reportFilters.class_name = filters.className;
      }
      
      const response = await reportApi.getTermReport(reportFilters);
      
      if (response.success) {
        let studentsData = response.data?.students || [];
        let subjectsData = response.data?.subjects || [];
        
        // Process marks to show blank for missing marks
        studentsData.forEach(student => {
          student.marks = subjectsData.map(subject => {
            const existingMark = student.marks.find(m => m.subject_id === subject.id);
            return existingMark || {
              subject_id: subject.id,
              marks: "", // empty string for absent
              subject_name: subject.name
            };
          });
        });
        
        studentsData = applyRanking(studentsData, filters.rankingMethod, subjectsData);
        
        setReportData(studentsData);
        setFilteredReportData(studentsData);
        setSubjects(subjectsData);
        setSummary(response.data?.summary || {});
        setCurrentTerm(response.data?.term || null);
        setSuccess(`Report generated successfully. Found ${studentsData.length} students.`);
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (filteredReportData.length === 0) return;
    
    ReportPDF.generatePDF({
      students: filteredReportData,
      subjects,
      summary,
      currentTerm,
      filters,
      className: filters.className
    });
  };

  const handleExportExcel = () => {
    if (filteredReportData.length === 0) return;
    
    const excelData = filteredReportData.map(student => {
      const studentRow = {
        'Rank': student.rank,
        'Index Number': student.index_number,
        'Name': student.name,
        'Class': student.current_class
      };
      
      subjects.forEach(subject => {
        const subjectMark = student.marks.find(m => m.subject_id === subject.id);
        studentRow[subject.name] = subjectMark ? subjectMark.marks : '';
      });
      
      studentRow['Total Marks'] = student.totalMarks;
      
      // Always include average column
      const nonCommonMarks = student.marks.filter(m => 
        subjects.find(s => s.id === m.subject_id)?.stream !== 'Common' && m.marks !== null
      );
      studentRow['Average'] = nonCommonMarks.length > 0 
        ? (nonCommonMarks.reduce((sum, m) => sum + m.marks, 0) / nonCommonMarks.length)
        : 0;
      
      if (filters.rankingMethod === 'zscore') {
        studentRow['Z-Score'] = student.zScore || 0;
      }
      
      return studentRow;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Mark Sheet');
    
    const fileName = filters.reportType === 'class' 
      ? `Class_${filters.className}_Mark_Sheet.xlsx` 
      : 'Full_Term_Mark_Sheet.xlsx';
    
    XLSX.writeFile(wb, fileName);
  };

  const handleExportCSV = () => {
    if (filteredReportData.length === 0) return;
    
    const csvData = filteredReportData.map(student => {
      const studentRow = {
        Rank: student.rank,
        Index_Number: student.index_number,
        Name: student.name,
        Class: student.current_class
      };
      
      subjects.forEach(subject => {
        const subjectMark = student.marks.find(m => m.subject_id === subject.id);
        studentRow[subject.name.replace(/\s/g, '_')] = subjectMark ? subjectMark.marks : '';
      });
      
      studentRow.Total_Marks = student.totalMarks.toFixed(2);
      
      // Always include average
      const nonCommonMarks = student.marks.filter(m => 
        subjects.find(s => s.id === m.subject_id)?.stream !== 'Common' && m.marks !== null
      );
      studentRow.Average = nonCommonMarks.length > 0 
        ? (nonCommonMarks.reduce((sum, m) => sum + m.marks, 0) / nonCommonMarks.length).toFixed(2)
        : '0.00';
      
      if (filters.rankingMethod === 'zscore') {
        studentRow.Z_Score = student.zScore ? student.zScore.toFixed(2) : '0.00';
      }
      
      return studentRow;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = filters.reportType === 'class' 
      ? `Class_${filters.className}_Mark_Sheet.csv` 
      : 'Full_Term_Mark_Sheet.csv';
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveReport = async () => {
    if (filteredReportData.length === 0) return;
    
    setLoading(true);
    try {
      const reportToSave = {
        termId: parseInt(filters.termId),
        className: filters.reportType === 'class' ? filters.className : null,
        academicYear: parseInt(filters.academicYear),
        rankingMethod: filters.rankingMethod,
        reportData: {
          students: filteredReportData.map(student => ({
            id: student.id,
            index_number: student.index_number,
            name: student.name,
            class: student.current_class,
            rank: student.rank,
            totalMarks: student.totalMarks,
            average: student.average,
            zScore: student.zScore,
            marks: student.marks
          })),
          subjects: subjects,
          summary: summary
        }
      };
      
      const response = await savedReportsApi.saveReport(reportToSave);
      
      if (response.success) {
        setSuccess('Report saved successfully for future reference.');
      } else {
        throw new Error(response.error || 'Failed to save report');
      }
    } catch (err) {
      setError('Failed to save report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Student Mark Sheets</h2>
      
      {/* --- Filters Section --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 items-end">
          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select 
              name="section" 
              value={filters.section} 
              onChange={handleFilterChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
          
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select 
              name="reportType" 
              value={filters.reportType} 
              onChange={handleFilterChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="class">Class Report</option>
              <option value="term">Full Term Report</option>
            </select>
          </div>
          
          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select 
              name="academicYear" 
              value={filters.academicYear} 
              onChange={handleFilterChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select 
              name="termId" 
              value={filters.termId} 
              onChange={handleFilterChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Term</option>
              {terms
                .filter(term => term.exam_year == filters.academicYear)
                .map(term => (
                  <option key={term.id} value={term.id}>
                    {term.term_name} {activeTerms.some(t => t.id === term.id) && '(Active)'}
                  </option>
                ))
              }
            </select>
          </div>
          
          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select 
              name="className" 
              value={filters.className} 
              onChange={handleFilterChange} 
              disabled={filters.reportType === 'term'} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Class</option>
              {classes
                .filter(c => {
                  if (!filters.section) return true;
                  const gradeNumber = filters.section.replace('Grade ', '');
                  return c.class_name.startsWith(gradeNumber);
                })
                .map(c => (
                  <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
                ))}
            </select>
          </div>
          
          {/* Ranking Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ranking Method</label>
            <select 
              name="rankingMethod" 
              value={filters.rankingMethod} 
              onChange={handleFilterChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="totalMarks">Total Marks</option>
              <option value="average">Average (No Common)</option>
              <option value="zscore">Z-Score (No Common)</option>
            </select>
          </div>
          
          {/* Include Common Subjects */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeCommon"
              name="includeCommon"
              checked={filters.includeCommon}
              onChange={handleFilterChange}
              disabled={filters.rankingMethod === 'average' || filters.rankingMethod === 'zscore'}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeCommon" className="ml-2 block text-sm text-gray-900">
              Include Common Subjects
              {(filters.rankingMethod === 'average' || filters.rankingMethod === 'zscore') && 
                <span className="text-xs text-gray-500 ml-1">(Disabled for this ranking method)</span>
              }
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          {/* Student Search */}
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <input
              type="text"
              placeholder="Search by name or index number..."
              value={studentSearch}
              onChange={handleStudentSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={reportData.length === 0}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            {/* Blank Mark Sheet Button */}
            <button 
              onClick={handleExportBlankMarksheet} 
              disabled={loading || !filters.termId || (filters.reportType === 'class' && !filters.className)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300"
            >
              Download Blank Mark Sheet
            </button>
            
            {/* Generate Button */}
            <button 
              onClick={handleGenerateReport} 
              disabled={loading} 
              className="bg-blue-600 text-white px-6 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      {/* --- Report Display Section --- */}
      {loading && <Spinner />}

      {!loading && filteredReportData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden mb-8">
          <div className="p-4 flex justify-between items-center border-b">
            <div>
              <h3 className="text-xl font-semibold">Mark Sheet Results</h3>
              <p className="text-sm text-gray-600">
                {currentTerm && `${currentTerm.term_name} (${currentTerm.exam_year})`}
                {filters.reportType === 'class' && ` • Class: ${filters.className}`}
                {` • Ranking by: ${filters.rankingMethod === 'totalMarks' ? 'Total Marks' : 
                  filters.rankingMethod === 'average' ? 'Average (No Common Subjects)' : 'Z-Score (No Common Subjects)'}`}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredReportData.length} of {reportData.length} students
                {studentSearch && ` filtered by "${studentSearch}"`}
              </p>
            </div>
            <div className="flex space-x-2 flex-wrap gap-2">
              <button 
                onClick={handleExportExcel} 
                className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700"
              >
                Export Excel
              </button>
              <button 
                onClick={handleExportPDF} 
                className="bg-red-600 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700"
              >
                Export PDF
              </button>
            </div>
          </div>
          
          {/* Summary Section */}
          <div className="p-4 bg-gray-50 border-b">
            <h4 className="text-lg font-medium mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-xl font-bold">{summary.totalStudents || 0}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Total Subjects</p>
                <p className="text-xl font-bold">{summary.totalSubjects || 0}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Class Average</p>
                <p className="text-xl font-bold">{summary.classAverage || 0}%</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Highest Score</p>
                <p className="text-xl font-bold">{summary.highestScore || 0}%</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Lowest Score</p>
                <p className="text-xl font-bold">{summary.lowestScore || 0}%</p>
              </div>
            </div>
          </div>
          
          {/* Detailed Marks Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('rank')}
                  >
                    Rank {sortConfig.key === 'rank' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>

                  <th 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('index_number')}
                  >
                    Index No {sortConfig.key === 'index_number' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Class
                  </th>
                  
                  {/* Subject Columns */}
                  {subjects.map(subject => (
                    <th key={subject.id} className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {subject.name}
                    </th>
                  ))}
                  
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  
                  {/* Always show average column */}
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Average
                  </th>
                  
                  {filters.rankingMethod === 'zscore' && (
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Z-Score
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReportData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.rank}
                    </td>
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
                      return (
                        <td key={subject.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {subjectMark ? subjectMark.marks : '-'}
                        </td>
                      );
                    })}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {student.totalMarks.toFixed(2)}
                    </td>
                    
                    {/* Always show average */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {(() => {
                        const nonCommonMarks = student.marks.filter(m => 
                          subjects.find(s => s.id === m.subject_id)?.stream !== 'Common' && m.marks !== null
                        );
                        return nonCommonMarks.length > 0 
                          ? (nonCommonMarks.reduce((sum, m) => sum + m.marks, 0) / nonCommonMarks.length).toFixed(2)
                          : '0.00';
                      })()}
                    </td>
                    
                    {filters.rankingMethod === 'zscore' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {student.zScore ? student.zScore.toFixed(2) : '0.00'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassReport;
