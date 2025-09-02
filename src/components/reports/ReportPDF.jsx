// src/components/reports/ReportPDF.jsx
import jsPDF from 'jspdf';

export const ReportPDF = {
  generatePDF: (data) => {
    const { students, subjects, summary, currentTerm, filters, className } = data;

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
      
      subjects.forEach(subject => {
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
      });
      
      students.forEach(student => {
        student.marks.forEach(mark => {
          const subject = subjects.find(s => s.id === mark.subject_id);
          if (subject) {
            for (const range of gradeRanges) {
              if (mark.marks >= range.min && mark.marks <= range.max) {
                gradeCounts[subject.id].grades[range.name]++;
                break;
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
      const fixedColWidth = 5;
      const nameColWidth = 35;
      const totalColWidth = 10;
      const avgColWidth = 10;
      const rankColWidth = 6;
      const percentageColWidth = 8;

      const subjectCols = subjects.length;
      const remainingWidth = tableWidth - fixedColWidth - nameColWidth - (isGradeTable ? 0 : (totalColWidth + avgColWidth + rankColWidth + percentageColWidth));
      const subjectColWidth = Math.max(8, remainingWidth / subjectCols);

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
        const gradeColWidth = fixedColWidth + nameColWidth;
        doc.text('Grade', x + gradeColWidth / 2, y + 10, { align: 'center' });
        x += gradeColWidth;
        doc.line(x, y, x, y + headerHeight);
      } else {
        doc.text('No', x + fixedColWidth/2, y + 10, { align: 'center' });
        x += fixedColWidth;
        doc.line(x, y, x, y + headerHeight);

        doc.text('Name', x + nameColWidth/2, y + 10, { align: 'center' });
        x += nameColWidth;
      }

      subjects.forEach(subject => {
        doc.saveGraphicsState();
        doc.text(subject.name, x + 5, y + 28, { angle: 90 });
        doc.restoreGraphicsState();
        doc.line(x, y, x, y + headerHeight);
        x += subjectColWidth;
      });

      if (!isGradeTable) {
        doc.text('Total', x + 6, y + 28, { angle: 90});
        doc.line(x, y, x, y + headerHeight);
        x += totalColWidth;

        doc.text('Avg', x + 6, y + 28, { angle: 90});
        doc.line(x, y, x, y + headerHeight);
        x += avgColWidth;

        doc.text('Rank', x + 4, y + 28, { angle: 90});
        doc.line(x, y, x, y + headerHeight);
        x += rankColWidth;

        if (filters.reportType === 'term') {
          doc.text('Z-Score', x + 5, y + 28, { angle: 90 });
        } else {
          doc.text('Percentage', x + 5, y + 28, { angle: 90 });
        }
        doc.line(x, y, x, y + headerHeight);
      }

      return { 
        y: y + headerHeight, 
        subjectColWidth, 
        fixedColWidth, 
        nameColWidth 
      };
    };

    // ----- TABLE BODY -----
    const drawMarkTable = (rows, startY) => {
      const tableWidth = pageWidth - (margin * 2);
      const rowHeight = 5;

      let { y, subjectColWidth, fixedColWidth, nameColWidth } = drawTableHeader(startY);

      const totalColWidth = 10;
      const avgColWidth = 10;
      const rankColWidth = 6;
      const percentageColWidth = 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      rows.forEach((student, index) => {
        if (y + rowHeight > pageHeight - margin - 15) {
          doc.addPage();
          currentY = margin;
          ({ y, subjectColWidth, fixedColWidth, nameColWidth } = drawTableHeader(currentY));
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
        doc.text(String(index + 1), x + fixedColWidth/2, y + 4, { align: 'center' });
        x += fixedColWidth;

        doc.line(x, y, x, y + rowHeight);
        const studentName = student.name.length > 25 ? student.name.substring(0, 23) + '..' : student.name;
        doc.text(studentName, x + nameColWidth/2, y + 4, { align: 'center' });
        x += nameColWidth;

        subjects.forEach(subject => {
          const subjectMark = student.marks.find(m => m.subject_id === subject.id);
          const markText = subjectMark ? String(subjectMark.marks) : '';
          doc.text(markText, x + subjectColWidth/2, y + 4, { align: 'center' });
          doc.line(x, y, x, y + rowHeight);
          x += subjectColWidth;
        });

        doc.text(student.totalMarks.toFixed(0), x + totalColWidth/2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);
        x += totalColWidth;

        const nonCommonMarks = student.marks.filter(m =>
          subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
        );
        const average = nonCommonMarks.length > 0
          ? (nonCommonMarks.reduce((sum, m) => sum + m.marks, 0) / nonCommonMarks.length)
          : 0;
        doc.text(average.toFixed(0), x + avgColWidth/2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);
        x += avgColWidth;

        doc.text(String(student.rank), x + rankColWidth/2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);
        x += rankColWidth;

        if (filters.reportType === 'term') {
          const zScore = student.zScore ? student.zScore.toFixed(2) : '0.00';
          doc.text(zScore, x + percentageColWidth/2, y + 4, { align: 'center' });
        } else {
          doc.text('', x + percentageColWidth/2, y + 4, { align: 'center' });
        }
        doc.line(x, y, x, y + rowHeight);

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
      const { subjectColWidth, fixedColWidth, nameColWidth } = drawTableHeader(startY, true);
      const gradeColWidth = fixedColWidth + nameColWidth;
      const rowHeight = 5;
      let y = startY + 30; // push below header

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      gradeRanges.forEach((gradeRange, index) => {
        if (y + rowHeight > pageHeight - margin - 15) {
          doc.addPage();
          ({ subjectColWidth } = drawTableHeader(margin, true));
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

        subjects.forEach(subject => {
          const count = gradeCounts[subject.id].grades[gradeRange] || 0;
          doc.text(count.toString(), x + subjectColWidth/2, y + 4, { align: 'center' });
          doc.line(x, y, x, y + rowHeight);
          x += subjectColWidth;
        });

        y += rowHeight;
      });

      // Total row
      if (y + rowHeight > pageHeight - margin - 15) {
        doc.addPage();
        ({ subjectColWidth } = drawTableHeader(margin, true));
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

      subjects.forEach(subject => {
        const total = Object.values(gradeCounts[subject.id].grades).reduce((sum, count) => sum + count, 0);
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
