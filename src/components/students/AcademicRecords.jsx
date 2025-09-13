// src/components/students/AcademicRecords.jsx
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import academicRecordsService from '../../services/academicRecordsService';

const AcademicRecords = ({ student, selectedTerm, reportType, onClose }) => {
  const [academicData, setAcademicData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfReady, setPdfReady] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [classStats, setClassStats] = useState(null);
  const [subjectHighestMarks, setSubjectHighestMarks] = useState({});
  const [computedReport, setComputedReport] = useState({
    totalMarks: 0,
    average: 0,
    studentRank: 'N/A',
    classFirstAverage: 'N/A'
  });

  const [leftLogo, setLeftLogo] = useState(null);
  const [rightLogo, setRightLogo] = useState(null);

  useEffect(() => {
    // Load images
    const loadImages = async () => {
      try {
        // Load left logo (replace with your actual left logo path)
        const leftImg = new Image();
        leftImg.crossOrigin = 'Anonymous';
        leftImg.src = require('./src/schoollogo.png'); // Update this path
        leftImg.onload = () => setLeftLogo(leftImg);
        leftImg.onerror = () => {
          console.warn('Left logo failed to load');
          setLeftLogo(null);
        };
        
        // Load right logo from URL
        const rightImg = new Image();
        rightImg.crossOrigin = 'Anonymous';
        rightImg.src = require('./src/artlogo.png'); // Update this path
        rightImg.onload = () => setRightLogo(rightImg);
        rightImg.onerror = () => {
          console.warn('Right logo failed to load');
          setRightLogo(null);
        };
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };
    
    loadImages();
  }, []);

  useEffect(() => {
    if (reportType === 'single' && selectedTerm) {
      loadSingleTermData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm, reportType]);

  const loadSingleTermData = async () => {
    try {
      setLoading(true);
      const response = await academicRecordsService.getStudentReportData(
        student.id,
        student.current_class,
        selectedTerm.id,
        selectedTerm.exam_year
      );

      if (!response.success) {
        setError(response.error || 'Failed to load report data');
        return;
      }

      processReportData(response.data);
      setPdfReady(true);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data) => {
    const marks = data.marks || [];
    const highestMarks = data.highestMarks || {};
    const attendance = data.attendance || null;
    const stats = data.classStats || {};
    const totals = data.totals || [];
    const backendReport = data.report || null;

    setAcademicData(marks);
    setAttendanceData(attendance);
    setClassStats(stats);
    setSubjectHighestMarks(highestMarks);

    if (backendReport && typeof backendReport === 'object') {
      setComputedReport({
        totalMarks: backendReport.totalMarks ?? computeTotal(marks),
        average: backendReport.average ?? computeAverage(marks),
        studentRank: backendReport.studentRank ?? stats.studentRank ?? computeRank(totals, student.id),
        classFirstAverage: backendReport.classFirstAverage ?? stats.firstAverage ?? computeClassFirstAverage(totals, marks, data)
      });
      return;
    }

    const totalMarks = computeTotal(marks);
    const average = computeAverage(marks);
    const studentRank = stats.studentRank ?? computeRank(totals, student.id);
    const classFirstAverage = stats.firstAverage ?? computeClassFirstAverage(totals, marks, data);

    setComputedReport({
      totalMarks,
      average,
      studentRank: studentRank || 'N/A',
      classFirstAverage: classFirstAverage || 'N/A'
    });
  };

  const computeTotal = (marksData) => {
    return marksData.reduce((sum, s) => sum + (s.marks ? Math.round(Number(s.marks)) : 0), 0);
  };

  const computeAverage = (marksData) => {
    const nonCommon = marksData.filter(s => s.stream && s.stream.toLowerCase() !== 'common');
    const nonCommonSum = nonCommon.reduce((sum, s) => sum + (s.marks ? Math.round(Number(s.marks)) : 0), 0);
    if (nonCommon.length === 0) return 0;
    return Math.round(nonCommonSum / 3);
  };

  const computeRank = (totalsArray = [], studentId) => {
    if (!Array.isArray(totalsArray) || totalsArray.length === 0) return null;
    const sorted = [...totalsArray].sort((a, b) => Number(b.total) - Number(a.total));
    const idx = sorted.findIndex(r => Number(r.student_id) === Number(studentId));
    return idx === -1 ? null : idx + 1;
  };

  const computeClassFirstAverage = (totalsArray = [], marksForStudent = [], data = {}) => {
    if (Array.isArray(totalsArray) && totalsArray.length > 0) {
      const sorted = [...totalsArray].sort((a, b) => Number(b.total) - Number(a.total));
      const topStudentId = sorted[0].student_id;
      const allMarksByStudent = data.allMarksByStudent || null;
      let topMarks = [];
      if (allMarksByStudent && allMarksByStudent[topStudentId]) {
        topMarks = allMarksByStudent[topStudentId];
      } else {
        topMarks = marksForStudent;
      }
      const nonCommon = topMarks.filter(s => s.stream && s.stream.toLowerCase() !== 'common');
      if (nonCommon.length === 0) return 0;
      const nonCommonSum = nonCommon.reduce((sum, s) => sum + (s.marks ? Math.round(Number(s.marks)) : 0), 0);
      return Math.round(nonCommonSum / 3);
    }
    if (data.classStats && data.classStats.firstAverage) return data.classStats.firstAverage;
    return 0;
  };

  // --- PDF generation with fixed layout ---
  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'pt' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    let y = margin;

    // Logo boxes with images
    const logoBoxSize = 60;

    // Add left logo
    if (leftLogo) {
      try {
        doc.addImage(leftLogo, margin, y - 4, logoBoxSize, logoBoxSize);
      } catch (error) {
        console.warn('Left logo image not available, using placeholder');
        doc.rect(margin, y - 4, logoBoxSize, logoBoxSize, 'S');
        doc.text('Logo', margin + logoBoxSize/2, y + logoBoxSize/2, { align: 'center', baseline: 'middle' });
      }
    } else {
      doc.rect(margin, y - 4, logoBoxSize, logoBoxSize, 'S');
      doc.text('Logo', margin + logoBoxSize/2, y + logoBoxSize/2, { align: 'center', baseline: 'middle' });
    }

    // Add right logo
    if (rightLogo) {
      try {
        doc.addImage(rightLogo, pageWidth - margin - logoBoxSize, y - 4, logoBoxSize, logoBoxSize);
      } catch (error) {
        console.warn('Right logo image not available, using placeholder');
        doc.rect(pageWidth - margin - logoBoxSize, y - 4, logoBoxSize, logoBoxSize, 'S');
        doc.text('Logo', pageWidth - margin - logoBoxSize/2, y + logoBoxSize/2, { align: 'center', baseline: 'middle' });
      }
    } else {
      doc.rect(pageWidth - margin - logoBoxSize, y - 4, logoBoxSize, logoBoxSize, 'S');
      doc.text('Logo', pageWidth - margin - logoBoxSize/2, y + logoBoxSize/2, { align: 'center', baseline: 'middle' });
    }

    // Header
    doc.setFontSize(18).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
    doc.text('Student Report Card', pageWidth / 2, y + 12, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Advanced Level', pageWidth / 2, y + 32, { align: 'center' });
    doc.text('R/Sivali Central College', pageWidth / 2, y + 48, { align: 'center' });

    y += logoBoxSize + 20;

    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // Student Info
    const romanTerms = { First: 'I', Second: 'II', Third: 'III' };
    const termRoman = romanTerms[selectedTerm.term_name] || selectedTerm.term_name;
    doc.setFontSize(10).setFont('helvetica', 'normal');
    doc.text(`Year: ${selectedTerm.exam_year}`, margin, y);
    doc.text(`Term: ${termRoman}`, pageWidth - margin, y, { align: 'right' });
    y += 16;
    doc.text(`Student Name: ${student.name}`, margin, y);
    y += 16;
    doc.text(`Class: ${student.current_class}`, margin, y);
    doc.text(`Index No: ${student.index_number}`, pageWidth - margin, y, { align: 'right' });
    y += 24;

    // --- Table 1: Subjects & Marks ---
    const commonSubjects = academicData.filter(s => s.stream && s.stream.toLowerCase() === 'common');
    const nonCommonSubjects = academicData.filter(s => !s.stream || s.stream.toLowerCase() !== 'common');
    const sortedSubjects = [...nonCommonSubjects, ...commonSubjects];

    const tableWidth = pageWidth - (margin * 2);
    const colWidths = [40, tableWidth - 240, 100, 100];

    // Header row with borders
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, tableWidth, 20, 'F');

    // Draw column borders for header
    doc.rect(margin, y, colWidths[0], 20); // No. column
    doc.rect(margin + colWidths[0], y, colWidths[1], 20); // Subject column
    doc.rect(margin + colWidths[0] + colWidths[1], y, colWidths[2], 20); // Marks column
    doc.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], 20); // Term Highest column

    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.text('No.', margin + 5, y + 14);
    doc.text('Subject', margin + colWidths[0] + 5, y + 14);
    doc.text('Marks', margin + colWidths[0] + colWidths[1] + 40, y + 14);
    doc.text('Term Highest', margin + colWidths[0] + colWidths[1] + colWidths[2] + 20, y + 14);

    y += 20;

    // Body
    doc.setFont('helvetica', 'normal');
    sortedSubjects.forEach((sub, idx) => {
      // Draw full table borders
      doc.rect(margin, y, colWidths[0], 20); // No. column
      doc.rect(margin + colWidths[0], y, colWidths[1], 20); // Subject column
      doc.rect(margin + colWidths[0] + colWidths[1], y, colWidths[2], 20); // Marks column
      doc.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], 20); // Term Highest column
      
      doc.text(String(idx + 1), margin + 5, y + 14);
      doc.text(sub.subject_name || '-', margin + colWidths[0] + 5, y + 14);
      const studentMark = (sub.marks !== null && sub.marks !== undefined) ? String(Math.round(Number(sub.marks))) : 'AB';
      doc.text(studentMark, margin + colWidths[0] + colWidths[1] + 40, y + 14);
      const highest = subjectHighestMarks[sub.subject_id] !== undefined ? Math.round(Number(subjectHighestMarks[sub.subject_id] ?? 0)) : 0;
      doc.text(String(highest), margin + colWidths[0] + colWidths[1] + colWidths[2] + 40, y + 14);
      y += 20;
      if (y > pageHeight - margin - 200) {
        doc.addPage();
        y = margin;
      }
    });

    y += 24;

    // --- Table 2: Summary ---
    const summaryData = [
      ['Student Total Marks', computedReport.totalMarks],
      ['Student Average', `${computedReport.average}%`],
      ['Student Rank', computedReport.studentRank],
      ['Class First Average', `${computedReport.classFirstAverage}%`],
      ['Total School Days', attendanceData?.total_school_days ?? ''],
      ['Student Absent Days', attendanceData?.absent_days ?? ''],
      ['Attendance Percentage', attendanceData?.attendance_percentage ? attendanceData.attendance_percentage + '%' : ''],
    ];

    const table2Width = pageWidth - (margin * 2);
    const col2Widths = [table2Width / 2, table2Width / 2];

    // Header row (colored but no title)
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, table2Width, 20, 'F');
    y += 20;

    summaryData.forEach(([label, value]) => {
      // Draw full table borders
      doc.rect(margin, y, col2Widths[0], 20); // Label column
      doc.rect(margin + col2Widths[0], y, col2Widths[1], 20); // Value column
      
      // Center text in both columns
      const labelTextWidth = doc.getTextWidth(label);
      const valueTextWidth = doc.getTextWidth(String(value));
      
      doc.text(label, margin + (col2Widths[0] / 2) - (labelTextWidth / 2), y + 14);
      doc.text(String(value), margin + col2Widths[0] + (col2Widths[1] / 2) - (valueTextWidth / 2), y + 14);
      
      y += 20;
      if (y > pageHeight - margin - 200) {
        doc.addPage();
        y = margin;
      }
    });

    y += 30;

        // Special Notes
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('Special Notes:', margin, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('______________________________________________________________________________________________', margin, y);
    y += 20;
    doc.text('______________________________________________________________________________________________', margin, y);
    y += 20;
    doc.text('______________________________________________________________________________________________', margin, y);

    y += 35;

    // --- Signature Table (thin borders) ---
    const signatureTableWidth = pageWidth - (margin * 2);
    const signatureColWidth = signatureTableWidth / 3;
    
    // Set line width to thin (0)
    doc.setLineWidth(0.1);
    
    // Draw signature table
    doc.rect(margin, y, signatureTableWidth, 60);
    doc.line(margin + signatureColWidth, y, margin + signatureColWidth, y + 60);
    doc.line(margin + (signatureColWidth * 2), y, margin + (signatureColWidth * 2), y + 60);
    doc.line(margin, y + 40, margin + signatureTableWidth, y + 40);
    
    // Reset line width to default
    doc.setLineWidth(0.57);
    
    // Signature labels
    doc.setFontSize(8);
    doc.text('Class Teacher', margin + (signatureColWidth / 2), y + 52, { align: 'center' });
    doc.text('Section Head', margin + signatureColWidth + (signatureColWidth / 2), y + 52, { align: 'center' });
    doc.text('Principal', margin + (signatureColWidth * 2) + (signatureColWidth / 2), y + 52, { align: 'center' });

    doc.setFontSize(8).setFont('helvetica', 'italic');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 20, { align: 'right' });

    const fileName = `${student.index_number}_${selectedTerm.term_name}_${selectedTerm.exam_year}.pdf`;
    doc.save(fileName);

    if (typeof onClose === 'function') onClose();
  };

  useEffect(() => {
    if (pdfReady) {
      generatePDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfReady]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 opacity-75" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-6 py-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="text-center">
            {loading ? (
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
                </div>
                <h3 className="mt-4 text-lg font-medium">Generating Report...</h3>
                <p className="mt-2 text-sm text-gray-500">Preparing PDF for {student.name}</p>
              </div>
            ) : error ? (
              <div>
                <h3 className="mt-4 text-lg font-medium text-red-600">Error</h3>
                <p>{error}</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                  Close
                </button>
              </div>
            ) : (
              <div>
                <h3 className="mt-4 text-lg font-medium text-green-600">Report Ready</h3>
                <p className="mt-2 text-sm text-gray-500">Click Close to finish.</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicRecords;