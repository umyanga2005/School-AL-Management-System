// src/components/reports/ReportPDF.jsx - UPDATED VERSION
import jsPDF from 'jspdf';

export const ReportPDF = {
  generatePDF: (data) => {
    const { students, subjects, summary, currentTerm, filters, className, desiredSubjectOrder } = data;

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let currentY = margin;

    // ----- HEADER -----
    const addHeader = () => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const schoolName = 'R/Sivali Central College - Arts Section';
      const termInfo = currentTerm
        ? `${currentTerm.term_name} Examination (${filters.className || 'All Classes'}) ${currentTerm.exam_year}`
        : 'Term Report';

      doc.text(schoolName, pageWidth / 2, currentY + 5, { align: 'center' });
      doc.text(termInfo, pageWidth / 2, currentY + 12, { align: 'center' });

      currentY += 25;
    };

    // ----- GRADE COUNTING FUNCTION -----
    const countGradesBySubject = () => {
      const gradeRanges = [
        { name: 'F > 00 - 35', min: 0, max: 35 },
        { name: 'S > 40 - 54', min: 40, max: 54 },
        { name: 'C > 55 - 64', min: 55, max: 64 },
        { name: 'B > 65 - 74', min: 65, max: 74 },
        { name: 'A > 75 - 100', min: 75, max: 100 }
      ];
      
      const gradeCounts = {};
      
      // Initialize grade counts for all subjects in desired order
      desiredSubjectOrder.forEach(subjectName => {
        const subject = subjects.find(s => s.name === subjectName);
        if (subject) {
          gradeCounts[subject.id] = {
            subjectName: subject.name,
            grades: {
              'F > 00 - 35': 0,
              'S > 40 - 54': 0,
              'C > 55 - 64': 0,
              'B > 65 - 74': 0,
              'A > 75 - 100': 0
            }
          };
        }
      });
      
      students.forEach(student => {
        student.marks.forEach(mark => {
          // Only count if marks are not null/undefined/empty string
          if (mark.marks !== null && mark.marks !== undefined && mark.marks !== '') {
            const subject = subjects.find(s => s.id === mark.subject_id);
            if (subject && gradeCounts[subject.id]) { // Ensure subject is in desired list
              for (const range of gradeRanges) {
                if (mark.marks >= range.min && mark.marks <= range.max) {
                  gradeCounts[subject.id].grades[range.name]++;
                  break;
                }
              }
            }
          }
        });
      });
      
      return gradeCounts;
    };

    // ----- TABLE HEADER -----
    const drawTableHeader = (startY, isGradeTable = false) => {
      const tableWidth = pageWidth - (margin * 2);
      const noColWidth = 6; // For 'No' column
      const nameColWidth = 40; // For 'Name' column
      const totalColWidth = 10;
      const avgColWidth = 10;
      const rankColWidth = 8; // Added Rank column
      const absentColWidth = 12;
      const percentageColWidth = 12; // For Attendance Percentage

      const subjectsToDisplay = desiredSubjectOrder.map(name => subjects.find(s => s.name === name)).filter(Boolean);
      const subjectCols = subjectsToDisplay.length;

      // Calculate remaining width for subject columns
      const fixedColumnsWidth = noColWidth + nameColWidth + 
                                (isGradeTable ? 0 : (totalColWidth + avgColWidth + rankColWidth + absentColWidth + percentageColWidth));
      const remainingWidth = tableWidth - fixedColumnsWidth;
      const subjectColWidth = Math.max(6, remainingWidth / subjectCols);

      const headerHeight = 30;
      let y = startY;
      let x = margin;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableWidth, headerHeight, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, y, tableWidth, headerHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      if (isGradeTable) {
        const gradeColWidth = noColWidth + nameColWidth; // Combine for 'Grade' header
        doc.text('Grade', x + gradeColWidth / 2, y + 10, { align: 'center' });
        x += gradeColWidth;
        doc.line(x, y, x, y + headerHeight);
      } else {
        doc.text('No', x + noColWidth/2, y + 10, { align: 'center' });
        x += noColWidth;
        doc.line(x, y, x, y + headerHeight);

        doc.text('Name', x + nameColWidth/2, y + 10, { align: 'center' });
        x += nameColWidth;
        doc.line(x, y, x, y + headerHeight);
      }

      subjectsToDisplay.forEach(subject => {
        doc.saveGraphicsState();
        doc.text(subject.name, x + 5, y + 28, { angle: 90 });
        doc.restoreGraphicsState();
        doc.line(x, y, x, y + headerHeight);
        x += subjectColWidth;
      });

      if (!isGradeTable) {
        doc.text('Total', x + totalColWidth/2, y + 28, { angle: 90});
        doc.line(x, y, x, y + headerHeight);
        x += totalColWidth;

        doc.text('Avg', x + avgColWidth/2, y + 28, { angle: 90});
        doc.line(x, y, x, y + headerHeight);
        x += avgColWidth;

        doc.text('Rank', x + rankColWidth/2, y + 28, { angle: 90}); // Rank column header
        doc.line(x, y, x, y + headerHeight);
        x += rankColWidth;

        doc.text('Absent Days', x + absentColWidth/2, y + 28, { angle: 90 });
        doc.line(x, y, x, y + headerHeight);
        x += absentColWidth;

        doc.text('Percentage', x + percentageColWidth/2, y + 28, { angle: 90 }); // Attendance Percentage
        doc.line(x, y, x, y + headerHeight);
        x += percentageColWidth;

        // Z-Score is conditional, but the request implies it's separate from "Percentage" (attendance)
        // If you want Z-Score here, you'd add another column. For now, I'll assume "Percentage" is attendance.
        // if (filters.reportType === 'term' && filters.rankingMethod === 'zscore') {
        //   doc.text('Z-Score', x + 5, y + 28, { angle: 90 });
        //   doc.line(x, y, x, y + headerHeight);
        //   x += percentageColWidth; // Reusing width for Z-Score
        // }
      }

      return { 
        y: y + headerHeight, 
        subjectColWidth, 
        noColWidth, 
        nameColWidth,
        totalColWidth,
        avgColWidth,
        rankColWidth,
        absentColWidth,
        percentageColWidth
      };
    };

    // ----- TABLE BODY -----
    const drawMarkTable = (rows, startY) => {
      const tableWidth = pageWidth - (margin * 2);
      const rowHeight = 5;

      let { y, subjectColWidth, noColWidth, nameColWidth, totalColWidth, avgColWidth, rankColWidth, absentColWidth, percentageColWidth } = drawTableHeader(startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      const subjectsToDisplay = desiredSubjectOrder.map(name => subjects.find(s => s.name === name)).filter(Boolean);

      rows.forEach((student, index) => {
        if (y + rowHeight > pageHeight - margin - 15) {
          doc.addPage();
          currentY = margin;
          ({ y, subjectColWidth, noColWidth, nameColWidth, totalColWidth, avgColWidth, rankColWidth, absentColWidth, percentageColWidth } = drawTableHeader(currentY));
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, tableWidth, rowHeight, 'F');
        }

        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, y, tableWidth, rowHeight);

        let x = margin;
        doc.text(String(index + 1), x + noColWidth/2, y + 4, { align: 'center' }); // Sequential 'No'
        x += noColWidth;

        doc.line(x, y, x, y + rowHeight);
        const studentName = student.name;
        doc.text(studentName, x + nameColWidth/2, y + 4, { align: 'center' });
        x += nameColWidth;
        doc.line(x, y, x, y + rowHeight);

        subjectsToDisplay.forEach(subject => {
          const subjectMark = student.marks.find(m => m.subject_id === subject.id);
          // Handle null/undefined marks and empty strings
          let markText = '';
          if (subjectMark && subjectMark.marks !== null && subjectMark.marks !== undefined && subjectMark.marks !== '') {
            markText = String(subjectMark.marks);
          }
          doc.text(markText, x + subjectColWidth/2, y + 4, { align: 'center' });
          doc.line(x, y, x, y + rowHeight);
          x += subjectColWidth;
        });

        doc.text(student.totalMarks.toFixed(0), x + totalColWidth/2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);
        x += totalColWidth;

        // Calculate average for non-common subjects with valid marks
        const nonCommonMarks = student.marks.filter(m => {
          const subject = subjects.find(s => s.id === m.subject_id);
          return subject && subject.stream !== 'Common' && m.marks !== null && m.marks !== undefined && m.marks !== '';
        });
        
        const average = nonCommonMarks.length > 0
          ? (nonCommonMarks.reduce((sum, m) => sum + m.marks, 0) / nonCommonMarks.length)
          : 0;
        doc.text(average.toFixed(0), x + avgColWidth/2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);
        x += avgColWidth;

        doc.text(String(student.rank), x + rankColWidth/2, y + 4, { align: 'center' }); // Display Rank
        doc.line(x, y, x, y + rowHeight);
        x += rankColWidth;

        doc.text(String(student.absent_days || 0), x + absentColWidth/2, y + 4, { align: 'center' }); // Absent Days
        doc.line(x, y, x, y + rowHeight);
        x += absentColWidth;

        doc.text(student.attendance_percentage ? student.attendance_percentage.toFixed(0) : '0', x + percentageColWidth/2, y + 4, { align: 'center' }); // Attendance Percentage
        doc.line(x, y, x, y + rowHeight);
        x += percentageColWidth;

        // If Z-Score is needed as a separate column, add it here
        // if (filters.reportType === 'term' && filters.rankingMethod === 'zscore') {
        //   const zScore = student.zScore ? student.zScore.toFixed(2) : '0.00';
        //   doc.text(zScore, x + percentageColWidth/2, y + 4, { align: 'center' });
        //   doc.line(x, y, x, y + rowHeight);
        //   x += percentageColWidth;
        // }

        y += rowHeight;
      });

      return y;
    };

    // ----- GRADE COUNT TABLE -----
    const drawGradeCountTable = (startY) => {
      const gradeCounts = countGradesBySubject();
      const gradeRanges = [
        'F > 00 - 35',
        'S > 40 - 54', 
        'C > 55 - 64',
        'B > 65 - 74',
        'A > 75 - 100'
      ];

      const tableWidth = pageWidth - (margin * 2);
      const { subjectColWidth, noColWidth, nameColWidth } = drawTableHeader(startY, true);
      const gradeColWidth = noColWidth + nameColWidth; // Combined width for 'Grade' header
      const rowHeight = 5;
      let y = startY + 30; // push below header

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      const subjectsToDisplay = desiredSubjectOrder.map(name => subjects.find(s => s.name === name)).filter(Boolean);

      gradeRanges.forEach((gradeRange, index) => {
        if (y + rowHeight > pageHeight - margin - 15) {
          doc.addPage();
          ({ subjectColWidth, noColWidth, nameColWidth } = drawTableHeader(margin, true));
          y = margin + 30;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, tableWidth, rowHeight, 'F');
        }

        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, y, tableWidth, rowHeight);

        let x = margin;
        doc.text(gradeRange, x + gradeColWidth/2, y + 4, { align: 'center' });
        x += gradeColWidth;
        doc.line(x, y, x, y + rowHeight);

        subjectsToDisplay.forEach(subject => {
          const count = gradeCounts[subject.id]?.grades[gradeRange] || 0; // Use optional chaining
          doc.text(count.toString(), x + subjectColWidth/2, y + 4, { align: 'center' });
          doc.line(x, y, x, y + rowHeight);
          x += subjectColWidth;
        });

        y += rowHeight;
      });

      // Total row
      if (y + rowHeight > pageHeight - margin - 15) {
        doc.addPage();
        ({ subjectColWidth, noColWidth, nameColWidth } = drawTableHeader(margin, true));
        y = margin + 30;
      }

      doc.setFillColor(220, 220, 220);
      doc.rect(margin, y, tableWidth, rowHeight, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, y, tableWidth, rowHeight);

      let x = margin;
      doc.setFont('helvetica', 'bold');
      doc.text('Total', x + gradeColWidth / 2, y + 4, { align: 'center' });
      x += gradeColWidth;
      doc.line(x, y, x, y + rowHeight);

      subjectsToDisplay.forEach(subject => {
        const total = Object.values(gradeCounts[subject.id]?.grades || {}).reduce((sum, count) => sum + count, 0);
        doc.text(total.toString(), x + subjectColWidth / 2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);
        x += subjectColWidth;
      });

      return y + rowHeight + 5;
    };

    // ---- GENERATE ----
    addHeader();
    currentY = drawMarkTable(students, currentY);
    currentY += 10;
    currentY = drawGradeCountTable(currentY);

    // ---- FOOTER ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 5);
      doc.text(`Total Students: ${students.length}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    const fileName = filters.reportType === 'class'
      ? `Class_${filters.className || 'Report'}_Mark_Sheet.pdf`
      : 'Full_Term_Mark_Sheet.pdf';

    doc.save(fileName);
  }
};

export default ReportPDF;
