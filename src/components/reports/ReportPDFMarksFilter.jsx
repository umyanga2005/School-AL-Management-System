// src/components/reports/ReportPDFMarksFilter.jsx
import jsPDF from 'jspdf';

export const ReportPDFMarksFilter = {
  generatePDF: ({ groupedData, filters, currentTerm }) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; // Fixed margin

    // Add page border function
    const addPageBorder = () => {
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Leave space for footer
    };

    // Add header function
    const addHeader = (subject, currentPage = false) => {
      let y = 15;
      
      // First Line - School Name
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('R/Sivali Central College - Arts Section', pageWidth / 2, y, { align: 'center' });
      y += 8;

      // Second Line - Section + Report Type + Academic Year
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const secondLine = `${filters.section || 'All'} - ${filters.reportType === 'term' ? 'Full Term Report' : 'Class Report'} - ${filters.academicYear}`;
      doc.text(secondLine, pageWidth / 2, y, { align: 'center' });
      y += 6;

      // Third Line - Term + Examination + Class
      const thirdLine = `${currentTerm.term_name} Examination${filters.className ? ' ' + filters.className : ''}`;
      doc.text(thirdLine, pageWidth / 2, y, { align: 'center' });
      y += 6;

      // Fourth Line - Subject Code + Subject Name
      doc.setFont('helvetica', 'bold');
      const fourthLine = `${subject.code} - ${subject.name}`;
      doc.text(fourthLine, pageWidth / 2, y, { align: 'center' });
      y += 12;

      return y;
    };

    // Add footer function
    const addFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Footer content
        const footerY = pageHeight - 8;
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY);
        
        // Calculate total students across all subjects
        const totalStudents = groupedData.reduce((total, group) => total + group.students.length, 0);
        doc.text(`Total Students: ${totalStudents}`, pageWidth - margin, footerY, { align: 'right' });
      }
    };

    // Draw table function
    const drawTable = (subject, students, startY) => {
      // Table dimensions
      const tableWidth = 135; // Fixed table width for centering
      const tableX = (pageWidth - tableWidth) / 2; // Center the table
      const colWidths = [20, 85, 30]; // No., Name, Mark columns
      const rowHeight = 8;
      let y = startY;

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setDrawColor(0);
      doc.setFillColor(240, 240, 240);

      // Header background
      doc.rect(tableX, y, tableWidth, rowHeight, 'FD');
      
      // Header text
      let x = tableX;
      const headers = ['No.', 'Student Name', 'Mark'];
      headers.forEach((header, index) => {
        doc.text(header, x + colWidths[index] / 2, y + 5, { align: 'center' });
        if (index < headers.length - 1) {
          doc.line(x + colWidths[index], y, x + colWidths[index], y + rowHeight);
        }
        x += colWidths[index];
      });
      
      y += rowHeight;

      // Table body
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      students.forEach((student, index) => {
        // Check if we need a new page
        if (y + rowHeight > pageHeight - 25) {
          doc.addPage();
          addPageBorder();
          y = addHeader(subject, true);
          
          // Redraw table header on new page
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setFillColor(240, 240, 240);
          doc.rect(tableX, y, tableWidth, rowHeight, 'FD');
          
          let headerX = tableX;
          headers.forEach((header, headerIndex) => {
            doc.text(header, headerX + colWidths[headerIndex] / 2, y + 5, { align: 'center' });
            if (headerIndex < headers.length - 1) {
              doc.line(headerX + colWidths[headerIndex], y, headerX + colWidths[headerIndex], y + rowHeight);
            }
            headerX += colWidths[headerIndex];
          });
          
          y += rowHeight;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        }

        // Row border
        doc.rect(tableX, y, tableWidth, rowHeight, 'S');

        // Cell content
        x = tableX;
        const rowData = [
          (index + 1).toString(),
          student.name,
          student.mark.toString()
        ];

        rowData.forEach((data, cellIndex) => {
          let textAlign = cellIndex === 1 ? 'left' : 'center'; // Left align name, center others
          let textX = cellIndex === 1 ? x + 5 : x + colWidths[cellIndex] / 2; // Padding for name
          
          doc.text(data, textX, y + 5, { align: textAlign });
          
          // Draw vertical lines
          if (cellIndex < rowData.length - 1) {
            doc.line(x + colWidths[cellIndex], y, x + colWidths[cellIndex], y + rowHeight);
          }
          x += colWidths[cellIndex];
        });

        y += rowHeight;
      });

      return y + 10; // Return next Y position with some spacing
    };

    // Generate PDF content
    let isFirstPage = true;

    groupedData.forEach((group) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Add page border
      addPageBorder();

      // Add header
      let currentY = addHeader(group.subject);

      // Draw table
      drawTable(group.subject, group.students, currentY);
    });

    // Add footer to all pages
    addFooter();

    // Generate filename
    const marksRangeText = `${filters.minMarks || 0}-${filters.maxMarks || 100}`;
    const classText = filters.className ? ` ${filters.className}` : '';
    const sectionText = filters.section || 'All';
    const reportTypeText = filters.reportType === 'term' ? 'Full Term Report' : 'Class Report';
    
    const fileName = `${sectionText} - ${reportTypeText} - ${filters.academicYear} - ${currentTerm.term_name} Examination${classText} Subject wise Students ${marksRangeText}.pdf`;

    // Save the PDF
    doc.save(fileName);
  }
};

export default ReportPDFMarksFilter;