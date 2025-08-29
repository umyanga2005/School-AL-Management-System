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

    // ----- TABLE HEADER -----
    const drawTableHeader = (startY) => {
      const tableWidth = pageWidth - (margin * 2);
      const fixedColWidth = 15;
      const nameColWidth = 45;
      const totalColWidth = 12;
      const avgColWidth = 12;
      const rankColWidth = 12;
      const percentageColWidth = 20;

      const subjectCols = subjects.length;
      const remainingWidth = tableWidth - fixedColWidth - nameColWidth - totalColWidth - avgColWidth - rankColWidth - percentageColWidth;
      const subjectColWidth = Math.max(8, remainingWidth / subjectCols);

      const headerHeight = 25;
      let y = startY;
      let x = margin;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableWidth, headerHeight, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, y, tableWidth, headerHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      doc.text('No', x + fixedColWidth/2, y + 10, { align: 'center' });
      x += fixedColWidth;
      doc.line(x, y, x, y + headerHeight);


      doc.text('Name', x + nameColWidth/2, y + 10, { align: 'center' });
      x += nameColWidth;

      // Subjects (rotated)
      subjects.forEach(subject => {
        doc.saveGraphicsState();
        doc.text(subject.name, x + 5, y + 23, { angle: 90 });
        doc.restoreGraphicsState();
        doc.line(x, y, x, y + headerHeight);
        x += subjectColWidth;
      });

      doc.text('Total', x + totalColWidth/2, y + 8, { align: 'center' });
      doc.line(x, y, x, y + headerHeight);
      x += totalColWidth;

      doc.text('Avg', x + avgColWidth/2, y + 8, { align: 'center' });
      doc.line(x, y, x, y + headerHeight);
      x += avgColWidth;

      doc.text('Rank', x + rankColWidth/2, y + 8, { align: 'center' });
      doc.line(x, y, x, y + headerHeight);
      x += rankColWidth;

      doc.saveGraphicsState();
      doc.text('Percentage', x + 7, y + 19, { angle: 90 });
      doc.restoreGraphicsState();
      doc.line(x, y, x, y + headerHeight);

      return { y: y + headerHeight, subjectColWidth, fixedColWidth, nameColWidth, totalColWidth, avgColWidth, rankColWidth, percentageColWidth };
    };

    // ----- TABLE BODY -----
    const drawMarkTable = (rows, startY) => {
      const tableWidth = pageWidth - (margin * 2);
      const rowHeight = 5;

      let { y, subjectColWidth, fixedColWidth, nameColWidth, totalColWidth, avgColWidth, rankColWidth, percentageColWidth } = drawTableHeader(startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      rows.forEach((student, index) => {
        if (y + rowHeight > pageHeight - margin - 15) {
          doc.addPage();
          currentY = margin;
          addHeader();
          ({ y, subjectColWidth, fixedColWidth, nameColWidth, totalColWidth, avgColWidth, rankColWidth, percentageColWidth } = drawTableHeader(currentY));
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

        doc.text('', x + percentageColWidth/2, y + 4, { align: 'center' });
        doc.line(x, y, x, y + rowHeight);

        y += rowHeight;
      });

      return y;
    };

    // ---- GENERATE ----
    addHeader();
    currentY = drawMarkTable(students, currentY);

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
