// src/components/reports/ClassReport.jsx - UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { termApi, classApi, reportApi, savedReportsApi, termAttendanceApi } from '../../services'; // Import termAttendanceApi
import { ReportPDF } from './ReportPDF';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ReportPDFTop10 } from './ReportPDFTop10';
import { ReportPDFMarksFilter } from './ReportPDFMarksFilter';

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
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1_0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
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

  const [filterPopupOpen, setFilterPopupOpen] = useState(false);

  const [marksFilter, setMarksFilter] = useState({
    section: '',
    className: '',         
    reportType: 'class',
    academicYear: new Date().getFullYear(),
    termId: '',
    minMarks: '',
    maxMarks: ''
  });

  // Define the desired subject order
  const desiredSubjectOrder = [
    'Sinhala', 'Geography', 'Logic', 'Drama', 'Economics', 'History', 'BC', 'Politicle Science',
    'Art', 'Dancing', 'Oriental Music', 'Home Economics', 'Media', 'English', 'ICT', 'Agri',
    'Statistics', 'Japanese', 'Chinese', 'Korean', 'French', 'Mathematics',
    'GIT', 'General English', 'General Test' // Common subjects
  ];

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
      if (activeTermsRes.success && activeTermsRes.data?.term) {
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
  }, []);  // <-- empty dependency array here

useEffect(() => {
  loadInitialData();
}, [loadInitialData]);


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
            // Average is always based on non-common subjects divided by 3,
            // treating null marks as 0 for calculation
            const aNonCommon = a.marks.filter(m => 
              subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
            );
            aValue = aNonCommon.length > 0 
              ? aNonCommon.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3 
              : 0;
            
            const bNonCommon = b.marks.filter(m => 
              subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
            );
            bValue = bNonCommon.length > 0 
              ? bNonCommon.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3 
              : 0;
            break;
          case 'absent_days':
            aValue = a.absent_days || 0;
            bValue = b.absent_days || 0;
            break;
          case 'attendance_percentage':
            // Ensure attendance_percentage is a number for sorting
            aValue = typeof a.attendance_percentage === 'number' ? a.attendance_percentage : -1; // Use -1 or some other default for non-numbers
            bValue = typeof b.attendance_percentage === 'number' ? b.attendance_percentage : -1;
            break;
          default:
            // For subject columns
            const subject = subjects.find(s => s.name === sortConfig.key);
            const subjectMarkA = subject ? a.marks.find(m => m.subject_id === subject.id) : null;
            const subjectMarkB = subject ? b.marks.find(m => m.subject_id === subject.id) : null;
            
            // Treat empty/null marks as 0 for sorting, so 'AB' sorts as 0
            aValue = subjectMarkA && subjectMarkA.marks !== null && subjectMarkA.marks !== "" ? subjectMarkA.marks : 0; 
            bValue = subjectMarkB && subjectMarkB.marks !== null && subjectMarkB.marks !== "" ? subjectMarkB.marks : 0;
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
      // The average calculation itself is always based on non-common subjects divided by 3,
      // so 'includeCommon' checkbox still affects the 'totalMarks' calculation.
      // So, we only disable it if the ranking method is average or zscore, as it's irrelevant for those.
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

    // Count how many non-common subjects the student has marks for (non-null and non-empty)
    const studentNonCommonMarksCount = student.marks.filter(m => 
      nonCommonSubjects.some(s => s.id === m.subject_id) && m.marks !== null && m.marks !== ""
    ).length;

    // Require at least 3 non-common subject marks to calculate Z-score
    if (studentNonCommonMarksCount < 3) {
      return 0;
    }

    let totalZScore = 0;
    let subjectsWithMarksCount = 0;

    nonCommonSubjects.forEach(subject => {
      const studentMark = student.marks.find(m => m.subject_id === subject.id && m.marks !== null && m.marks !== "");
      
      if (studentMark) {
        const allStudentsMarksForSubject = allStudents
          .map(s => s.marks.find(m => m.subject_id === subject.id && m.marks !== null && m.marks !== "")?.marks)
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
        // Average is always based on non-common subjects divided by 3,
        // treating null marks as 0 for calculation
        const aNonCommon = a.marks.filter(m => subjects.find(s => s.id === m.subject_id)?.stream !== 'Common');
        const bNonCommon = b.marks.filter(m => subjects.find(s => s.id === m.subject_id)?.stream !== 'Common');
        
        const aAvg = aNonCommon.length > 0 ? aNonCommon.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3 : 0;
        const bAvg = bNonCommon.length > 0 ? bNonCommon.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3 : 0;
        
        return bAvg - aAvg;
      });
    } else if (rankingMethod === 'zscore') {
      rankedStudents.forEach(student => {
        const rawZ = calculateZScore(student, students, subjects);
        // --- NEW: convert exact 0.0000 to -20 ---
        student.zScore = (rawZ !== undefined && rawZ.toFixed(4) === '0.0000')
          ? -20
          : rawZ;
      });

      // sort with the converted value
      rankedStudents.sort((a, b) => b.zScore - a.zScore);
    }

    let currentRank = 0;
    let lastValue = -1;
    
    rankedStudents.forEach((student, index) => {
      let currentValue;
      
      if (rankingMethod === 'totalMarks') {
        currentValue = student.totalMarks;
      } else if (rankingMethod === 'average') {
        const nonCommon = student.marks.filter(m => subjects.find(s => s.id === m.subject_id)?.stream !== 'Common');
        currentValue = nonCommon.length > 0 ? nonCommon.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3 : 0;
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

  // === NEW: export top10 students for Z-Score/Average Full Term report ===
  const handleExportTop10 = () => {
    if (filteredReportData.length === 0) return;
    const top10 = [...filteredReportData]
      .sort((a,b) => a.rank - b.rank)
      .slice(0,10);

    ReportPDFTop10.generatePDF({
      students: top10,
      currentTerm,
      filters
    });
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
        marks: "", // Mark as empty string for blank
        subject_name: subject.name,
        status: 'active' // Default status for blank
      }));
      blankStudent.totalMarks = 0;
      blankStudent.rank = 0;
      blankStudent.absent_days = null; // Set to null for blank attendance
      blankStudent.attendance_percentage = null; // Set to null for blank attendance
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
      className: filters.className,
      desiredSubjectOrder // Pass the desired subject order
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
      
      const [reportResponse, attendanceResponse] = await Promise.all([
        reportApi.getTermReport(reportFilters),
        termAttendanceApi.getTermAttendance({
          term_id: filters.termId,
          class: filters.className,
          academic_year: filters.academicYear
        })
      ]);

      if (reportResponse.success) {
        let studentsData = reportResponse.data?.students || [];
        let subjectsData = reportResponse.data?.subjects || [];
        
        // Process marks to show blank for missing marks
        studentsData.forEach(student => {
          student.marks = subjectsData.map(subject => {
            const existingMark = student.marks.find(m => m.subject_id === subject.id);
            return existingMark || {
              subject_id: subject.id,
              marks: "", // empty string for truly missing marks
              status: 'no_entry', // Custom status for no entry
              subject_name: subject.name
            };
          });
        });

        // Merge attendance data
        if (attendanceResponse.success) {
          // Extract the actual data array from the response
          const attendanceData = attendanceResponse.data.data || attendanceResponse.data;
          
          if (Array.isArray(attendanceData)) {
            const attendanceMap = new Map(attendanceData.map(att => [att.student_id, att]));
            studentsData = studentsData.map(student => {
              const studentAttendance = attendanceMap.get(student.id);
              return {
                ...student,
                absent_days: studentAttendance ? studentAttendance.absent_days : null,
                // FIX: Explicitly convert attendance_percentage to a number
                attendance_percentage: studentAttendance && studentAttendance.attendance_percentage !== null && studentAttendance.attendance_percentage !== ''
                                       ? parseFloat(studentAttendance.attendance_percentage) 
                                       : null,
                total_school_days: studentAttendance ? studentAttendance.total_school_days : null,
              };
            });
          } else {
            console.warn("Attendance data is not an array:", attendanceData);
            // If attendance data is not an array, ensure these fields are null
            studentsData = studentsData.map(student => ({
              ...student,
              absent_days: null,
              attendance_percentage: null,
              total_school_days: null,
            }));
          }
        } else {
          console.warn("Failed to load attendance data:", attendanceResponse.error);
          // If attendance data fails, ensure these fields are null
          studentsData = studentsData.map(student => ({
            ...student,
            absent_days: null,
            attendance_percentage: null,
            total_school_days: null,
          }));
        }
        
        studentsData = applyRanking(studentsData, filters.rankingMethod, subjectsData);
        

        // Calculate class Average
        let calculatedClassAverage = 0;
        if (filters.reportType === 'class' && studentsData.length > 0 && subjectsData.length > 0) {
          let totalMarksSum = 0;
          let totalMarksCount = 0;
        
          // Go through all students and all subjects
          studentsData.forEach(student => {
            student.marks.forEach(m => {
              totalMarksSum += (m.marks !== null ? m.marks : 0);
              totalMarksCount++;
            });
          });
        
          calculatedClassAverage = totalMarksCount > 0 ? (totalMarksSum / totalMarksCount) : 0;
        }


        setReportData(studentsData);
        setFilteredReportData(studentsData);
        setSubjects(subjectsData);
        setSummary({
          ...reportResponse.data?.summary || {},
          classAverage: calculatedClassAverage.toFixed(2) // Update class average here
        });
        setCurrentTerm(reportResponse.data?.term || null);
        setSuccess(`Report generated successfully. Found ${studentsData.length} students.`);
      } else {
        throw new Error(reportResponse.error || 'Failed to generate report');
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
      className: filters.className,
      desiredSubjectOrder // Pass the desired subject order
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
      
      // Add subjects in desired order
      desiredSubjectOrder.forEach(subjectName => {
        const subject = subjects.find(s => s.name === subjectName);
        const subjectMark = subject ? student.marks.find(m => m.subject_id === subject.id) : null;
        
        // Display 'AB' for null marks with 'absent' status, otherwise the mark or empty string
        studentRow[subjectName] = subjectMark && subjectMark.marks === null && subjectMark.status === 'absent' 
                                  ? 'AB' 
                                  : (subjectMark && subjectMark.marks !== "" ? subjectMark.marks : '');
      });

      studentRow['Total Marks'] = student.totalMarks;
      
      // Always include average column, calculated as sum of non-common subjects divided by 3
      const nonCommonMarks = student.marks.filter(m => 
        subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
      );
      studentRow['Average'] = nonCommonMarks.length > 0 
        ? (nonCommonMarks.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3)
        : 0;
      
      studentRow['Absent Days'] = student.absent_days !== null ? student.absent_days : '';
      // Ensure attendance_percentage is a number before calling toFixed
      studentRow['Percentage'] = typeof student.attendance_percentage === 'number' 
                                 ? student.attendance_percentage.toFixed(2) 
                                 : '';

      if (filters.rankingMethod === 'zscore') {
        // Apply -20 for Z-score if it's 0.0000
        studentRow['Z-Score'] = student.zScore !== undefined && student.zScore.toFixed(4) === '0.0000'
                                ? '-20.00'
                                : student.zScore.toFixed(2)
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
      
      // Add subjects in desired order
      desiredSubjectOrder.forEach(subjectName => {
        const subject = subjects.find(s => s.name === subjectName);
        const subjectMark = subject ? student.marks.find(m => m.subject_id === subject.id) : null;
        
        // Display 'AB' for null marks with 'absent' status, otherwise the mark or empty string
        studentRow[subjectName.replace(/\s/g, '_')] = subjectMark && subjectMark.marks === null && subjectMark.status === 'absent' 
                                                      ? 'AB' 
                                                      : (subjectMark && subjectMark.marks !== "" ? subjectMark.marks : '');
      });
      
      studentRow.Total_Marks = student.totalMarks.toFixed(2);
      
      // Always include average, calculated as sum of non-common subjects divided by 3
      const nonCommonMarks = student.marks.filter(m => 
        subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
      );
      studentRow.Average = nonCommonMarks.length > 0 
        ? (nonCommonMarks.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3).toFixed(2)
        : '0.00';
      
      studentRow.Absent_Days = student.absent_days !== null ? student.absent_days : '';
      // Ensure attendance_percentage is a number before calling toFixed
      studentRow.Attendance_Percentage = typeof student.attendance_percentage === 'number' 
                                         ? student.attendance_percentage.toFixed(2) 
                                         : '';

      if (filters.rankingMethod === 'zscore') {
        // Apply -20.00 for Z-score if it's 0.0000
        studentRow.Z_Score = student.zScore !== undefined && student.zScore.toFixed(4) === '0.0000'
                              ? '-20.00'
                              : student.zScore.toFixed(2)
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
            // The average stored here should also reflect the "sum of non-common subjects divided by 3" logic
            average: (() => {
              const nonCommonMarks = student.marks.filter(m => 
                subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
              );
              return nonCommonMarks.length > 0 
                ? (nonCommonMarks.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0) / 3)
                : 0;
            })(),
            zScore: student.zScore,
            marks: student.marks, // Keep original marks data including status
            absent_days: student.absent_days, // Include attendance data
            attendance_percentage: student.attendance_percentage // Include attendance data
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

  const handleGenerateMarksFilterPDF = async () => {
    const min = parseFloat(marksFilter.minMarks);
    const max = parseFloat(marksFilter.maxMarks);

    if (!marksFilter.termId || isNaN(min) || isNaN(max)) {
      alert('Please select term and valid mark range.');
      return;
    }

    // Fetch data like you do in handleGenerateReport
    const reportFilters = {
      term_id: marksFilter.termId,
      include_common: true,
      include_all_students: true
    };

    // Add class filter when report type is 'class'
    if (marksFilter.reportType === 'class' && marksFilter.className) {
      reportFilters.class_name = marksFilter.className;
    }

    const reportResponse = await reportApi.getTermReport(reportFilters);
    if (!reportResponse.success) return;

    const students = reportResponse.data.students;
    const subjects = reportResponse.data.subjects;
    const currentTermData = reportResponse.data.term;

    // Group by subject and filter marks
    const groupedData = subjects.map(subject => {
      const filtered = students
        .map(stu => {
          const markObj = stu.marks.find(m => m.subject_id === subject.id);
          const mark = markObj?.marks;
          return mark !== null && mark !== undefined && mark !== '' && mark >= min && mark <= max
            ? { name: stu.name, mark }
            : null;
        })
        .filter(Boolean);
      return { subject, students: filtered };
    }).filter(g => g.students.length > 0);

    if (groupedData.length === 0) {
      alert('No students found in this range.');
      return;
    }

    ReportPDFMarksFilter.generatePDF({
      groupedData,
      filters: marksFilter,
      currentTerm: currentTermData
    });

    setFilterPopupOpen(false);
  };


  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Student Mark Sheets
        </h2>
        <button
          onClick={() => setFilterPopupOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-purple-700 w-full sm:w-auto"
        >
          Filter Marks
        </button>
      </div>

      {filterPopupOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Filter Marks
                </h3>
                <button
                  onClick={() => setFilterPopupOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Section Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Section
                </label>
                <div className="relative">
                  <select
                    value={marksFilter.section}
                    onChange={(e) => setMarksFilter({ ...marksFilter, section: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            transition-all duration-200 appearance-none cursor-pointer
                            hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    <option value="">All Sections</option>
                    {sections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'class', label: 'Class Report', icon: '📊' },
                    { value: 'term', label: 'Full Term Report', icon: '📈' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setMarksFilter({ ...marksFilter, reportType: option.value })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        marksFilter.reportType === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Selection - Only show when report type is 'class' */}
              {marksFilter.reportType === 'class' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Class
                  </label>
                  <div className="relative">
                    <select
                      value={marksFilter.className}
                      onChange={(e) => setMarksFilter({ ...marksFilter, className: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent
                              transition-all duration-200 appearance-none cursor-pointer
                              hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      <option value="">Select Class</option>
                      {classes
                        .filter(c => {
                          if (!marksFilter.section) return true;
                          const gradeNumber = marksFilter.section.replace('Grade ', '');
                          return c.class_name.startsWith(gradeNumber);
                        })
                        .map(c => (
                          <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Year - Read Only */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Academic Year
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={marksFilter.academicYear}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                            bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400
                            cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Term */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Term
                </label>
                <div className="relative">
                  <select
                    value={marksFilter.termId}
                    onChange={(e) => setMarksFilter({ ...marksFilter, termId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            transition-all duration-200 appearance-none cursor-pointer
                            hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    <option value="">Select Term</option>
                    {terms
                      .filter(t => t.exam_year == marksFilter.academicYear)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.term_name}</option>
                      ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Marks Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Marks Range
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Minimum"
                      value={marksFilter.minMarks}
                      onChange={(e) => setMarksFilter({ ...marksFilter, minMarks: e.target.value })}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent
                              transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400
                              hover:border-gray-400 dark:hover:border-gray-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-400 text-sm">📊</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Maximum"
                      value={marksFilter.maxMarks}
                      onChange={(e) => setMarksFilter({ ...marksFilter, maxMarks: e.target.value })}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent
                              transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400
                              hover:border-gray-400 dark:hover:border-gray-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-400 text-sm">📈</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 rounded-b-2xl border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setFilterPopupOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                          text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700
                          hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200
                          font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateMarksFilterPDF}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl 
                          bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                          text-white font-medium shadow-lg hover:shadow-xl
                          transform hover:scale-105 transition-all duration-200
                          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
              <option value="average">Average (Non-Common / 3)</option>
              <option value="zscore">Z-Score (Non-Common)</option>
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
              Include Common Subjects (for Total Marks)
              {(filters.rankingMethod === 'average' || filters.rankingMethod === 'zscore') && 
                <span className="text-xs text-gray-500 ml-1">(Disabled for this ranking method)</span>
              }
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          {/* Student Search */}
          <div className="w-full md:w-1/2">
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
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
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
                  filters.rankingMethod === 'average' ? 'Average (Non-Common / 3)' : 'Z-Score (Non-Common Subjects)'}`}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredReportData.length} of {reportData.length} students
                {studentSearch && ` filtered by "${studentSearch}"`}
              </p>
            </div>
            <div className="flex space-x-2 flex-wrap gap-2">
            {/* --- NEW: Top10 Z/Average Export --- */}
            <button
              onClick={handleExportTop10}
              disabled={
                loading ||
                filters.reportType !== 'term' ||
                !['zscore','average'].includes(filters.rankingMethod)
              }
              className="bg-purple-600 text-white px-4 py-2 text-sm rounded-md hover:bg-purple-700 disabled:bg-gray-300"
            >
              Download Top 10 (Z/A)
            </button>
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
              {filters.reportType === 'class' && ( // Conditionally render Class Average
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Class Average</p>
                  <p className="text-xl font-bold">{summary.classAverage || '0.00'}%</p>
                </div>
              )}
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('class')}
                  >
                    Class {sortConfig.key === 'class' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  
                  {/* Subject Columns in desired order */}
                  {desiredSubjectOrder.map(subjectName => {
                    const subject = subjects.find(s => s.name === subjectName);
                    return (
                      <th 
                        key={subjectName} 
                        className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort(subjectName)}
                      >
                        {subjectName} {sortConfig.key === subjectName && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                      </th>
                    );
                  })}
                  
                  <th 
                    className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('total')}
                  >
                    Total {sortConfig.key === 'total' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  
                  <th 
                    className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('average')}
                  >
                    Avg {sortConfig.key === 'average' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>

                  <th 
                    className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('absent_days')}
                  >
                    Absent Days {sortConfig.key === 'absent_days' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('attendance_percentage')}
                  >
                    Percentage {sortConfig.key === 'attendance_percentage' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
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
                    
                    {/* Subject Marks in desired order */}
                    {desiredSubjectOrder.map(subjectName => {
                      const subject = subjects.find(s => s.name === subjectName);
                      const subjectMark = subject ? student.marks.find(m => m.subject_id === subject.id) : null;
                      return (
                        <td key={subjectName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {subjectMark && subjectMark.marks === null && subjectMark.status === 'absent' 
                            ? 'AB' 
                            : (subjectMark && subjectMark.marks !== "" ? subjectMark.marks : '-')}
                        </td>
                      );
                    })}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {student.totalMarks.toFixed(2)}
                    </td>
                    
                    {/* Always show average, calculated as sum of non-common subjects divided by 3 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {(() => {
                        const nonCommonMarks = student.marks.filter(m => 
                          subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
                        );
                        // Treat null marks as 0 for average calculation
                        const totalNonCommon = nonCommonMarks.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0);
                        return (totalNonCommon / 3).toFixed(2);
                      })()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {student.absent_days !== null ? student.absent_days : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {/* Fix: Check if attendance_percentage is a number before calling toFixed */}
                      {typeof student.attendance_percentage === 'number' 
                        ? student.attendance_percentage.toFixed(2) 
                        : '-'}
                    </td>
                    
                    {filters.rankingMethod === 'zscore' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {student.zScore !== undefined && student.zScore.toFixed(4) === '0.0000'
                                            ? '-20.00'
                                            : student.zScore.toFixed(2)}
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
