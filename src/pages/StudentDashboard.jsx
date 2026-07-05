import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import { Sun, Moon, IndianRupee, FileText, Download, Calendar, Award, Bell, HelpCircle, Clock } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import FeeReceiptModal from '../components/FeeReceiptModal';

const StudentDashboard = () => {
  const { loggedInUser, theme, setTheme, fees, assignments, submissions, library, announcements, doubtTickets, addDoubtTicket, students, teachers, classes } = useContext(AppContext);
  
  // Receipt modal states
  const [selectedReceiptFee, setSelectedReceiptFee] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Streak state
  const [streakCount, setStreakCount] = useState(1);

  // Countdown & timeline ticks
  const [currentTime, setCurrentTime] = useState(new Date());

  // Doubt desk states
  const [doubtSubject, setDoubtSubject] = useState('');
  const [doubtDesc, setDoubtDesc] = useState('');

  // Performance Tooltip state
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    // 1. Calculate streaks
    try {
      const streakData = JSON.parse(localStorage.getItem('aarambh_streaks') || '{}');
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      
      let currentStreak = streakData.count || 1;
      let lastActive = streakData.lastActive || '';
      
      if (lastActive === yesterdayStr) {
        currentStreak += 1;
        localStorage.setItem('aarambh_streaks', JSON.stringify({ count: currentStreak, lastActive: todayStr }));
      } else if (lastActive !== todayStr) {
        currentStreak = 1;
        localStorage.setItem('aarambh_streaks', JSON.stringify({ count: currentStreak, lastActive: todayStr }));
      }
      setStreakCount(currentStreak);
    } catch(e) {
      // fallback
    }

    // 2. Timer for live timeline status calculations
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!loggedInUser) return null;

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const monthsOrder = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getJoiningMonthIndex = (regDateStr) => {
    if (!regDateStr) return 0;
    const parts = regDateStr.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return monthNum - 1;
      }
    }
    return 0;
  };

  const studentProfile = students.find(s => s.id === loggedInUser.id);
  const regDate = studentProfile?.registrationDate || loggedInUser.registrationDate || loggedInUser.registration_date;
  const joiningMonthIndex = getJoiningMonthIndex(regDate);
  const myFeesList = fees.filter(f => f.studentId === loggedInUser.id && monthsOrder.indexOf(f.month) >= joiningMonthIndex);
  const sortedFees = [...myFeesList].sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));

  // Determine allowed months for the last 6 months (ending with the current month)
  const currentMonthIdx = new Date().getMonth();
  const allowedMonths = [];
  for (let i = 0; i < 6; i++) {
    const idx = (currentMonthIdx - i + 12) % 12;
    allowedMonths.push(monthsOrder[idx]);
  }

  // Filter list to only the last 6 months
  const last6MonthsFees = sortedFees.filter(f => allowedMonths.includes(f.month));

  const totalAssigned = sortedFees.reduce((sum, f) => sum + f.total, 0);
  const totalPaid = sortedFees.reduce((sum, f) => sum + f.paid, 0);
  const totalPending = totalAssigned - totalPaid;

  const mySubmissions = submissions.filter(s => s.studentId === loggedInUser.id);
  const myAssignments = assignments.filter(a => a.subject === loggedInUser.class);
  const myLibrary = library.filter(l => l.subject === loggedInUser.class);
  const gradedSubmissions = mySubmissions.filter(s => s.grade);
  const latestGrade = gradedSubmissions.length > 0
    ? gradedSubmissions[gradedSubmissions.length - 1].grade
    : 'No Graded Work';
  
  // Mapped doubt tickets for current student
  const myDoubtTickets = doubtTickets.filter(t => t.studentId === loggedInUser.id);

  const handleDownloadReport = () => {
    const rows = [
      ['Algebra Midterm', 'June 10, 2026', '45 / 50', 'A'],
      ['Newtonian Mechanics Exam', 'June 18, 2026', '92 / 100', 'A+'],
      ['English Literature Quiz', 'June 22, 2026', '80 / 100', 'B']
    ];
    myAssignments.forEach(a => {
      const sub = mySubmissions.find(s => s.assignmentId === a.id);
      rows.push([a.title, a.dueDate || 'N/A', '—', sub?.grade || 'Submitted']);
    });
    exportToPDF(`${loggedInUser.name} - Report Card`, 'Report Card', rows, ['Test / Assignment', 'Date', 'Marks', 'Grade']);
  };

  const handleDownloadReceipt = (fee) => {
    const rows = [
      ['Student Name', loggedInUser.name],
      ['Admission No.', loggedInUser.admission_number || 'AES1'],
      ['Class/Batch', loggedInUser.class],
      ['Father\'s Name', loggedInUser.fatherName || 'Not Saved'],
      ['Month Paid', fee.month],
      ['Total Fee', `Rs. ${fee.total}`],
      ['Amount Paid', `Rs. ${fee.paid}`],
      ['Payment Mode', fee.paymentMode || 'Online Mock Gateway'],
      ['Payment Date', fee.paymentDate || new Date().toLocaleDateString()]
    ];
    exportToPDF(`Fee_Receipt_${fee.month}_${loggedInUser.name}`, `Fee Payment Receipt`, rows, ['Receipt Item', 'Details']);
  };

  // Get initials for profile avatar
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Dynamic Schedule for student's batch
  const studentClass = classes.find(c => c.name === loggedInUser.class);
  const todayTimeline = [];
  if (studentClass && studentClass.time) {
    const timeParts = studentClass.time.split('-');
    if (timeParts.length === 2) {
      const start = timeParts[0].trim();
      const end = timeParts[1].trim();
      const classTeacher = teachers.find(t => t.assignedClasses?.includes(studentClass.name));
      todayTimeline.push({
        title: `${studentClass.name} Session`,
        start,
        end,
        instructor: classTeacher ? classTeacher.name : 'Allotted Faculty'
      });
    }
  }

  const getTimelineStatus = (startStr, endStr) => {
    const parseTime = (timeStr) => {
      try {
        const d = new Date(currentTime);
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
        return d;
      } catch (e) {
        return new Date();
      }
    };

    const startTime = parseTime(startStr);
    const endTime = parseTime(endStr);
    const timeDiff = startTime.getTime() - currentTime.getTime();

    if (currentTime >= startTime && currentTime <= endTime) {
      return { label: 'LIVE NOW', status: 'LIVE' };
    } else if (timeDiff > 0 && timeDiff <= 30 * 60 * 1000) {
      const mins = Math.round(timeDiff / (60 * 1000));
      return { label: `Starts in ${mins}m`, status: 'SOON' };
    }
    return { label: startStr, status: 'FUTURE' };
  };

  // Doubt Clearance Submit Handler
  const handleDoubtSubmit = (e) => {
    e.preventDefault();
    if (!doubtSubject.trim() || !doubtDesc.trim()) return;
    addDoubtTicket(doubtSubject, doubtDesc);
    setDoubtSubject('');
    setDoubtDesc('');
  };

  // Performance analytics SVG config
  const testResults = [];

  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 25;

  const points = testResults.map((t, idx) => {
    const x = testResults.length > 1
      ? paddingX + (idx * (svgWidth - paddingX * 2) / (testResults.length - 1))
      : svgWidth / 2;
    const y = svgHeight - paddingY - ((t.score - 50) / 50 * (svgHeight - paddingY * 2)); // map 50-100% to Y space
    return { x, y, ...t };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, idx) => acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <>
      <Sidebar />
      <div className="main-content" style={{ padding: '2rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
        
        {/* Modern Glassmorphic Header */}
        <header className="prof-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--secondary) 100%)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'var(--primary-text)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
              {getInitials(loggedInUser.name)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{loggedInUser.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span><strong>Admission No:</strong> {loggedInUser.admission_number || 'AES1'}</span>
                <span>•</span>
                <span><strong>Batch:</strong> {loggedInUser.class}</span>
                <span>•</span>
                <span><strong>Father's Name:</strong> {loggedInUser.fatherName || '—'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Gamified Study Streak Tracker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.4rem 0.8rem', borderRadius: '20px', boxShadow: '0 0 10px rgba(245, 158, 11, 0.1)' }}>
              <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 4px #f59e0b)', display: 'inline-block', transform: 'scale(1)', animation: 'pulse 2s infinite' }}>🔥</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>{streakCount} Day Streak</span>
            </div>

            <div onClick={toggleTheme} style={{ cursor: 'pointer', padding: '0.6rem', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Active Student</span>
          </div>
        </header>

        {/* Premium Stat Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="prof-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', borderLeft: '4px solid var(--primary-text)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Attendance</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>96.2%</div>
            </div>
          </div>

          <div className="prof-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Tuition Fee</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.2rem' }}>₹{totalPending}</div>
            </div>
          </div>

          <div className="prof-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest Academic Grade</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>{latestGrade}</div>
            </div>
          </div>

        </div>

        {/* Class Bulletin & Announcements */}
        <div className="prof-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--warning)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} style={{ color: 'var(--warning)' }} /> Class Bulletin & Announcements
          </h2>
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              No active announcements. Check back later for tuition updates!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{ann.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ann.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Dashboard Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Monthly Fees & Receipts & Study Materials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="prof-card">
              <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }} className="flex-center gap-2">
                  <IndianRupee size={20} style={{ color: 'var(--primary-text)' }} /> Monthly Fee Status & Receipts
                </h2>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span className="badge badge-secondary">Last 6 Months</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="prof-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Monthly Fee</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th>Payment Mode</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last6MonthsFees.map(fee => (
                      <tr key={fee.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fee.month}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{fee.dueDate}</td>
                        <td>₹{fee.total}</td>
                        <td>₹{fee.paid}</td>
                        <td>
                          <span className={`badge badge-${fee.status === 'Paid' ? 'success' : 'danger'}`} style={{ padding: '0.3rem 0.6rem' }}>
                            {fee.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {fee.paymentMode ? `${fee.paymentMode}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {fee.status !== 'Paid' ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Payment</span>
                          ) : (
                            <button onClick={() => { setSelectedReceiptFee(fee); setIsReceiptModalOpen(true); }} className="prof-btn prof-btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Download size={12} /> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {last6MonthsFees.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No monthly fees mapped. Please check with administrator.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Study Materials */}
            <div className="prof-card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem' }}>Study Materials & E-Books</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {myLibrary.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: 'span 2' }}>No study materials uploaded for your batch yet.</p>
                )}
                {myLibrary.map(item => (
                  <a href={item.link} key={item.id} className="flex-between" style={{ textDecoration: 'none', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{item.title}</span>
                    <span className="badge badge-warning">{item.type}</span>
                  </a>
                ))}
              </div>
            </div>

             {/* Performance SVG Line-Graph Analytics Widget */}
            <div className="prof-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, marginBottom: '1.5rem' }}>Performance Analytics</h2>
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', minHeight: '160px', alignItems: 'center' }}>
                {testResults.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>
                    No performance scores recorded yet
                  </div>
                ) : (
                  <>
                    <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary-text)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--primary-text)" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      {[50, 60, 70, 80, 90, 100].map((val, idx) => {
                        const y = svgHeight - paddingY - ((val - 50) / 50 * (svgHeight - paddingY * 2));
                        return (
                          <g key={idx}>
                            <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="4 4" />
                            <text x={paddingX - 10} y={y + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end" fontFamily="monospace">{val}%</text>
                          </g>
                        );
                      })}

                      {/* Area fill */}
                      <path d={areaD} fill="url(#chartGlow)" />

                      {/* Stroke line */}
                      <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth={3} strokeLinecap="round" />

                      {/* Connection Points */}
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint?.idx === idx ? 7 : 4}
                          fill="var(--bg-card)"
                          stroke={hoveredPoint?.idx === idx ? "#10b981" : "var(--primary-text)"}
                          strokeWidth={3}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={() => setHoveredPoint({ idx, ...p })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}

                      {/* X Axis Labels */}
                      {points.map((p, idx) => (
                        <text key={idx} x={p.x} y={svgHeight - 5} fill="var(--text-muted)" fontSize={8.5} textAnchor="middle">{p.name}</text>
                      ))}
                    </svg>

                    {/* Hover Tooltip box */}
                    {hoveredPoint && (
                      <div style={{
                        position: 'absolute',
                        left: `${hoveredPoint.x - 60}px`,
                        top: `${hoveredPoint.y - 65}px`,
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid var(--border-color)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.75rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        zIndex: 10,
                        pointerEvents: 'none',
                        textAlign: 'center'
                      }}>
                        <strong style={{ display: 'block', color: '#10b981' }}>{hoveredPoint.name}</strong>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{hoveredPoint.score}% Score</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Tests/Marks & Timeline & Doubt Clearance Desk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Academic Tests Card (Read-Only) */}
            <div className="prof-card">
              <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }} className="flex-center gap-1">
                  <Award size={18} style={{ color: 'var(--primary-text)' }} /> Test Grades
                </h3>
                <button onClick={handleDownloadReport} className="prof-btn prof-btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                  <Download size={12}/> Report PDF
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                * Grades and scores are updated by the admin/teachers and are read-only.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {testResults.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                    No grades recorded yet.
                  </div>
                ) : (
                  testResults.map((t, idx) => (
                    <div key={idx} style={{ padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.name}</span>
                        <span className={`badge ${t.score >= 90 ? 'badge-success' : t.score >= 80 ? 'badge-info' : 'badge-warning'}`}>
                          {t.score >= 90 ? 'A+' : t.score >= 80 ? 'A' : 'B'}
                        </span>
                      </div>
                      <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Academic Record</span>
                        <span>Marks: {t.score}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DYNAMIC "DAY-OF" CLASS TIMELINE & COUNTDOWN */}
            <div className="prof-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--primary-text)' }} /> Today's Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative', paddingLeft: '1rem', borderLeft: todayTimeline.length > 0 ? '2px dashed var(--border-color)' : 'none' }}>
                {todayTimeline.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                    No classes scheduled for today.
                  </div>
                ) : (
                  todayTimeline.map((item, idx) => {
                    const timeStatus = getTimelineStatus(item.start, item.end) || { label: item.start, status: 'FUTURE' };
                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Timeline Dot */}
                        <div style={{
                          position: 'absolute', left: '-1.45rem', top: '0.2rem', width: '12px', height: '12px', borderRadius: '50%',
                          background: timeStatus.status === 'LIVE' ? '#10b981' : timeStatus.status === 'SOON' ? '#f59e0b' : 'var(--text-muted)',
                          boxShadow: timeStatus.status === 'LIVE' ? '0 0 8px #10b981' : 'none',
                          border: '2px solid var(--bg-card)'
                        }} />
                        <div className="flex-between">
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.title}</span>
                          <span className={`badge`} style={{
                            fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '12px',
                            background: timeStatus.status === 'LIVE' ? 'rgba(16,185,129,0.1)' : timeStatus.status === 'SOON' ? 'rgba(245,158,11,0.1)' : 'var(--secondary)',
                            color: timeStatus.status === 'LIVE' ? '#10b981' : timeStatus.status === 'SOON' ? '#f59e0b' : 'var(--text-muted)',
                            fontWeight: 700, border: timeStatus.status === 'SOON' ? '1px solid rgba(245,158,11,0.2)' : 'none'
                          }}>
                            {timeStatus.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Instructor: {item.instructor} | {item.start} - {item.end}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ASYNC DOUBT CLEARANCE TICKET DESK */}
            <div className="prof-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={18} style={{ color: 'var(--primary-text)' }} /> Academic Doubt Desk
              </h3>
              <form onSubmit={handleDoubtSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Topic / Subject (e.g. Algebra)"
                  value={doubtSubject}
                  onChange={e => setDoubtSubject(e.target.value)}
                  required
                  className="prof-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
                />
                <textarea
                  placeholder="Describe your academic question in detail..."
                  value={doubtDesc}
                  onChange={e => setDoubtDesc(e.target.value)}
                  required
                  className="prof-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem', height: '60px', resize: 'none' }}
                />
                <button type="submit" className="prof-btn" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>Submit Doubt Ticket</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '250px', overflowY: 'auto' }}>
                {myDoubtTickets.map(ticket => (
                  <div key={ticket.id} style={{ padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{ticket.subject}</span>
                      <span className={`badge badge-${ticket.status === 'Resolved' ? 'success' : 'secondary'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                        {ticket.status === 'Resolved' ? 'Resolved' : 'Pending Review'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ticket.description}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{ticket.timestamp}</span>
                    
                    {ticket.reply && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-card)', borderLeft: '3px solid #10b981', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <strong style={{ color: '#10b981', display: 'block', fontSize: '0.75rem', marginBottom: '0.15rem' }}>Teacher's Reply:</strong>
                        <span style={{ color: 'var(--text-main)' }}>{ticket.reply}</span>
                      </div>
                    )}
                  </div>
                ))}
                {myDoubtTickets.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>No academic doubt tickets submitted.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
      <FeeReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => { setIsReceiptModalOpen(false); setSelectedReceiptFee(null); }} 
        fee={selectedReceiptFee} 
        student={loggedInUser} 
        className={loggedInUser.class} 
      />
    </>
  );
};

export default StudentDashboard;
