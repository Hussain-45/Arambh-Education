import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (filename, rows, headers) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (title, filename, rows, headers) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.autoTable({
    startY: 30,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }, // Primary color
  });
  
  doc.save(`${filename}.pdf`);
};
