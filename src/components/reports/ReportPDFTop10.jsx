// src/components/reports/ReportPDFTop10.jsx
import jsPDF from 'jspdf';

export const ReportPDFTop10 = {
  generatePDF: ({ students, currentTerm, filters }) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const topMargin = 12;
    let y = topMargin;

    // ---------- HEADER ----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('R/Sivali Central College - Arts Section', pageWidth / 2, y, { align: 'center' });
    y += 8;

    const method =
      filters.rankingMethod === 'zscore' ? 'Z-Score' : 'Average';
    const sectionName = filters.section || 'All';
    const headerLine2 = `${currentTerm.term_name} Examination - ${sectionName} - ${method} Ranked - Full Term Report - ${filters.academicYear}`;
    doc.setFontSize(11);
    doc.text(headerLine2, pageWidth / 2, y, { align: 'center' });
    y += 14;

    // ---------- TABLE SETTINGS ----------
    // Column widths: [No., Name, Class, Method, Rank, Absent Days, Percentage]
    const colWidths = [12, 55, 25, 25, 18, 22, 22];
    const headers = ['No.', 'Name', 'Class', method, 'Rank', 'Absent Days', 'Percentage'];

    // Calculate total table width and left margin to center horizontally
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const leftMargin = (pageWidth - tableWidth) / 2;

    // ---------- TABLE HEADER ----------
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let x = leftMargin;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 8, 'S');
      doc.text(h, x + colWidths[i] / 2, y + 5, { align: 'center' });
      x += colWidths[i];
    });
    y += 8;

    // ---------- TABLE BODY ----------
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    students.forEach((stu, idx) => {
      if (y + 8 > pageHeight - 20) {  // add page if needed
        doc.addPage();
        y = topMargin;
        // redraw header on new page
        x = leftMargin;
        doc.setFont('helvetica', 'bold');
        headers.forEach((h, i) => {
          doc.rect(x, y, colWidths[i], 8, 'S');
          doc.text(h, x + colWidths[i] / 2, y + 5, { align: 'center' });
          x += colWidths[i];
        });
        y += 8;
        doc.setFont('helvetica', 'normal');
      }

      x = leftMargin;
      const row = [
        (idx + 1).toString(),
        stu.name,
        stu.current_class || '',
        filters.rankingMethod === 'zscore'
          ? (stu.zScore !== undefined && stu.zScore.toFixed(4) === '0.0000'
              ? '-20.00'
              : stu.zScore.toFixed(2))
          : (() => {
              const avg = stu.average !== undefined ? stu.average : 0;
              return avg.toFixed(2);
            })(),
        stu.rank.toString(),
        (stu.absent_days ?? 0).toString(),
        typeof stu.attendance_percentage === 'number'
          ? stu.attendance_percentage.toFixed(2)
          : '0'
      ];

      row.forEach((txt, i) => {
        doc.rect(x, y, colWidths[i], 8, 'S');
        doc.text(String(txt), x + colWidths[i] / 2, y + 5, { align: 'center' });
        x += colWidths[i];
      });
      y += 8;
    });

    // ---------- FOOTER ----------
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, leftMargin, pageHeight - 5);
      doc.text(`Total Students: ${students.length}`, pageWidth - leftMargin, pageHeight - 5, { align: 'right' });
    }

    // ---------- SAVE ----------
    const fileName = `${currentTerm.term_name} Examination - ${sectionName} - ${method} Ranked - Full Term Report - ${filters.academicYear}.pdf`;
    doc.save(fileName);
  }
};

export default ReportPDFTop10;
