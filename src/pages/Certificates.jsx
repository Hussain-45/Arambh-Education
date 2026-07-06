import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FileText, Download, Award, ShieldAlert, CheckSquare, Square, Settings } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import jsPDF from 'jspdf';

export default function Certificates() {
  const { apiBaseUrl, authToken, showToast } = useContext(AppContext);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [docType, setDocType] = useState('certificate'); // 'certificate' or 'id_card'
  const [customHeader, setCustomHeader] = useState('Certificate of Achievement');
  const [customDescription, setCustomDescription] = useState('for outstanding academic performance and dedication to learning.');
  const [signatory, setSignatory] = useState('Aarambh Academic Director');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch classes
  useEffect(() => {
    fetch('http://localhost:5000/api/classes', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0].name);
        }
      })
      .catch(err => console.error(err));
  }, [authToken]);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    fetch('http://localhost:5000/api/students', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        // Filter by class name
        const filtered = data.filter(s => s.class === selectedClass);
        setStudents(filtered);
        // Default select all
        const initialSelected = {};
        filtered.forEach(s => {
          initialSelected[s.id] = true;
        });
        setSelectedStudents(initialSelected);
      })
      .catch(err => console.error(err));
  }, [selectedClass, authToken]);

  const toggleSelectStudent = (id) => {
    setSelectedStudents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAll = () => {
    const allSelected = Object.values(selectedStudents).every(v => v);
    const updated = {};
    students.forEach(s => {
      updated[s.id] = !allSelected;
    });
    setSelectedStudents(updated);
  };

  const handleGenerate = () => {
    const targets = students.filter(s => selectedStudents[s.id]);
    if (targets.length === 0) {
      showToast('Please select at least one student.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      if (docType === 'certificate') {
        generateCertificates(targets);
      } else {
        generateIdCards(targets);
      }
      showToast(`Successfully generated ${targets.length} PDF documents!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating document.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCertificates = (targets) => {
    // Create Landscape PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    targets.forEach((student, index) => {
      if (index > 0) doc.addPage();

      // Page dimensions: 297mm x 210mm
      // Draw double border
      doc.setDrawColor(124, 98, 243); // Primary purple
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 277, 190);
      
      doc.setDrawColor(245, 158, 11); // Gold accent
      doc.setLineWidth(0.5);
      doc.rect(12, 12, 273, 186);

      // Certificate header
      doc.setTextColor(124, 98, 243);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('AARAMBH EDUCATION', 148, 40, { align: 'center' });

      // Sub-header
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(14);
      doc.text('AN ACADEMIC INSTITUTION OF EXCELLENCE', 148, 48, { align: 'center' });

      // Document Title
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(customHeader.toUpperCase(), 148, 75, { align: 'center' });

      // Presenting to
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(14);
      doc.text('This is proudly presented to', 148, 92, { align: 'center' });

      // Student Name
      doc.setTextColor(124, 98, 243);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(26);
      doc.text(student.name, 148, 108, { align: 'center' });

      // Horizontal separator line under name
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.8);
      doc.line(78, 114, 218, 114);

      // Description text
      doc.setTextColor(71, 85, 105);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(
        `of Class ${selectedClass} ${customDescription}`,
        200
      );
      doc.text(splitText, 148, 125, { align: 'center' });

      // Date & Signatures
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Date line
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.line(48, 165, 108, 165);
      doc.text('Date of Issue', 78, 172, { align: 'center' });
      doc.text(currentDate, 78, 161, { align: 'center' });

      // Signature line
      doc.line(188, 165, 248, 165);
      doc.text(signatory, 218, 172, { align: 'center' });
      doc.setFont('Courier', 'bolditalic');
      doc.setFontSize(14);
      doc.text('Authorized Seal', 218, 161, { align: 'center' });
    });

    doc.save(`Certificates_${selectedClass.replace(/\s+/g, '_')}.pdf`);
  };

  const generateIdCards = (targets) => {
    // Standard ID Card PDF (Standard Portrait layout)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Layout configuration: 4 cards per page (2x2 grid)
    // Card dimensions: 85mm x 120mm
    const cardW = 85;
    const cardH = 120;
    const paddingX = 15;
    const paddingY = 15;
    const gapX = 10;
    const gapY = 10;

    targets.forEach((student, index) => {
      const pageIndex = index % 4;
      if (index > 0 && pageIndex === 0) {
        doc.addPage();
      }

      // Calculate grid placement
      const col = pageIndex % 2;
      const row = Math.floor(pageIndex / 2);
      const x = paddingX + col * (cardW + gapX);
      const y = paddingY + row * (cardH + gapY);

      // Card Background box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.setLineWidth(0.4);
      doc.rect(x, y, cardW, cardH, 'FD');

      // Top Banner (Header)
      doc.setFillColor(124, 98, 243);
      doc.rect(x, y, cardW, 20, 'F');

      // School Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('AARAMBH EDUCATION', x + cardW / 2, y + 8, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('STUDENT IDENTITY CARD', x + cardW / 2, y + 14, { align: 'center' });

      // Photo Frame Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.rect(x + (cardW - 25) / 2, y + 25, 25, 28, 'FD');
      
      // Placeholder text in Photo Box
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6);
      doc.text('STUDENT\nPHOTO', x + cardW / 2, y + 37, { align: 'center' });

      // Student Identity text details
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(student.name.toUpperCase(), x + cardW / 2, y + 60, { align: 'center' });

      doc.setTextColor(124, 98, 243);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Roll No: ${student.admission_number || 'N/A'}`, x + cardW / 2, y + 65, { align: 'center' });

      // Detailed key values
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont('Helvetica', 'normal');
      
      const detailsY = y + 74;
      doc.text(`Class/Batch:`, x + 10, detailsY);
      doc.setFont('Helvetica', 'bold');
      doc.text(selectedClass, x + 35, detailsY);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Father's Name:`, x + 10, detailsY + 5);
      doc.setFont('Helvetica', 'bold');
      doc.text(student.fatherName || 'N/A', x + 35, detailsY + 5);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Parent Contact:`, x + 10, detailsY + 10);
      doc.setFont('Helvetica', 'bold');
      doc.text(student.parentPhone || 'N/A', x + 35, detailsY + 10);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Admission Date:`, x + 10, detailsY + 15);
      doc.setFont('Helvetica', 'bold');
      doc.text(student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : 'N/A', x + 35, detailsY + 15);

      // Card footer barcode line decoration
      doc.setDrawColor(124, 98, 243);
      doc.setLineWidth(1);
      doc.line(x + 5, y + 112, x + cardW - 5, y + 112);
      
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(6);
      doc.text('If found, return to school desk. Call: +91 98765 43210', x + cardW / 2, y + 116, { align: 'center' });
    });

    doc.save(`Student_ID_Cards_${selectedClass.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <div style={{ padding: '1rem', maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Card */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Award className="h-6 w-6" style={{ color: 'var(--primary-text)' }} />
                Bulk Certificate & ID Card Generator
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select batches and bulk download customized student credentials instantly.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Left Column: Form & Student Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Select & Settings Panel */}
              <div style={{ background: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <Settings size={16} />
                  Document Options
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Select Batch:</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Document Type:</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setDocType('certificate');
                          setCustomHeader('Certificate of Achievement');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '10px',
                          border: docType === 'certificate' ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                          background: docType === 'certificate' ? 'rgba(124, 98, 243, 0.08)' : 'var(--bg-main)',
                          color: docType === 'certificate' ? 'var(--primary-text)' : 'var(--text-main)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Certificate
                      </button>
                      <button
                        onClick={() => {
                          setDocType('id_card');
                          setCustomHeader('Student Identity Card');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '10px',
                          border: docType === 'id_card' ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                          background: docType === 'id_card' ? 'rgba(124, 98, 243, 0.08)' : 'var(--bg-main)',
                          color: docType === 'id_card' ? 'var(--primary-text)' : 'var(--text-main)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        ID Card
                      </button>
                    </div>
                  </div>
                </div>

                {docType === 'certificate' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Certificate Title:</label>
                      <input
                        type="text"
                        value={customHeader}
                        onChange={(e) => setCustomHeader(e.target.value)}
                        placeholder="e.g. Certificate of Achievement, Science Fair Winner"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Achievement Paragraph Description:</label>
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={2}
                        placeholder="for outstanding progress and completion of the course module syllabus..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Signatory Authority Name:</label>
                      <input
                        type="text"
                        value={signatory}
                        onChange={(e) => setSignatory(e.target.value)}
                        placeholder="e.g. School Director, Principal"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Student Selection List */}
              <div style={{ background: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Student List ({students.length})
                  </h3>
                  <button
                    onClick={toggleSelectAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-text)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {students.length > 0 && Object.values(selectedStudents).every(v => v) ? (
                      <>Deselect All</>
                    ) : (
                      <>Select All</>
                    )}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No students registered in this batch.
                    </div>
                  ) : (
                    students.map(s => {
                      const isSelected = selectedStudents[s.id];
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleSelectStudent(s.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-main)',
                            border: isSelected ? '1px solid var(--primary-text)' : '1px solid var(--border-color)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {isSelected ? (
                              <CheckSquare size={18} style={{ color: 'var(--primary-text)' }} />
                            ) : (
                              <Square size={18} style={{ color: 'var(--text-muted)' }} />
                            )}
                            <div>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {s.admission_number || 'N/A'}</div>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {selectedClass}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Preview & Action Trigger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Document Preview Placeholder */}
              <div style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>
                  Template Layout Preview
                </h3>
                <div style={{
                  border: '1.5px dashed var(--border-color)',
                  borderRadius: '12px',
                  background: 'var(--bg-main)',
                  padding: '2.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.8rem',
                  justifyContent: 'center',
                  minHeight: '220px'
                }}>
                  <FileText size={42} style={{ color: 'var(--primary-text)', opacity: 0.8 }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {docType === 'certificate' ? 'Landscape Certificate (A4)' : 'Portrait ID Card (85x120mm)'}
                    </div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                      {docType === 'certificate' 
                        ? 'Includes decorative double borders, gold branding seal, custom wording lines, and issue date.' 
                        : 'Calculates roll numbers, lists emergency contacts, and places photo boxes (4 cards per A4 sheet).'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || students.length === 0}
                  style={{
                    width: '100%',
                    background: 'var(--primary-text)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isGenerating || students.length === 0 ? 0.6 : 1
                  }}
                >
                  <Download size={16} />
                  {isGenerating ? 'Compiling PDF...' : 'Download Bulk Document'}
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  );
}
