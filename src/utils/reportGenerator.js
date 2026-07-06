import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateStudentReportCard = (student, attendance, attempts, assignments, submissions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const colors = {
    primary: [74, 144, 226],     // Elegant Blue #4A90E2
    dark: [33, 37, 41],         // Charcoal #212529
    lightBg: [248, 249, 250],    // Soft Grey #F8F9FA
    success: [16, 185, 129],     // Green #10B981
    danger: [239, 68, 68],       // Red #EF4444
    border: [222, 226, 230]      // Light Border #DEE2E6
  };

  // Helper to draw horizontal divider
  const drawDivider = (y) => {
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
  };

  // --- HEADER SECTION ---
  // Blue Top Banner Accent
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 15, 'F');

  // School Title & Info
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('AARAMBH EDUCATION', 15, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.dark);
  doc.text('Premium Tutoring & Mock Test Platform', 15, 35);
  doc.text('Email: info@aarambh.edu | Web: www.aarambh.edu', 15, 39);

  // Date and Title
  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Generated On: ${todayStr}`, 145, 30);
  doc.text('ACADEMIC REPORT CARD', 145, 35);

  drawDivider(45);

  // --- STUDENT PROFILE SECTION ---
  doc.setFillColor(...colors.lightBg);
  doc.rect(15, 49, 180, 26, 'F');
  doc.setDrawColor(...colors.border);
  doc.rect(15, 49, 180, 26, 'S');

  doc.setFontSize(9);
  doc.setTextColor(...colors.dark);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 20, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name || 'N/A', 48, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Target Batch:', 20, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(student.class || student.className || 'General', 48, 61);

  doc.setFont('helvetica', 'bold');
  doc.text("Father's Name:", 20, 67);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fatherName || 'N/A', 48, 67);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Role/ID:', 105, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student (ID: ${student.admission_number || student.id})`, 128, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Email Address:', 105, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(student.email || 'N/A', 128, 61);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone Number:', 105, 67);
  doc.setFont('helvetica', 'normal');
  doc.text(student.phone || student.parentPhone || 'N/A', 128, 67);

  // Student Photo inside profile block
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 170, 51, 20, 22);
    } catch (e) {
      // Fallback in case of invalid base64 image encoding
      doc.setFillColor(230, 235, 240);
      doc.rect(170, 51, 20, 22, 'F');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('PHOTO ERR', 180, 63, { align: 'center' });
    }
  } else {
    doc.setFillColor(230, 235, 240);
    doc.rect(170, 51, 20, 22, 'F');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('NO PHOTO', 180, 63, { align: 'center' });
  }

  // --- COMPUTE SUMMARY STATS ---
  // Attendance calculations
  const studentAtt = attendance.filter(a => a.studentId === student.id || a.student_id === student.id);
  const presentCount = studentAtt.filter(a => a.status === 'Present').length;
  const totalDays = studentAtt.length;
  const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

  // Quiz calculations
  const studentAttempts = attempts.filter(qa => qa.studentId === student.id);
  const averageQuizScorePct = studentAttempts.length > 0
    ? Math.round(
        (studentAttempts.reduce((sum, qa) => sum + (qa.score / qa.totalQuestions), 0) / studentAttempts.length) * 100
      )
    : 0;

  // Assignment calculations
  const totalClassAssignments = assignments.filter(a => a.className === student.class || a.className === 'All');
  const studentSubmissions = submissions.filter(s => s.studentId === student.id);
  const assignmentCompletionRate = totalClassAssignments.length > 0
    ? Math.round((studentSubmissions.length / totalClassAssignments.length) * 100)
    : 100;

  // --- STATS BOXES SECTION ---
  const drawStatBox = (x, y, width, height, title, value, color) => {
    doc.setFillColor(...colors.lightBg);
    doc.rect(x, y, width, height, 'F');
    doc.setDrawColor(...colors.border);
    doc.rect(x, y, width, height, 'S');

    // Accent line on left side
    doc.setFillColor(...color);
    doc.rect(x, y, 3, height, 'F');

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(title, x + 8, y + 6);

    doc.setTextColor(...color);
    doc.setFontSize(18);
    doc.text(value, x + 8, y + 15);
  };

  drawStatBox(15, 83, 56, 20, 'ATTENDANCE RATE', `${attendancePct}%`, colors.primary);
  drawStatBox(77, 83, 56, 20, 'QUIZ AVERAGE', `${averageQuizScorePct}%`, colors.success);
  drawStatBox(139, 83, 56, 20, 'ASSIGNMENT COMPLETION', `${assignmentCompletionRate}%`, colors.primary);

  // --- TABLE 1: QUIZZES ---
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Mock Quiz & Exam Record', 15, 113);

  const quizRows = studentAttempts.map(qa => [
    qa.quizTitle,
    qa.quizSubject,
    new Date(qa.attemptDate).toLocaleDateString(),
    `${qa.score} / ${qa.totalQuestions}`,
    `${Math.round((qa.score / qa.totalQuestions) * 100)}%`,
    Math.round((qa.score / qa.totalQuestions) * 100) >= 40 ? 'Passed' : 'Failed'
  ]);

  doc.autoTable({
    startY: 116,
    margin: { left: 15, right: 15 },
    head: [['Quiz Title', 'Subject', 'Date Taken', 'Raw Score', 'Percentage', 'Result']],
    body: quizRows.length > 0 ? quizRows : [['No quiz records found', '-', '-', '-', '-', '-']],
    headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      4: { fontStyle: 'bold' },
      5: { fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      // Color Pass/Fail status
      if (data.column.index === 5 && data.cell.section === 'body' && quizRows.length > 0) {
        if (data.cell.text[0] === 'Passed') {
          doc.setTextColor(...colors.success);
        } else if (data.cell.text[0] === 'Failed') {
          doc.setTextColor(...colors.danger);
        }
      }
    }
  });

  // --- TABLE 2: ASSIGNMENTS ---
  const currentY = doc.lastAutoTable.finalY + 12;
  
  // Prevent overflow to next page if too tight
  if (currentY > 230) {
    doc.addPage();
    // Blue Banner on page 2 header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 210, 8, 'F');
  }

  const startYTable2 = currentY > 230 ? 18 : currentY;

  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Homework & Assignment Records', 15, startYTable2 - 3);

  const assignmentRows = totalClassAssignments.map(a => {
    const sub = studentSubmissions.find(s => s.assignmentId === a.id);
    return [
      a.title,
      a.subject,
      sub ? 'Submitted' : 'Pending',
      sub && sub.grade ? sub.grade : (sub ? 'Not Graded' : 'N/A'),
      a.dueDate
    ];
  });

  doc.autoTable({
    startY: startYTable2,
    margin: { left: 15, right: 15 },
    head: [['Assignment Name', 'Subject', 'Submission Status', 'Grade Received', 'Due Date']],
    body: assignmentRows.length > 0 ? assignmentRows : [['No assignments found', '-', '-', '-', '-']],
    headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    didDrawCell: (data) => {
      if (data.column.index === 2 && data.cell.section === 'body' && assignmentRows.length > 0) {
        if (data.cell.text[0] === 'Submitted') {
          doc.setTextColor(...colors.success);
        } else if (data.cell.text[0] === 'Pending') {
          doc.setTextColor(...colors.danger);
        }
      }
    }
  });

  // --- FOOTER & SIGN-OFF SECTION ---
  const finalY = doc.lastAutoTable.finalY + 15;
  const signatureY = finalY > 255 ? (doc.addPage(), 40) : finalY;

  if (signatureY === 40) {
    // Blue banner on page addition
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 210, 8, 'F');
  }

  // Teacher Comments Block
  doc.setFillColor(...colors.lightBg);
  doc.rect(15, signatureY, 110, 25, 'F');
  doc.setDrawColor(...colors.border);
  doc.rect(15, signatureY, 110, 25, 'S');

  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FACULTY REMARKS & RECOMMENDATIONS:', 18, signatureY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Keep practicing mock exams regularly. Your subject progress is trackable', 18, signatureY + 13);
  doc.text('online. Focus on improving mock quiz score averages.', 18, signatureY + 18);

  // Signature Block
  doc.setDrawColor(...colors.dark);
  doc.setLineWidth(0.5);
  doc.line(140, signatureY + 18, 190, signatureY + 18);

  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Director / Head Academic Advisor', 142, signatureY + 23);

  // Save the report card PDF
  doc.save(`${student.name.replace(/\s+/g, '_')}_Academic_Report.pdf`);
};
