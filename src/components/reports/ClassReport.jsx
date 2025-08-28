// src/components/reports/ClassReport.jsx - ENHANCED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { termApi, classApi, reportApi } from '../../services';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

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
  const [reportData, setReportData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState({});
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filters, setFilters] = useState({
    reportType: 'class', // 'class' or 'term'
    termId: '',
    className: '',
    includeCommon: true
  });

  // Load initial data for dropdowns
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [termsRes, classesRes] = await Promise.all([
        termApi.getTerms(),
        classApi.getClasses()
      ]);
      
      const termsData = termsRes.data?.terms || [];
      setTerms(termsData);
      if (termsData.length > 0) {
        setFilters(prev => ({ ...prev, termId: termsData[0].id.toString() }));
      }

      const classesData = classesRes.data?.classes || [];
      setClasses(classesData);
      if (classesData.length > 0) {
        setFilters(prev => ({ ...prev, className: classesData[0].class_name }));
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

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // If report type is changed to full term, clear the class name
    if (name === 'reportType' && value === 'term') {
      setFilters(prev => ({ ...prev, className: '' }));
    }
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
    setSubjects([]);
    setSummary({});
    setCurrentTerm(null);

    try {
      const reportFilters = { 
        term_id: filters.termId,
        include_common: filters.includeCommon
      };
      
      if (filters.reportType === 'class') {
        reportFilters.class_name = filters.className;
      }
      
      const response = await reportApi.getTermReport(reportFilters);
      
      if (response.success) {
        setReportData(response.data?.students || []);
        setSubjects(response.data?.subjects || []);
        setSummary(response.data?.summary || {});
        setCurrentTerm(response.data?.term || null);
        setSuccess(`Report generated successfully. Found ${response.data?.students?.length || 0} students.`);
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
    if (reportData.length === 0) return;

    const doc = new jsPDF();
    const termName = currentTerm ? `${currentTerm.term_name} (${currentTerm.exam_year})` : 'Term Report';
    const reportType = filters.reportType === 'class' ? `Class: ${filters.className}` : 'Full Term';
    const title = `Mark Sheet - ${reportType} - ${termName}`;

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 24);
    
    // Summary table
    const summaryData = [
      ['Total Students', summary.totalStudents || 0],
      ['Total Subjects', summary.totalSubjects || 0],
      ['Class Average', `${summary.classAverage || 0}%`],
      ['Highest Score', `${summary.highestScore || 0}%`],
      ['Lowest Score', `${summary.lowestScore || 0}%`]
    ];
    
    doc.autoTable({
      head: [['Metric', 'Value']],
      body: summaryData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Student marks table
    const tableColumn = ["Rank", "Index No", "Name", "Class"];
    
    // Add subject columns
    subjects.forEach(subject => {
      tableColumn.push(subject.name);
    });
    
    tableColumn.push("Total");
    tableColumn.push("Average");
    
    const tableRows = [];
    
    reportData.forEach(student => {
      const studentData = [
        student.rank,
        student.index_number,
        student.name,
        student.current_class
      ];
      
      // Add marks for each subject
      subjects.forEach(subject => {
        const subjectMark = student.marks.find(m => m.subject_id === subject.id);
        studentData.push(subjectMark ? subjectMark.marks : '-');
      });
      
      studentData.push(student.totalMarks.toFixed(2));
      studentData.push(`${student.average}%`);
      
      tableRows.push(studentData);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: doc.lastAutoTable.finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 }
      }
    });
    
    doc.save(`${title.replace(/\s/g, '_')}.pdf`);
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    
    const csvData = reportData.map(student => {
      const studentRow = {
        Rank: student.rank,
        Index_Number: student.index_number,
        Name: student.name,
        Class: student.current_class
      };
      
      // Add marks for each subject
      subjects.forEach(subject => {
        const subjectMark = student.marks.find(m => m.subject_id === subject.id);
        studentRow[subject.name.replace(/\s/g, '_')] = subjectMark ? subjectMark.marks : '';
      });
      
      studentRow.Total_Marks = student.totalMarks.toFixed(2);
      studentRow.Average_Percentage = student.average;
      
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

  const handleExportSubjectAnalysis = async () => {
    if (!filters.termId) {
      setError("Please select a term to export subject analysis.");
      return;
    }

    setLoading(true);
    try {
      const analysisFilters = { term_id: filters.termId };
      if (filters.reportType === 'class') {
        analysisFilters.class_name = filters.className;
      }
      
      const response = await reportApi.getSubjectAnalysis(analysisFilters);
      
      if (response.success) {
        const csvData = response.data.subjectAnalysis.map(subject => ({
          Subject_Code: subject.subject_code,
          Subject_Name: subject.subject_name,
          Stream: subject.stream,
          Student_Count: subject.student_count,
          Average_Marks: subject.average_marks,
          Highest_Marks: subject.highest_marks,
          Lowest_Marks: subject.lowest_marks,
          Distinction_Count: subject.distinction_count,
          Credit_Count: subject.credit_count,
          Pass_Count: subject.pass_count,
          Fail_Count: subject.fail_count
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = filters.reportType === 'class' 
          ? `Class_${filters.className}_Subject_Analysis.csv` 
          : 'Full_Term_Subject_Analysis.csv';
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess('Subject analysis exported successfully.');
      } else {
        throw new Error(response.error || 'Failed to generate subject analysis');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Student Mark Sheets</h2>
      
      {/* --- Filters Section --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
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
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.term_name} ({term.exam_year})
                </option>
              ))}
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
              {classes.map(c => (
                <option key={c.id} value={c.class_name}>{c.class_name}</option>
              ))}
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeCommon" className="ml-2 block text-sm text-gray-900">
              Include Common Subjects
            </label>
          </div>
          
          {/* Generate Button */}
          <button 
            onClick={handleGenerateReport} 
            disabled={loading} 
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      {/* --- Report Display Section --- */}
      {loading && <Spinner />}

      {!loading && reportData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden mb-8">
          <div className="p-4 flex justify-between items-center border-b">
            <div>
              <h3 className="text-xl font-semibold">Mark Sheet Results</h3>
              <p className="text-sm text-gray-600">
                {currentTerm && `${currentTerm.term_name} (${currentTerm.exam_year})`}
                {filters.reportType === 'class' && ` • Class: ${filters.className}`}
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleExportCSV} 
                className="bg-green-600 text-white px-4 py-2 text-sm rounded-md hover:bg-green-700"
              >
                Export CSV
              </button>
              <button 
                onClick={handleExportPDF} 
                className="bg-red-600 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700"
              >
                Export PDF
              </button>
              <button 
                onClick={handleExportSubjectAnalysis} 
                className="bg-purple-600 text-white px-4 py-2 text-sm rounded-md hover:bg-purple-700"
              >
                Subject Analysis
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Index No</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Class</th>
                  
                  {/* Subject Columns */}
                  {subjects.map(subject => (
                    <th key={subject.id} className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                      {subject.name}
                    </th>
                  ))}
                  
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Average</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((student) => (
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
        </div>
      )}

      {!loading && !error && reportData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Report Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select your filters and click "Generate Report" to view data.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassReport;