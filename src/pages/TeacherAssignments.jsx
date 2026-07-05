import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Check, FileText, Send, AlertCircle, Award, Calendar } from 'lucide-react';

const TeacherAssignments = () => {
  const { 
    loggedInUser, assignments, submissions, students, classes, 
    addAssignment, gradeSubmission, addToast, teachers 
  } = useContext(AppContext);

  // Find the matching teacher record to get their allotted classes
  const teacherRecord = teachers.find(t => t.id === loggedInUser?.id || t.username === loggedInUser?.username || t.email === loggedInUser?.email);
  const allottedClasses = loggedInUser?.assignedClasses || teacherRecord?.assignedClasses || [];

  // Filter based on teacher's assigned classes
  const myClasses = classes.filter(c => 
    allottedClasses.includes(c.name)
  );

  const myClassNames = myClasses.map(c => c.name);

  // Form States for deployment
  const [title, setTitle] = useState('');
  const [targetBatch, setTargetBatch] = useState(myClasses[0]?.name || '10th Math');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('PDF');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('link'); // 'file' or 'link'

  // Selected Assignment and Student for Grading
  const myAssignments = assignments.filter(a => myClassNames.includes(a.subject));
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(myAssignments[0]?.id || null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Grading Form States
  const [score, setScore] = useState('');
  const [letterMark, setLetterMark] = useState('A+');
  const [feedback, setFeedback] = useState('');

  const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);
  const assignmentSubmissions = submissions.filter(s => s.assignmentId === selectedAssignmentId);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const activeSubmission = submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === selectedStudentId);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!title || !targetBatch || !dueDate) {
      addToast('Please fill out all required fields.', 'warning');
      return;
    }
    const success = await addAssignment(title, targetBatch, dueDate, type, link, file);
    if (success) {
      setTitle('');
      setDueDate('');
      setLink('');
      setFile(null);
      addToast('Assignment deployed successfully!', 'success');
    }
  };

  const handlePublishGrade = () => {
    if (!activeSubmission) return;
    if (!score.trim()) {
      addToast('Please enter a numerical score.', 'warning');
      return;
    }
    
    const combinedGrade = `${score} (${letterMark})`;
    gradeSubmission(activeSubmission.id, combinedGrade, feedback);
    
    // Clear selection or grading states
    setScore('');
    setFeedback('');
    setSelectedStudentId(null);
  };

  // Select student for grading
  const handleSelectStudentForGrading = (studentId) => {
    setSelectedStudentId(studentId);
    const sub = submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === studentId);
    if (sub && sub.grade) {
      // Pre-populate if already graded
      const matches = sub.grade.match(/^(\d+)\s*\((.+)\)$/);
      if (matches) {
        setScore(matches[1]);
        setLetterMark(matches[2]);
      } else {
        setScore(sub.grade);
      }
      setFeedback(sub.feedback || '');
    } else {
      setScore('');
      setLetterMark('A+');
      setFeedback('');
    }
  };

  const inputStyle = {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'white',
    borderRadius: '10px',
    padding: '0.65rem 1rem',
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />

        {/* Page Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Assignment Matrix & Gradebook</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>Deploy coursework and evaluate student submissions.</p>
        </div>

        {/* Two-Column Responsive Split Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Deploy Workbench & Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Deploy Workbench Form */}
            <div className="prof-card" style={{ padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
                <Plus size={20} color="var(--primary-text)" /> Coursework Deployment Workbench
              </h3>
              <form onSubmit={handleCreateAssignment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>COURSEWORK TITLE</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Linear Equations Homework Sheet" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="prof-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>TARGET BATCH</label>
                  <select 
                    value={targetBatch} 
                    onChange={e => setTargetBatch(e.target.value)} 
                    className="prof-input"
                    style={inputStyle}
                  >
                    {myClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {myClasses.length === 0 && <option value="10th Math">10th Math</option>}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>DUE DATE</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={e => setDueDate(e.target.value)} 
                      className="prof-input"
                      style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                    />
                    <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.5rem', marginTop: '0.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input type="radio" checked={uploadMode === 'file'} onChange={() => setUploadMode('file')} /> Upload PDF Attachment
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input type="radio" checked={uploadMode === 'link'} onChange={() => setUploadMode('link')} /> External URL / Link
                  </label>
                </div>

                {uploadMode === 'file' ? (
                  <div style={{ gridColumn: 'span 2' }}>
                    <input 
                      type="file" 
                      accept="application/pdf, image/*" 
                      onChange={e => setFile(e.target.files[0])} 
                      className="prof-input"
                      style={inputStyle}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>Supported formats: PDF, PNG, JPG (Max 50MB)</small>
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <input 
                      type="url" 
                      placeholder="e.g. https://drive.google.com/your-homework-sheet" 
                      value={link} 
                      onChange={e => setLink(e.target.value)} 
                      className="prof-input"
                      style={inputStyle}
                    />
                  </div>
                )}

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="prof-btn" style={{ padding: '0.8rem 1.6rem', fontWeight: 700 }}>Deploy Coursework</button>
                </div>
              </form>
            </div>

            {/* Checklist & Submissions */}
            <div className="prof-card" style={{ padding: '1.8rem' }}>
              <div className="flex-between" style={{ marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, color: 'var(--text-main)' }}>Active Submission Checklist</h3>
                <select 
                  value={selectedAssignmentId || ''} 
                  onChange={e => {
                    setSelectedAssignmentId(Number(e.target.value));
                    setSelectedStudentId(null);
                  }} 
                  className="prof-input"
                  style={{ 
                    width: '240px', 
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    fontWeight: 600,
                    padding: '0.6rem 1rem'
                  }}
                >
                  {myAssignments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.subject})</option>)}
                  {myAssignments.length === 0 && <option value="">No Active Assignments</option>}
                </select>
              </div>

              {activeAssignment ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>STUDENT NAME</th>
                        <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>TURNED IN TIME</th>
                        <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>STATUS</th>
                        <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.filter(s => s.class === activeAssignment.subject).map(student => {
                        const sub = submissions.find(s => s.assignmentId === activeAssignment.id && s.studentId === student.id);
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                            <td style={{ fontWeight: 600, color: 'var(--text-main)', padding: '1.2rem 1rem' }}>{student.name}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1.2rem 1rem' }}>
                              {sub ? sub.timestamp || 'N/A' : '—'}
                            </td>
                            <td style={{ textAlign: 'center', padding: '1.2rem 1rem' }}>
                              {sub ? (
                                <span className={`badge badge-${sub.status === 'Graded' ? 'success' : 'warning'}`} style={{ fontWeight: 700 }}>
                                  {sub.status}
                                </span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontWeight: 600 }}>Missing</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', padding: '1.2rem 1rem' }}>
                              {sub ? (
                                <button 
                                  onClick={() => handleSelectStudentForGrading(student.id)}
                                  className="prof-btn prof-btn-secondary"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {sub.status === 'Graded' ? 'Edit Grade' : 'Grade Roster'}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>No submission</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', padding: '3rem' }}>
                  No active assignments selected. Please deploy an assignment worksheet first.
                </p>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Evaluation Card */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '450px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-main)' }}>
                <Award size={20} color="var(--warning)" /> Submission Evaluation Desk
              </h3>

              {selectedStudent && activeSubmission ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>STUDENT</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 750 }}>{selectedStudent.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>Roll: {selectedStudent.admission_number || `#${selectedStudent.id}`}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>SUBMISSION FILE / ATTACHMENT</span>
                    <a 
                      href={activeSubmission.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        color: 'var(--primary-text)', fontSize: '0.9rem', wordBreak: 'break-all', 
                        display: 'inline-flex', alignItems: 'center', gap: '6px', 
                        textDecoration: 'none', fontWeight: 700 
                      }}
                    >
                      <FileText size={16} /> Open Attached Work
                    </a>
                  </div>

                  {activeSubmission.text && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>STUDENT SUBMISSION NOTES</span>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{activeSubmission.text}"
                      </p>
                    </div>
                  )}

                  <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

                  {/* Grading Inputs */}
                  <div style={{ display: 'flex', gap: '1.2rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>SCORE (100)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="e.g. 95" 
                        value={score} 
                        onChange={e => setScore(e.target.value)} 
                        className="prof-input"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ width: '130px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>LETTER MARK</label>
                      <select 
                        value={letterMark} 
                        onChange={e => setLetterMark(e.target.value)} 
                        className="prof-input"
                        style={inputStyle}
                      >
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="B+">B+</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="F">F</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>EVALUATION REMARKS</label>
                    <textarea 
                      placeholder="Type feedback, suggestions, or notes here..." 
                      value={feedback} 
                      onChange={e => setFeedback(e.target.value)} 
                      className="prof-input"
                      rows={4}
                      style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit', lineHeight: '1.4' }}
                    />
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <button 
                      onClick={handlePublishGrade}
                      className="prof-btn"
                      style={{ display: 'flex', width: '100%', gap: '8px', justifyContent: 'center', padding: '0.9rem 1.2rem', fontWeight: 700, borderRadius: '10px' }}
                    >
                      <Send size={16} /> Publish Grade Evaluation
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>Select a student's submission from the checklist on the left to grade, or review the current coursework statistics below.</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>DEPLOYED</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 850, marginTop: '4px', color: 'var(--text-main)' }}>{myAssignments.length} Tasks</div>
                    </div>
                    <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SUBMISSIONS</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 850, marginTop: '4px', color: 'var(--primary-text)' }}>{submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId)).length} Total</div>
                    </div>
                    <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>GRADED</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 850, marginTop: '4px', color: '#10b981' }}>{submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId) && s.grade).length} Checked</div>
                    </div>
                    <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>PENDING</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 850, marginTop: '4px', color: '#f59e0b' }}>{submissions.filter(s => myAssignments.some(a => a.id === s.assignmentId) && !s.grade).length} Reviews</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', padding: '1.2rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <AlertCircle size={20} color="var(--primary-text)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Select a student's submission from the checklist on the left to review their uploaded attachment, notes, and assign numerical scores and feedback.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default TeacherAssignments;
