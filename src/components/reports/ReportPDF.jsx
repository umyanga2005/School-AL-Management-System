// src/components/reports/ReportPDF.jsx
import jsPDF from 'jspdf';

// Import autoTable directly and add it to jsPDF
import autoTable from 'jspdf-autotable';

// Add autoTable to jsPDF prototype
jsPDF.autoTable = autoTable;

export const ReportPDF = {
  generatePDF: (data) => {
    const { students, subjects, summary, currentTerm, filters, className } = data;
    
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT MARK SHEET REPORT', pageWidth / 2, margin, { align: 'center' });
    
    // Add term and class info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let infoY = margin + 10;
    
    if (currentTerm) {
      doc.text(`Term: ${currentTerm.term_name} (${currentTerm.exam_year})`, margin, infoY);
    }
    
    if (filters.reportType === 'class' && className) {
      doc.text(`Class: ${className}`, margin, infoY + 7);
    }
    
    doc.text(`Ranking Method: ${filters.rankingMethod === 'totalMarks' ? 'Total Marks' : 
      filters.rankingMethod === 'average' ? 'Average (No Common)' : 'Z-Score (No Common)'}`, margin, infoY + 14);
    
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, infoY, { align: 'right' });
    
    // Add summary table
    const summaryY = infoY + 25;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', margin, summaryY);
    
    doc.autoTable({
      startY: summaryY + 5,
      head: [['Total Students', 'Total Subjects', 'Class Average', 'Highest Score', 'Lowest Score']],
      body: [[
        summary.totalStudents || 0,
        summary.totalSubjects || 0,
        `${summary.classAverage || 0}%`,
        `${summary.highestScore || 0}%`,
        `${summary.lowestScore || 0}%`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245] },
      margin: { top: 5, bottom: 10 }
    });
    
    // Prepare data for detailed table
    const tableColumns = [
      { header: 'Rank', dataKey: 'rank' },
      { header: 'Index No', dataKey: 'index_number' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Class', dataKey: 'current_class' }
    ];
    
    // Add subject columns
    subjects.forEach(subject => {
      tableColumns.push({ 
        header: subject.name, 
        dataKey: `subject_${subject.id}`,
        dataProperty: `subject_${subject.id}`
      });
    });
    
    // Add total and average columns
    tableColumns.push({ header: 'Total', dataKey: 'totalMarks' });
    tableColumns.push({ header: 'Average', dataKey: 'average' });
    
    if (filters.rankingMethod === 'zscore') {
      tableColumns.push({ header: 'Z-Score', dataKey: 'zScore' });
    }
    
    // Prepare table rows
    const tableRows = students.map(student => {
      const row = {
        rank: student.rank,
        index_number: student.index_number,
        name: student.name,
        current_class: student.current_class,
        totalMarks: student.totalMarks.toFixed(2),
        average: (() => {
          const nonCommonMarks = student.marks.filter(m => 
            subjects.find(s => s.id === m.subject_id)?.stream !== 'Common'
          );
          return nonCommonMarks.length > 0 
            ? (nonCommonMarks.reduce((sum, m) => sum + m.marks, 0) / nonCommonMarks.length).toFixed(2)
            : '0.00';
        })(),
        zScore: student.zScore ? student.zScore.toFixed(2) : '0.00'
      };
      
      // Add subject marks
      subjects.forEach(subject => {
        const subjectMark = student.marks.find(m => m.subject_id === subject.id);
        row[`subject_${subject.id}`] = subjectMark ? subjectMark.marks : '-';
      });
      
      return row;
    });
    
    // Add detailed table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      columns: tableColumns,
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { top: 5 },
      pageBreak: 'auto',
      tableWidth: 'wrap'
    });
    
    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = filters.reportType === 'class' 
      ? `Class_${className}_Mark_Sheet.pdf` 
      : 'Full_Term_Mark_Sheet.pdf';
    
    doc.save(fileName);
  }
};

export default ReportPDF;