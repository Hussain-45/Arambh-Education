process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
});

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

require('dotenv').config();

// --- Twilio SMS Setup ---
const twilio = require('twilio');
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (twilioSid && twilioSid !== 'your_account_sid_here' && twilioAuthToken && twilioAuthToken !== 'your_auth_token_here') {
  try {
    twilioClient = twilio(twilioSid, twilioAuthToken);
    console.log('[SMS] Twilio client initialized successfully.');
  } catch (e) {
    console.error('[SMS] Failed to initialize Twilio client:', e);
  }
}
// ------------------------

// --- AUDIT LOG HELPER ---
const logAction = (action, details) => {
  db.run(`INSERT INTO audit_logs (action, details) VALUES (?, ?)`, [action, details], (err) => {
    if (err) console.error('[Audit Log Error]', err.message);
  });
};
// ------------------------

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.SECRET_KEY || 'aarambh_super_secret_key_123';

// --- WhatsApp Robot Setup ---
let waClient;
let waQrDataUrl = null;
let waStatus = 'INITIALIZING';

try {
  console.log('Initializing WhatsApp Robot...');
  const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const hasLocalChrome = fs.existsSync(defaultChromePath);

  const puppeteerOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  if (hasLocalChrome) {
    puppeteerOpts.executablePath = defaultChromePath;
    console.log('[WhatsApp] Using Google Chrome installation:', defaultChromePath);
  } else {
    console.log('[WhatsApp] Google Chrome not found at default path, falling back to default browser engine');
  }

  waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOpts
  });

  waClient.on('qr', async (qr) => {
    waStatus = 'AWAITING_SCAN';
    waQrDataUrl = await qrcode.toDataURL(qr);
    console.log('[WhatsApp] QR Code generated. Waiting for scan...');
  });

  waClient.on('ready', () => {
    waStatus = 'CONNECTED';
    waQrDataUrl = null;
    console.log('[WhatsApp] Client is completely READY and connected!');
  });

  waClient.on('disconnected', (reason) => {
    waStatus = 'DISCONNECTED';
    waQrDataUrl = null;
    console.log('[WhatsApp] Client disconnected:', reason);
  });

  waClient.initialize().catch(err => {
    console.error('[WhatsApp] Client initialization failed asynchronously (probably offline):', err.message);
    waStatus = 'ERROR';
  });
} catch (error) {
  console.error('[WhatsApp] Failed to init:', error);
  waStatus = 'ERROR';
}
// -----------------------------

// SMTP configuration
let transporter;

const initializeTransporter = (user, pass) => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user || 'aarambhinstitute46@gmail.com',
      pass: pass || 'Neerajsir'
    }
  });
  console.log(`Gmail SMTP transport system initialized for: ${user || 'aarambhinstitute46@gmail.com'}`);
};

// Load SMTP settings from DB on boot
db.serialize(() => {
  db.get(`SELECT value FROM system_settings WHERE key = 'email_user'`, (err, userRow) => {
    db.get(`SELECT value FROM system_settings WHERE key = 'email_pass'`, (err, passRow) => {
      const user = userRow ? userRow.value : 'aarambhinstitute46@gmail.com';
      const pass = passRow ? passRow.value : 'Neerajsir';
      initializeTransporter(user, pass);
    });
  });
});

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Serve the uploads directory statically
app.use('/uploads', express.static(uploadsDir));

// Middleware for auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Seed Classes 5th to 12th
const seedClasses = () => {
  const defaultClasses = [
    { name: '5th Grade - Batch A', grade: '5th Grade', time: '04:00 PM - 05:00 PM' },
    { name: '6th Grade - Batch A', grade: '6th Grade', time: '04:00 PM - 05:00 PM' },
    { name: '7th Grade - Batch A', grade: '7th Grade', time: '05:00 PM - 06:00 PM' },
    { name: '8th Grade - Batch A', grade: '8th Grade', time: '05:00 PM - 06:00 PM' },
    { name: '9th Grade - Batch A', grade: '9th Grade', time: '06:00 PM - 07:30 PM' },
    { name: '10th Grade - Batch A', grade: '10th Grade', time: '06:00 PM - 07:30 PM' },
    { name: '11th Grade - Batch A', grade: '11th Grade', time: '04:00 PM - 06:00 PM' },
    { name: '12th Grade - Batch A', grade: '12th Grade', time: '04:00 PM - 06:00 PM' }
  ];

  db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM classes', (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO classes (name, grade, time) VALUES (?, ?, ?)');
        defaultClasses.forEach(c => stmt.run(c.name, c.grade, c.time));
        stmt.finalize();
        console.log('Seeded Classes 5 to 12');
      }
    });
  });
};
seedClasses();

// --- AUTH ROUTES ---

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password, phone, role } = req.body;
  
  if (role === 'admin') {
    db.get(`SELECT * FROM users WHERE username = ? AND role = 'admin'`, [username], async (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Invalid admin credentials' });
      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(401).json({ error: 'Invalid admin credentials' });
      const token = jwt.sign({ id: row.id, role: row.role, name: row.name }, JWT_SECRET);
      res.json({ token, user: { id: row.id, role: row.role, name: row.name } });
    });
  } else if (role === 'teacher') {
    db.get(`SELECT * FROM users WHERE username = ? AND role = 'teacher'`, [username], async (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Invalid teacher credentials' });
      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(401).json({ error: 'Invalid teacher credentials' });
      
      // Get assigned classes
      db.all(`SELECT class_name FROM teacher_classes WHERE teacher_id = ?`, [row.id], (err, classes) => {
        row.assignedClasses = classes ? classes.map(c => c.class_name) : [];
        const token = jwt.sign({ id: row.id, role: row.role, name: row.name }, JWT_SECRET);
        res.json({ token, user: { id: row.id, role: row.role, name: row.name, assignedClasses: row.assignedClasses } });
      });
    });
  } else if (role === 'student') {
    db.get(`SELECT * FROM users WHERE name = ? AND parentPhone = ? AND role = 'student'`, [username, phone], async (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Invalid student credentials' });
      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(401).json({ error: 'Invalid student credentials' });
      const token = jwt.sign({ id: row.id, role: row.role, name: row.name, class: row.className, admission_number: row.admission_number }, JWT_SECRET);
      // Map className to class for frontend compatibility
      row.class = row.className;
      res.json({ token, user: { id: row.id, role: row.role, name: row.name, class: row.class, admission_number: row.admission_number } });
    });
  }
});

// Seed Initial Admin if empty
app.post('/api/auth/register-admin', async (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
    if (row) return res.status(400).json({ error: 'Admin already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`, 
      ['Administrator', username, hashedPassword, 'admin'], 
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const token = jwt.sign({ id: this.lastID, role: 'admin', name: 'Administrator' }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, name: 'Administrator', role: 'admin' } });
    });
  });
});

// Request Registration (Teacher & Student)
app.post('/api/auth/request-register', async (req, res) => {
  const { role, name, username, password, phone, className, admissionNumber, fees, fatherName, email, birthdate } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const formattedName = name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : name;
  const formattedFatherName = fatherName ? fatherName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;

  db.run(`INSERT INTO registration_requests (role, name, username, password, parentPhone, className, admission_number, fees, status, fatherName, email, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`, 
    [role, formattedName, username, hashedPassword, phone, className, admissionNumber || null, fees || 0, formattedFatherName, email || null, birthdate || null], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Alert Admin via Email
      db.get(`SELECT email FROM users WHERE role = 'admin'`, [], (err, admin) => {
        if (!err && admin && admin.email && transporter) {
          transporter.sendMail({
            from: '"Aarambh Alerts" <alerts@aarambh.edu>',
            to: admin.email,
            subject: `🔔 New Registration Request: ${formattedName}`,
            text: `Hello Admin,\n\nA new registration request has been submitted by ${formattedName} for the role of ${role.toUpperCase()}.\n\nPlease log into your dashboard to approve or reject this request.`
          }).catch(e => console.error('[Alert Email Error]', e.message));
        }
      });

      res.json({ success: true, message: 'Registration requested successfully! Waiting for Admin approval.' });
  });
});

// --- ADMIN REGISTRATION REQUEST ROUTES ---

app.get('/api/admin/requests', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all(`SELECT * FROM registration_requests WHERE status = 'pending'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/requests/:id/approve', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const reqId = parseInt(req.params.id);
  
  db.get(`SELECT * FROM registration_requests WHERE id = ?`, [reqId], (err, request) => {
    if (err || !request) return res.status(404).json({ error: 'Request not found' });
    
    // Insert into users
    let finalAdmissionNumber = request.admission_number;
    if (!finalAdmissionNumber) {
      db.get(`SELECT MAX(CAST(SUBSTR(admission_number, 4) AS INTEGER)) as max_num FROM users WHERE role = ?`, [request.role], (err, row) => {
        const nextNum = (row && row.max_num ? row.max_num : 0) + 1;
        finalAdmissionNumber = request.role === 'student' ? `AES${nextNum}` : request.role === 'teacher' ? `AET${nextNum}` : `ADM${nextNum}`;
        insertUser(finalAdmissionNumber);
      });
    } else {
      insertUser(finalAdmissionNumber);
    }

    function insertUser(admNum) {
      db.run(`INSERT INTO users (name, username, password, role, parentPhone, className, admission_number, fatherName, email, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [request.name || request.username, request.username, request.password, request.role, request.parentPhone, request.className, admNum, request.fatherName, request.email, request.birthdate], 
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const newUserId = this.lastID;
          
          // If student, create fee records for all 12 months (Jan to Dec)
          if (request.role === 'student') {
            const monthsList = [
              'January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const yearlyTotal = request.fees || 12000;
            const monthlyFee = Math.round(yearlyTotal / 12);
            monthsList.forEach((m, idx) => {
              const monthNum = String(idx + 1).padStart(2, '0');
              const dueDate = `2024-${monthNum}-10`; // e.g. 10th of each month
              db.run(`INSERT INTO fees (student_id, total, paid, status, due_date, month) VALUES (?, ?, 0, 'Pending', ?, ?)`, 
                [newUserId, monthlyFee, dueDate, m]);
            });
          }
          
          // Mark request as approved (or delete it)
          db.run(`DELETE FROM registration_requests WHERE id = ?`, [reqId]);
          
          logAction('REQUEST_APPROVED', `Admin approved registration for ${request.name || request.username} (${request.role})`);
          
          if (request.parentPhone) {
            sendAutoSms(request.parentPhone, `Your registration at Aarambh has been approved! Username: ${request.username}, Password: pass`);
          }
          
          res.json({ success: true, admission_number: admNum });
      });
    }
  });
});

app.delete('/api/admin/requests/:id/reject', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const reqId = parseInt(req.params.id);
  db.run(`DELETE FROM registration_requests WHERE id = ?`, [reqId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    logAction('REQUEST_REJECTED', `Admin rejected registration request ID ${reqId}`);
    res.json({ success: true });
  });
});

// --- CORE API ROUTES ---

// Get all classes (Public for registration)
app.get('/api/classes', (req, res) => {
  db.all(`SELECT * FROM classes`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a class (Admin only)
app.post('/api/classes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, grade, time } = req.body;
  db.run(`INSERT INTO classes (name, grade, time) VALUES (?, ?, ?)`, [name, grade, time], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('CLASS_ADDED', `Admin created new batch: ${name}`);
    res.json({ id: this.lastID, name, grade, time });
  });
});

// Delete a class (Admin only)
app.delete('/api/classes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const classId = parseInt(req.params.id);
  db.get(`SELECT name FROM classes WHERE id = ?`, [classId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Class not found' });
    db.run(`DELETE FROM classes WHERE id = ?`, [classId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Remove students from this class
      db.run(`DELETE FROM users WHERE className = ? AND role = 'student'`, [row.name]);
      logAction('CLASS_DELETED', `Admin deleted batch: ${row.name}`);
      res.json({ success: true });
    });
  });
});

// Get all students
app.get('/api/students', authenticateToken, (req, res) => {
  db.all(`SELECT id, name, parentPhone, className as class, password, fatherName, admission_number FROM users WHERE role = 'student'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a student (Admin only)
app.post('/api/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, className, parentPhone, fatherName, email, birthdate } = req.body;
  const hashedPassword = await bcrypt.hash('pass', 10); // default password
  const formattedName = name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : name;
  const formattedFatherName = fatherName ? fatherName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;

  // Generate unique AES admission number
  db.get(`SELECT MAX(CAST(SUBSTR(admission_number, 4) AS INTEGER)) as max_num FROM users WHERE role = 'student'`, [], (err, row) => {
    const nextNum = (row && row.max_num ? row.max_num : 0) + 1;
    const admissionNumber = `AES${nextNum}`;
    
    db.run(`INSERT INTO users (name, role, className, parentPhone, password, admission_number, fatherName, email, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [formattedName, 'student', className, parentPhone, hashedPassword, admissionNumber, formattedFatherName, email || null, birthdate || null], 
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const newUserId = this.lastID;
        // Create initial fee records for student (Jan to Dec)
        const monthsList = [
          'January', 'February', 'March', 'April', 'May', 'June', 
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthlyFee = 1000; // standard default monthly fee
        monthsList.forEach((m, idx) => {
          const monthNum = String(idx + 1).padStart(2, '0');
          const dueDate = `2024-${monthNum}-10`;
          db.run(`INSERT INTO fees (student_id, total, paid, status, due_date, month) VALUES (?, ?, 0, 'Pending', ?, ?)`, 
            [newUserId, monthlyFee, dueDate, m]);
        });
        
        logAction('STUDENT_ADDED', `Admin added new student: ${formattedName} to class ${className}`);
        
        res.json({ id: newUserId, name: formattedName, class: className, parentPhone, admission_number: admissionNumber, fatherName: formattedFatherName, email });
    });
  });
});

// Delete a student (Admin only)
app.delete('/api/students/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const studentId = req.params.id;
  
  db.run(`DELETE FROM fees WHERE student_id = ?`, [studentId], (err) => {
    db.run(`DELETE FROM attendance WHERE student_id = ?`, [studentId], (err) => {
      db.run(`DELETE FROM users WHERE id = ? AND role = 'student'`, [studentId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
        
        logAction('STUDENT_DELETED', `Admin removed student ID: ${studentId}`);
        res.json({ success: true });
      });
    });
  });
});

// Mark or update daily attendance
app.post('/api/attendance', authenticateToken, (req, res) => {
  const { studentId, date, status } = req.body;
  if (!studentId || !date || !status) {
    return res.status(400).json({ error: 'studentId, date, and status are required' });
  }

  // Check if attendance already exists for this date
  db.get(`SELECT id FROM attendance WHERE student_id = ? AND date = ?`, [studentId, date], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      db.run(`UPDATE attendance SET status = ? WHERE id = ?`, [status, row.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, updated: true });
      });
    } else {
      db.run(`INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)`, [studentId, date, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, inserted: true });
      });
    }
  });
});

// Get attendance logs for a student
app.get('/api/attendance/:studentId', authenticateToken, (req, res) => {
  const studentId = req.params.studentId;
  db.all(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Send monthly attendance progress card email
app.post('/api/admin/attendance-report', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  if (!transporter) return res.status(500).json({ error: 'Email service not ready' });

  db.get(`SELECT value FROM system_settings WHERE key = 'email_attendance_alerts'`, (err, settingRow) => {
    const emailAttendanceEnabled = settingRow ? settingRow.value === 'true' : true;
    if (!emailAttendanceEnabled) {
      return res.status(400).json({ error: 'Monthly attendance progress reports are disabled in settings' });
    }

    // Get previous month string in YYYY-MM format
    const now = new Date();
    let prevMonth = now.getMonth(); // 0-indexed, so current month index is actually previous month number!
    let year = now.getFullYear();
    if (prevMonth === 0) {
      prevMonth = 12;
      year -= 1;
    }
    const monthString = `${year}-${prevMonth.toString().padStart(2, '0')}`;
    const monthName = new Date(year, prevMonth - 1).toLocaleString('default', { month: 'long' });

  // Query all active students
  db.all(`SELECT id, name, email, className FROM users WHERE role = 'student'`, [], async (err, studentsList) => {
    if (err) return res.status(500).json({ error: err.message });

    let sentCount = 0;
    let failedCount = 0;

    for (const student of studentsList) {
      if (!student.email) continue;

      try {
        // Calculate attendance stats for the student in previous month
        const stats = await new Promise((resolve, reject) => {
          db.all(
            `SELECT status, COUNT(*) as count FROM attendance WHERE student_id = ? AND date LIKE ? GROUP BY status`,
            [student.id, `${monthString}%`],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });

        let present = 0;
        let absent = 0;
        let late = 0;

        stats.forEach(s => {
          if (s.status === 'Present') present = s.count;
          else if (s.status === 'Absent') absent = s.count;
          else if (s.status === 'Late') late = s.count;
        });

        const total = present + absent + late;
        if (total === 0) continue; // skip if no classes attended

        const rate = (((present + late * 0.5) / total) * 100).toFixed(1);

        const emailInfo = await transporter.sendMail({
          from: '"Aarambh System" <admin@aarambh.edu>',
          to: student.email,
          subject: `📊 MONTHLY ATTENDANCE REPORT: ${student.name} - ${monthName} ${year}`,
          html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; background: #ffffff;">
                   <div style="text-align: center; border-bottom: 2px solid var(--primary, #4A90E2); padding-bottom: 15px; margin-bottom: 20px;">
                     <h2 style="color: #4A90E2; margin: 0; font-size: 22px;">Aarambh Tuition Center</h2>
                     <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Official Attendance Progress Card</p>
                   </div>
                   
                   <p style="font-size: 15px; color: #333;">Dear Parent,</p>
                   <p style="font-size: 15px; color: #333; line-height: 1.6;">
                     Please review the monthly attendance performance report for <strong>${student.name}</strong> (Class: ${student.className || 'General'}) for the period of <strong>${monthName} ${year}</strong>:
                   </p>
                   
                   <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4A90E2;">
                     <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                       <tr>
                         <td style="padding: 6px 0; color: #555;">Total Class Sessions:</td>
                         <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #333;">${total}</td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #2e7d32;">Present Days:</td>
                         <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #2e7d32;">${present}</td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #f57c00;">Late Days:</td>
                         <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #f57c00;">${late}</td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #c62828;">Absent Days:</td>
                         <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #c62828;">${absent}</td>
                       </tr>
                       <tr style="border-top: 1px solid #ddd;">
                         <td style="padding: 10px 0 0 0; font-weight: bold; color: #333;">Monthly Attendance Rate:</td>
                         <td style="padding: 10px 0 0 0; font-weight: bold; text-align: right; color: ${rate >= 85 ? '#2e7d32' : '#c62828'}; font-size: 16px;">${rate}%</td>
                       </tr>
                     </table>
                   </div>
                   
                   <p style="font-size: 14px; color: #333; line-height: 1.5;">
                     ${rate >= 85 
                       ? "🎉 Excellent consistency! Regular attendance is crucial for academic success. Keep up the great effort!"
                       : "⚠️ Attendance is below our recommended 85% threshold. Please ensure regular attendance to avoid falling behind in batches."}
                   </p>
                   
                   <p style="margin-top: 25px;">Thank you,<br/>Aarambh Management</p>
                   <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                   <small style="color: #999; font-size: 11px; display: block; text-align: center;">This is an automated administrative notification. Please do not reply directly to this email.</small>
                 </div>`
        });
        
        const testUrl = nodemailer.getTestMessageUrl(emailInfo);
        console.log(`[MONTHLY ATTENDANCE EMAIL SENT] to ${student.email}.${testUrl ? ` Preview: ${testUrl}` : ''}`);
        sentCount++;
      } catch (e) {
        console.error(`[Monthly Attendance Email Error] for ${student.name}:`, e);
        failedCount++;
      }
    }

    logAction('ATTENDANCE_REPORTS_SENT', `Triggered monthly attendance progress cards. Sent: ${sentCount}, Failed: ${failedCount}`);
    res.json({ success: true, sentCount, failedCount });
    });
  });
});

// Get all teachers
app.get('/api/teachers', authenticateToken, (req, res) => {
  db.all(`SELECT id, name, username, password FROM users WHERE role = 'teacher'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Get assigned classes for each
    const promises = rows.map(teacher => {
      return new Promise((resolve, reject) => {
        db.all(`SELECT class_name FROM teacher_classes WHERE teacher_id = ?`, [teacher.id], (err, classes) => {
          if (err) reject(err);
          teacher.assignedClasses = classes.map(c => c.class_name);
          resolve(teacher);
        });
      });
    });

    Promise.all(promises).then(teachers => res.json(teachers)).catch(err => res.status(500).json({ error: err }));
  });
});

// Get fees
app.get('/api/fees', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM fees`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // mapping db snake_case to frontend camelCase
    const mapped = rows.map(r => ({
      id: r.id, studentId: r.student_id, total: r.total, paid: r.paid, status: r.status, dueDate: r.due_date,
      paymentMode: r.payment_mode, paymentDate: r.payment_date, month: r.month
    }));
    res.json(mapped);
  });
});

// --- Cellular SMS Dispatcher (Twilio & TextBelt) ---
const sendRealSms = async (phone, message) => {
  let targetPhone = phone.replace(/\D/g, '');
  if (targetPhone.length === 10) {
    targetPhone = `+91${targetPhone}`; // default to India prefix
  } else if (!targetPhone.startsWith('+')) {
    targetPhone = `+${targetPhone}`;
  }

  // 1. Try Twilio if configured
  if (twilioClient && twilioPhone && twilioPhone !== 'your_twilio_phone_number_here') {
    try {
      const response = await twilioClient.messages.create({
        body: message,
        from: twilioPhone,
        to: targetPhone
      });
      console.log(`[Twilio SMS Sent] SID: ${response.sid} to ${targetPhone}`);
      return { success: true, provider: 'Twilio', sid: response.sid };
    } catch (e) {
      console.error('[Twilio SMS Error]', e.message);
      // fallback to TextBelt if Twilio fails
    }
  }

  // 2. Try TextBelt (Free or Paid)
  try {
    console.log(`[SMS Fallback] Attempting TextBelt delivery to ${targetPhone}...`);
    const key = process.env.TEXTBELT_API_KEY || 'textbelt';
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
        message: message,
        key: key
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log(`[TextBelt SMS Sent] to ${targetPhone}. Quota remaining: ${data.quotaRemaining}`);
      return { success: true, provider: 'TextBelt', quotaRemaining: data.quotaRemaining };
    } else {
      console.error('[TextBelt SMS Error]', data.error);
      return { success: false, error: data.error };
    }
  } catch (e) {
    console.error('[SMS Service Error]', e.message);
    return { success: false, error: e.message };
  }
};

// --- Auto SMS Helper ---
const sendAutoSms = async (phone, message) => {
  if (!phone) return;
  console.log(`[Auto-SMS] Dispatching to ${phone} via WhatsApp...`);
  
  let sentViaWa = false;
  if (waStatus === 'CONNECTED' && waClient) {
    try {
      let rawPhone = phone.replace(/\D/g, '');
      if (rawPhone.length === 10) rawPhone = `91${rawPhone}`;
      const chatId = `${rawPhone}@c.us`;
      await waClient.sendMessage(chatId, message);
      console.log(`[Auto-SMS] Sent via WhatsApp to ${chatId}`);
      sentViaWa = true;
    } catch (e) {
      console.error('[Auto-SMS] WhatsApp transmission failed:', e.message);
    }
  }

  // If WhatsApp isn't connected or failed, fallback to simulated email log
  if (!sentViaWa) {
    console.log(`[Auto-SMS Fallback] WhatsApp offline. Simulating via Ethereal Email...`);
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: '"Aarambh System" <admin@aarambh.edu>',
          to: 'parent@aarambh.edu',
          subject: `Auto-WhatsApp Fallback to ${phone}`,
          text: message
        });
        console.log(`[Auto-SMS Simulated] Link: ${nodemailer.getTestMessageUrl(info)}`);
      } catch (err) {
        console.error('[Auto-SMS Fallback Error]', err);
      }
    } else {
      console.log(`[Auto-SMS Simulated] Message: "${message}" to ${phone}`);
    }
  }
};
// -----------------------

app.put('/api/fees/:id/pay', authenticateToken, (req, res) => {
  const studentId = parseInt(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== studentId) return res.sendStatus(403);
  const { amount, paymentMode, paymentDate, month } = req.body;
  
  const query = month 
    ? `SELECT fees.*, users.name, users.parentPhone, users.email, users.className FROM fees JOIN users ON fees.student_id = users.id WHERE fees.student_id = ? AND fees.month = ?`
    : `SELECT fees.*, users.name, users.parentPhone, users.email, users.className FROM fees JOIN users ON fees.student_id = users.id WHERE fees.student_id = ?`;
  const params = month ? [studentId, month] : [studentId];
  
  db.get(query, params, (err, fee) => {
    if (err || !fee) return res.status(404).json({ error: 'Fee record not found' });
    
    const newPaid = fee.paid + amount;
    const newStatus = newPaid >= fee.total ? 'Paid' : 'Pending';
    
    const updateQuery = month
      ? `UPDATE fees SET paid = ?, status = ?, payment_mode = ?, payment_date = ? WHERE student_id = ? AND month = ?`
      : `UPDATE fees SET paid = ?, status = ?, payment_mode = ?, payment_date = ? WHERE student_id = ?`;
    const updateParams = month
      ? [newPaid, newStatus, paymentMode || 'Cash', paymentDate || new Date().toLocaleDateString(), studentId, month]
      : [newPaid, newStatus, paymentMode || 'Cash', paymentDate || new Date().toLocaleDateString(), studentId];

    db.run(updateQuery, updateParams, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      logAction('FEE_PAID', `Recorded fee payment of Rs. ${amount} for student ID ${studentId}${month ? ` (${month})` : ''}. Mode: ${paymentMode || 'Cash'}, Status: ${newStatus}`);
      
      if (fee.parentPhone) {
        sendAutoSms(fee.parentPhone, `Dear Parent, we have received a payment of Rs. ${amount} for ${fee.name} for the month of ${month || 'Current'}. Thank you! - Aarambh`);
      }

      if (fee.email && transporter) {
        const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
        transporter.sendMail({
          from: '"Aarambh Invoice Service" <billing@aarambh.edu>',
          to: fee.email,
          subject: `🧾 PAYMENT RECEIPT: ${fee.name} - ${month || 'Current'} Month`,
          text: `Dear Parent,\n\nWe have successfully received a tuition fee payment of Rs. ${amount} for ${fee.name} for the month of ${month || 'Current'}.\n\nReceipt Details:\n- Receipt No: ${receiptNo}\n- Amount: Rs. ${amount}\n- Payment Mode: ${paymentMode || 'Cash'}\n- Payment Date: ${paymentDate || new Date().toLocaleDateString()}\n\nThank you for choosing Aarambh!\n\nBest regards,\nAarambh Accounts`,
          html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #eaeaea; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #fafafa;">
                   <div style="text-align: center; border-bottom: 2px solid #4A90E2; padding-bottom: 15px; margin-bottom: 20px;">
                     <h2 style="color: #4A90E2; margin: 0; font-size: 24px;">Aarambh Tuition Centre</h2>
                     <small style="color: #666; text-transform: uppercase; letter-spacing: 1px;">Official Payment Receipt</small>
                   </div>
                   
                   <p>Dear Parent,</p>
                   <p>Thank you for your payment. We have successfully processed the tuition fee for the student.</p>
                   
                   <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px dashed #ddd; margin: 20px 0;">
                     <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                       <tr>
                         <td style="padding: 6px 0; color: #666;"><strong>Receipt No:</strong></td>
                         <td style="padding: 6px 0; text-align: right;">${receiptNo}</td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #666;"><strong>Student Name:</strong></td>
                         <td style="padding: 6px 0; text-align: right;"><strong>${fee.name}</strong></td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #666;"><strong>Class/Batch:</strong></td>
                         <td style="padding: 6px 0; text-align: right;">${fee.className || 'General'}</td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #666;"><strong>For Month:</strong></td>
                         <td style="padding: 6px 0; text-align: right;">${month || 'Current'}</td>
                       </tr>
                       <tr style="border-top: 1px solid #eee; margin-top: 10px;">
                         <td style="padding: 10px 0; color: #666; font-size: 16px;"><strong>Amount Paid:</strong></td>
                         <td style="padding: 10px 0; text-align: right; font-size: 18px; color: #2ecc71;"><strong>Rs. ${amount}</strong></td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #666;"><strong>Payment Mode:</strong></td>
                         <td style="padding: 6px 0; text-align: right;">${paymentMode || 'Cash'}</td>
                       </tr>
                       <tr>
                         <td style="padding: 6px 0; color: #666;"><strong>Payment Date:</strong></td>
                         <td style="padding: 6px 0; text-align: right;">${paymentDate || new Date().toLocaleDateString()}</td>
                       </tr>
                     </table>
                   </div>
                   
                   <p style="text-align: center; color: #777; font-size: 13px; margin-top: 25px;">
                     If you have any billing queries, please contact the administration directly.
                   </p>
                   <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                   <small style="color: #999; display: block; text-align: center;">This is a system generated billing statement. Please do not reply directly to this mail.</small>
                 </div>`
        }).catch(err => console.error('[Fee Invoice Email Error]', err.message));
      }
      
      res.json({ success: true, paid: newPaid, status: newStatus, paymentMode, paymentDate });
    });
  });
});

// Send automatic fee reminders to all students with pending fees
app.post('/api/fees/remind-pending', async (req, res) => {
  db.get(`SELECT value FROM system_settings WHERE key = 'email_fee_alerts'`, (err, settingRow) => {
    const emailFeeAlertsEnabled = settingRow ? settingRow.value === 'true' : true;

    db.all(`SELECT fees.*, users.name, users.parentPhone, users.email FROM fees JOIN users ON fees.student_id = users.id WHERE fees.status != 'Paid'`, [], async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let sentCount = 0;
      let failedCount = 0;
      let emailSentCount = 0;
      
      for (const row of rows) {
        const dueAmount = row.total - row.paid;
        const message = `Dear Parent, this is a reminder from Aarambh that the tuition fee of Rs. ${dueAmount} for ${row.name} for the month of ${row.month || 'Current'} is currently pending. Please clear the dues at your earliest convenience. Thank you!`;
        
        // 1. Send via WhatsApp if phone exists
        if (row.parentPhone) {
          if (waStatus === 'CONNECTED' && waClient) {
            try {
              let phone = row.parentPhone.replace(/\D/g, '');
              if (phone.length === 10) phone = `91${phone}`;
              const chatId = `${phone}@c.us`;
              
              await waClient.sendMessage(chatId, message);
              sentCount++;
            } catch (e) {
              console.error(`[WhatsApp Fee Reminder Error] for ${row.name}:`, e);
              failedCount++;
            }
          } else {
            // Simulated send if not connected
            sentCount++;
          }
        }

        // 2. Send via Email if email exists
        if (emailFeeAlertsEnabled && row.email && transporter) {
          try {
            const emailInfo = await transporter.sendMail({
              from: '"Aarambh System" <admin@aarambh.edu>',
              to: row.email,
              subject: `⚠️ FEE DUE REMINDER: Aarambh Tuition - ${row.month || 'Current'} Month`,
              text: message,
              html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                       <h2 style="color: #D0021B; margin-top: 0;">Tuition Fee Due Reminder</h2>
                       <p>Dear Parent,</p>
                       <p style="font-size: 15px; color: #333; line-height: 1.6;">
                         This is a formal reminder that the tuition fee of <strong>Rs. ${dueAmount}</strong> for <strong>${row.name}</strong> for the month of <strong>${row.month || 'Current'}</strong> is currently pending.
                       </p>
                       <p>Please clear the outstanding dues at your earliest convenience.</p>
                       <p>Thank you,<br/>Aarambh Management</p>
                       <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                       <small style="color: #999;">This is an automated administrative reminder. Please do not reply directly to this email.</small>
                     </div>`
            });
            const previewUrl = nodemailer.getTestMessageUrl(emailInfo);
            console.log(`[EMAIL REMINDER SENT] to ${row.email}.${previewUrl ? ` Preview: ${previewUrl}` : ''}`);
            emailSentCount++;
          } catch(e) {
            console.error(`[Email Reminder Error] for ${row.name}:`, e);
          }
        }
      }
      
      logAction('FEE_REMINDERS_SENT', `Triggered bulk reminders. WhatsApp Sent: ${sentCount}, Email Sent: ${emailSentCount}, Failed: ${failedCount}`);
      res.json({ success: true, sentCount, emailSentCount, failedCount, simulated: waStatus !== 'CONNECTED' });
    });
  });
});

// Get SMTP Settings
app.get('/api/admin/smtp-settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get(`SELECT value FROM system_settings WHERE key = 'email_user'`, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ email: row ? row.value : 'aarambhinstitute46@gmail.com' });
  });
});

// Update SMTP Settings
// Update SMTP Settings with verification check
app.post('/api/admin/smtp-settings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Get the password to verify (either new password or existing one from DB)
  let targetPassword = password;
  if (!targetPassword) {
    try {
      const dbPassRow = await new Promise((resolve, reject) => {
        db.get(`SELECT value FROM system_settings WHERE key = 'email_pass'`, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      targetPassword = dbPassRow ? dbPassRow.value : 'Neerajsir';
    } catch(e) {
      targetPassword = 'Neerajsir';
    }
  }

  // Create temporary transporter to test connection
  const testTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: targetPassword
    }
  });

  // Verify connection
  testTransporter.verify((error, success) => {
    if (error) {
      console.error('[SMTP Settings Verification Failed]', error);
      return res.status(400).json({
        success: false,
        verified: false,
        error: `Authentication failed: ${error.message}. Make sure App Passwords are created and 2-Step Verification is active on your Google account.`
      });
    }

    // Verification succeeded! Send a test verification email first
    testTransporter.sendMail({
      from: `"Aarambh Notification Service" <${email}>`,
      to: email,
      subject: '🧪 SMTP Connection Verified - Aarambh System',
      text: `Hello,\n\nThis is a test notification confirming that your Gmail SMTP connection has been successfully established and verified inside the Aarambh Management System.\n\nAll automated emails will now be sent from this account.\n\nBest regards,\nAarambh Team`,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; max-width: 600px; margin: 0 auto;">
               <h2 style="color: #4A90E2; margin-top: 0;">🧪 Connection Verified!</h2>
               <p>Hello,</p>
               <p style="font-size: 15px; color: #333; line-height: 1.6;">
                 This email confirms that your Gmail SMTP credentials are correct and the connection to the Aarambh Notification System has been successfully linked.
               </p>
               <p>You will now receive administrative alerts, fee reminder summaries, and automated student progress cards from this account.</p>
               <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
               <small style="color: #999;">This is an automated system check. Do not reply to this email.</small>
             </div>`
    }, (sendErr, info) => {
      if (sendErr) console.error('[SMTP Settings Test Email Failed]', sendErr);
      
      // Save to DB
      db.serialize(() => {
        db.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('email_user', ?)`, [email]);
        if (password) {
          db.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('email_pass', ?)`, [password]);
        }
        initializeTransporter(email, targetPassword);
        logAction('SMTP_SETTINGS_UPDATED', `Admin updated SMTP email config to ${email} (Verified successfully and sent test email)`);
        res.json({ success: true, verified: true, email });
      });
    });
  });
});

// Get System settings toggles
app.get('/api/admin/system-settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all(`SELECT key, value FROM system_settings`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settingsObj = {};
    rows.forEach(r => {
      settingsObj[r.key] = r.value;
    });
    res.json({
      emailFeeAlerts: settingsObj.email_fee_alerts === 'true',
      emailAttendanceAlerts: settingsObj.email_attendance_alerts === 'true'
    });
  });
});

// Update System settings toggles
app.post('/api/admin/system-settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { emailFeeAlerts, emailAttendanceAlerts } = req.body;
  
  db.serialize(() => {
    db.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('email_fee_alerts', ?)`, [emailFeeAlerts ? 'true' : 'false']);
    db.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('email_attendance_alerts', ?)`, [emailAttendanceAlerts ? 'true' : 'false']);
    
    logAction('SYSTEM_SETTINGS_UPDATED', `Admin updated toggles: fee alerts=${emailFeeAlerts}, attendance reports=${emailAttendanceAlerts}`);
    res.json({ success: true });
  });
});

// --- AUDIT HISTORY ROUTE ---
app.get('/api/admin/history', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- EXPENSES ROUTES (PROFIT & LOSS) ---
app.get('/api/expenses', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all(`SELECT * FROM expenses ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { title, amount, date } = req.body;
  db.run(`INSERT INTO expenses (title, amount, date) VALUES (?, ?, ?)`, [title, amount, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('EXPENSE_ADDED', `Admin added expense: ${title} of Rs. ${amount}`);
    res.json({ id: this.lastID, title, amount, date });
  });
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const expenseId = parseInt(req.params.id);
  db.run(`DELETE FROM expenses WHERE id = ?`, [expenseId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('EXPENSE_DELETED', `Admin deleted expense ID: ${expenseId}`);
    res.json({ success: true });
  });
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const expenseId = parseInt(req.params.id);
  const { title, amount } = req.body;
  if (!title || !amount) return res.status(400).json({ error: 'Title and amount are required' });

  db.run(`UPDATE expenses SET title = ?, amount = ? WHERE id = ?`, [title, amount, expenseId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('EXPENSE_EDITED', `Admin edited expense ID: ${expenseId} (New title: ${title}, amount: ${amount})`);
    res.json({ success: true, id: expenseId, title, amount });
  });
});
// ---------------------------------------

// Get assignments
app.get('/api/assignments', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM assignments`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ id: r.id, title: r.title, subject: r.subject, dueDate: r.due_date, link: r.link, type: r.type })));
  });
});

// Add assignment
app.post('/api/assignments', authenticateToken, upload.single('file'), (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const { title, subject, dueDate, type } = req.body;
  let link = req.body.link || '';
  
  if (req.file) {
    link = `http://localhost:5000/uploads/${req.file.filename}`;
  }

  db.run(`INSERT INTO assignments (title, subject, due_date, link, type) VALUES (?, ?, ?, ?, ?)`, [title, subject, dueDate, link, type], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, subject, dueDate, link, type });
  });
});

// Get library
app.get('/api/library', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM library`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add library material
app.post('/api/library', authenticateToken, upload.single('file'), (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const { title, subject, type } = req.body;
  let link = req.body.link || '';

  if (req.file) {
    link = `http://localhost:5000/uploads/${req.file.filename}`;
  }

  db.run(`INSERT INTO library (title, subject, type, link) VALUES (?, ?, ?, ?)`, [title, subject, type, link], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, subject, type, link });
  });
});

// Check WhatsApp Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: waStatus, qr: waQrDataUrl });
});

// Restart WhatsApp Client (Re-generate QR code)
app.post('/api/whatsapp/restart', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    console.log('[WhatsApp] Re-initializing WhatsApp Web client...');
    waStatus = 'INITIALIZING';
    waQrDataUrl = null;
    
    if (waClient) {
      try {
        await waClient.destroy();
      } catch (err) {
        console.error('Error destroying old client:', err);
      }
    }
    
    waClient = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    waClient.on('qr', async (qr) => {
      waStatus = 'AWAITING_SCAN';
      waQrDataUrl = await qrcode.toDataURL(qr);
      console.log('[WhatsApp] QR Code re-generated.');
    });

    waClient.on('ready', () => {
      waStatus = 'CONNECTED';
      waQrDataUrl = null;
      console.log('[WhatsApp] Connected and ready!');
    });

    waClient.on('disconnected', (reason) => {
      waStatus = 'DISCONNECTED';
      waQrDataUrl = null;
      console.log('[WhatsApp] Client disconnected:', reason);
    });

    waClient.initialize().catch(err => {
      console.error('Init error:', err);
    });
    
    res.json({ success: true, message: 'WhatsApp Web is restarting...' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Send message via SMS (cellular) or Auto-WhatsApp
app.post('/api/sms', async (req, res) => {
  const { to, message, channel } = req.body;
  
  // 1. Try sending via WhatsApp Robot if selected
  if ((channel === 'Auto-WhatsApp' || channel === 'WhatsApp') && waStatus === 'CONNECTED' && waClient) {
    try {
      let phone = to.replace(/\D/g, '');
      if (phone.length === 10) phone = `91${phone}`; // default to India if 10 digits
      const chatId = `${phone}@c.us`;
      
      await waClient.sendMessage(chatId, message);
      console.log(`[REAL WA SENT] Delivered to ${chatId}`);
      
      return res.json({ 
        success: true, 
        simulated: false, 
        message: 'Delivered via Auto-WhatsApp',
        previewUrl: null
      });
    } catch (e) {
      console.error('[WhatsApp Error]', e);
      return res.status(500).json({ success: false, error: 'Failed to send via WhatsApp' });
    }
  }

  // 2. Try sending via Cellular SMS if selected
  if (channel === 'SMS') {
    const result = await sendRealSms(to, message);
    if (result.success) {
      return res.json({
        success: true,
        simulated: false,
        message: `Message sent successfully via ${result.provider}`,
        previewUrl: null
      });
    }
  }

  // 3. Email Channel or Fallback to Ethereal Email Simulation
  if (channel === 'Email' || !transporter) {
    if (!transporter) {
      return res.status(500).json({ success: false, error: 'Email system not ready yet.' });
    }

    try {
      const emailRecipient = to.includes('@') ? to : `${to}@example.com`;
      const info = await transporter.sendMail({
        from: '"Aarambh System" <admin@aarambh.edu>',
        to: emailRecipient,
        subject: "New Message from Aarambh",
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                 <h2 style="color: #4A90E2; margin-top: 0;">Aarambh Notification Alert</h2>
                 <p style="font-size: 16px; color: #333; line-height: 1.6;">${message}</p>
                 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                 <small style="color: #999;">This is an automated email from Aarambh tuition center.</small>
               </div>`
      });
      
      const url = nodemailer.getTestMessageUrl(info);
      console.log(`[EMAIL SENT] Delivered to ${emailRecipient}. Preview URL: ${url}`);
      
      return res.json({ 
        success: true, 
        simulated: true, 
        message: 'Delivered via Email Notification',
        previewUrl: url 
      });
    } catch (error) {
      console.error('[EMAIL ERROR]', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Analytics
app.get('/api/analytics', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  db.serialize(() => {
    let totalStudents = 0, activeClasses = 0, totalRevenue = 0, pendingFees = 0;
    
    db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`, (err, row) => totalStudents = row ? row.count : 0);
    db.get(`SELECT COUNT(*) as count FROM classes`, (err, row) => activeClasses = row ? row.count : 0);
    db.get(`SELECT SUM(paid) as sum FROM fees`, (err, row) => totalRevenue = row && row.sum ? row.sum : 0);
    db.get(`SELECT SUM(total - paid) as sum FROM fees WHERE status != 'Paid'`, (err, row) => {
      pendingFees = row && row.sum ? row.sum : 0;
      res.json({ totalStudents, activeClasses, totalRevenue, pendingFees });
    });
  });
});

// AI Chatbot Endpoint (Google Gemini)
app.post('/api/chat', async (req, res) => {
  const { messages, userContext } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || '';

  // Prevent ANY financial/fee/profit-loss questions in chatbot
  const financialKeywords = ['fee', 'pending', 'due', 'pay', 'rupee', 'money', 'profit', 'loss', 'expense', 'cost', 'price', 'salary', 'financial', 'revenue', 'budget'];
  if (financialKeywords.some(keyword => lastUserMessage.includes(keyword))) {
    return res.json({
      success: true,
      text: "Sorry, I cannot answer questions about financial details, fees, or profit & loss metrics."
    });
  }

  // 1. Offline Mode with student-specific context intelligence (non-financial only)
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    let responseText = "I am currently running in Offline FAQ Mode. To unlock my full Artificial Intelligence, please add your Google Gemini API Key in the server settings!";
    
    if (userContext) {
      if (lastUserMessage.includes('batch') || lastUserMessage.includes('class') || lastUserMessage.includes('schedule') || lastUserMessage.includes('subject')) {
        responseText = `Hi ${userContext.name}, you are currently registered in the batch: **${userContext.class}**.\n\nYour class lectures, schedule, and study materials are mapped directly to this batch.`;
      } else if (lastUserMessage.includes('father') || lastUserMessage.includes('parent') || lastUserMessage.includes('dad') || lastUserMessage.includes('family')) {
        responseText = `According to your registration records, your father's name is registered as: **${userContext.fatherName || 'Not Set'}**. If this needs correction, please contact the administrator.`;
      } else if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi') || lastUserMessage.includes('hey')) {
        responseText = `Hello ${userContext.name}! I am your Aarambh Assistant. I know you are in batch **${userContext.class}**. How can I help you today?`;
      }
    }
    
    return res.json({ 
      success: true, 
      text: responseText 
    });
  }

  // 2. Online Mode using Google Gemini API
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Convert generic chat messages to Gemini's expected format
    const contents = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Inject system instructions + active user details
    let systemPromptText = `You are Aarambh AI, a highly intelligent and friendly assistant for a tuition management system. You help students, parents, teachers, and admins with queries. Be concise, polite, and use formatting like bolding or bullet points where appropriate.

CRITICAL PRIVACY RULE: You are strictly forbidden from discussing or answering questions about fees, profit and loss, expenses, tuition pricing, salaries, budgets, or any administrative financial details. If the user asks about these topics, you must politely decline by saying: 'Sorry, I cannot answer questions about financial details, fees, or profit & loss metrics.' Do not make any exceptions under any circumstances.`;

    if (userContext) {
      systemPromptText += `\n\nActive Logged-in User Information (strictly non-financial):
- Student Name: ${userContext.name}
- Role: ${userContext.role}
- Batch/Class Enrolled: ${userContext.class}
- Father's Name: ${userContext.fatherName || 'N/A'}`;
    }

    contents.unshift({
      role: 'user',
      parts: [{ text: `System Prompt: ${systemPromptText}` }]
    });
    contents.unshift({
      role: 'model',
      parts: [{ text: "Understood. I am Aarambh AI. I am loaded with the current student's name, batch, and father's name, and I will strictly avoid any discussions regarding fees, profit & loss, or other administrative financial metrics." }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const botText = data.candidates[0].content.parts[0].text;
    
    res.json({ success: true, text: botText });
  } catch (error) {
    console.error('[GEMINI API ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to contact AI provider' });
  }
});

// Announcements Endpoints
app.get('/api/announcements', authenticateToken, (req, res) => {
  if (req.user.role === 'student') {
    db.get(`SELECT className FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      const studentClass = user ? user.className : 'N/A';
      db.all(
        `SELECT * FROM announcements WHERE target_class = 'All' OR target_class = ? ORDER BY id DESC`,
        [studentClass],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows);
        }
      );
    });
  } else {
    db.all(`SELECT * FROM announcements ORDER BY id DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post('/api/announcements', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { title, content, target_class } = req.body;
  const date = new Date().toLocaleDateString();
  db.run(`INSERT INTO announcements (title, content, target_class, date) VALUES (?, ?, ?, ?)`,
    [title, content, target_class || 'All', date],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, content, target_class, date });
    }
  );
});

app.delete('/api/announcements/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.run(`DELETE FROM announcements WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Update Profile Details (Admin and others)
app.put('/api/users/profile', authenticateToken, (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  db.run(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, name, email });
  });
});

// Email Database Backup
app.post('/api/admin/backup', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  db.get(`SELECT email FROM users WHERE id = ?`, [req.user.id], async (err, row) => {
    if (err || !row || !row.email) {
      return res.status(400).json({ error: 'Please save your email ID in profile settings first.' });
    }
    
    if (!transporter) {
      return res.status(500).json({ error: 'Email service is offline.' });
    }
    
    try {
      const info = await transporter.sendMail({
        from: '"Aarambh Backup" <backup@aarambh.edu>',
        to: row.email,
        subject: `💾 Aarambh System Backup: ${new Date().toLocaleDateString()}`,
        text: 'Hello Admin,\n\nAttached is the automated database backup file (aarambh.db) for your tuition system.',
        attachments: [
          {
            filename: 'aarambh.db',
            path: path.resolve(__dirname, 'aarambh.db')
          }
        ]
      });
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Backup Emailed] Preview: ${previewUrl}`);
      logAction('BACKUP_EMAILED', `Admin requested database backup emailed to ${row.email}`);
      res.json({ success: true, previewUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to send email: ' + e.message });
    }
  });
});

// Trigger Weekly Summary & CSV Roster Report
app.post('/api/admin/report', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  db.get(`SELECT email FROM users WHERE id = ?`, [req.user.id], (err, adminUser) => {
    if (err || !adminUser || !adminUser.email) {
      return res.status(400).json({ error: 'Please save your email ID in profile settings first.' });
    }
    
    db.all(`SELECT name, className as class, parentPhone FROM users WHERE role = 'student'`, [], (err, students) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all(`SELECT paid FROM fees`, [], (err, feesList) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT amount FROM expenses`, [], async (err, expensesList) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const totalIncome = feesList.reduce((sum, f) => sum + f.paid, 0);
          const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);
          const netProfit = totalIncome - totalExpenses;
          
          // Generate CSV content
          let csvContent = 'Name,Class,Parent Phone\n';
          students.forEach(s => {
            csvContent += `"${s.name}","${s.class || 'No Class'}","${s.parentPhone || ''}"\n`;
          });
          
          const reportHtml = `
            <h2>📊 Aarambh Weekly Operational Report</h2>
            <p>Here is your weekly summary of system activities:</p>
            <table border="1" cellpadding="8" style="border-collapse: collapse; border-color: #e2e8f0; font-family: sans-serif;">
              <tr style="background-color: #f8fafc; font-weight: bold;"><th>Metric</th><th>Value</th></tr>
              <tr><td>Total Enrolled Students</td><td>${students.length}</td></tr>
              <tr><td>Total Income (Fees Collected)</td><td>Rs. ${totalIncome}</td></tr>
              <tr><td>Total Operating Expenses</td><td>Rs. ${totalExpenses}</td></tr>
              <tr style="font-weight: bold; color: ${netProfit >= 0 ? '#059669' : '#dc2626'};">
                <td>Net Profit</td>
                <td>Rs. ${netProfit}</td>
              </tr>
            </table>
            <p>Attached is the current active student roster in CSV format.</p>
          `;
          
          if (!transporter) {
            return res.status(500).json({ error: 'Email service is offline.' });
          }
          
          try {
            const info = await transporter.sendMail({
              from: '"Aarambh Reports" <reports@aarambh.edu>',
              to: adminUser.email,
              subject: `📈 Weekly Operational Report - ${new Date().toLocaleDateString()}`,
              html: reportHtml,
              attachments: [
                {
                  filename: 'student_roster.csv',
                  content: csvContent
                }
              ]
            });
            
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`[Weekly Report Emailed] Preview: ${previewUrl}`);
            logAction('REPORT_EMAILED', `Admin triggered weekly operational report emailed to ${adminUser.email}`);
            res.json({ success: true, previewUrl });
          } catch(e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to send report: ' + e.message });
          }
        });
      });
    });
  });
});

// Storage Size Checking Utility (Warns if SQLite database is over 50MB)
const checkDatabaseStorageSize = () => {
  try {
    const dbFilePath = path.resolve(__dirname, 'aarambh.db');
    if (fs.existsSync(dbFilePath)) {
      const stats = fs.statSync(dbFilePath);
      const sizeInMB = stats.size / (1024 * 1024);
      console.log(`[Storage Monitor] SQLite database size is ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 50) {
        db.get(`SELECT email FROM users WHERE role = 'admin'`, [], async (err, admin) => {
          if (!err && admin && admin.email && transporter) {
            try {
              await transporter.sendMail({
                from: '"Aarambh Alerts" <alerts@aarambh.edu>',
                to: admin.email,
                subject: '⚠️ LOW STORAGE WARNING: Aarambh System database size exceeded limit',
                text: `Warning: Your SQLite database size has reached ${sizeInMB.toFixed(2)} MB. Please trigger a database backup email and clean up system logs to prevent write failures.`
              });
              console.log('[Storage Monitor] Sent low storage email alert to admin.');
            } catch (mailErr) {
              console.error('[Storage Monitor Alert Fail]', mailErr);
            }
          }
        });
      }
    }
  } catch (err) {
    console.error('[Storage Monitor Error]', err.message);
  }
};
// Check every 3 hours
setInterval(checkDatabaseStorageSize, 3 * 60 * 60 * 1000);
// Also trigger alert check once on boot
setTimeout(checkDatabaseStorageSize, 10000);
const checkAndSendBirthdayGreetings = () => {
  const today = new Date();
  const currentMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  console.log(`[Birthday Engine] Checking greetings for day-month: ${currentMonthDay}`);
  
  db.all(`SELECT id, name, email, birthdate FROM users WHERE role = 'student' AND email IS NOT NULL AND birthdate IS NOT NULL`, [], (err, studentsList) => {
    if (err || !studentsList) return;
    
    studentsList.forEach(student => {
      // birthdate format: YYYY-MM-DD
      const parts = student.birthdate.split('-');
      if (parts.length === 3) {
        const studentMonthDay = `${parts[1]}-${parts[2]}`;
        if (studentMonthDay === currentMonthDay && transporter) {
          console.log(`[Birthday Engine] Triggering greeting email to ${student.name} (${student.email})`);
          transporter.sendMail({
            from: '"Aarambh Management" <admin@aarambh.edu>',
            to: student.email,
            subject: `🎂 Happy Birthday, ${student.name}! 🌟`,
            text: `Dear ${student.name},\n\nHappy Birthday from all of us at Aarambh! 🥳✨\n\nMay this special day bring you loads of happiness, love, and success in everything you do. Keep shining and learning!\n\nBest wishes,\nTeam Aarambh`,
            html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); text-align: center;">
                     <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                       <h1 style="color: #4A90E2; margin-top: 0; font-size: 28px;">🎉 Happy Birthday, ${student.name}! 🎉</h1>
                       <div style="font-size: 50px; margin: 20px 0;">🎂🎈✨</div>
                       <p style="font-size: 16px; color: #333; line-height: 1.6;">
                         Wishing you a fantastic day filled with joy, laughter, and your favorite treats! 
                         We are extremely proud to have you as part of the Aarambh family.
                       </p>
                       <p style="font-size: 16px; color: #333; font-weight: bold; margin-top: 20px;">
                         Keep shining, learning, and reaching for the stars! 🌟
                       </p>
                       <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                       <p style="margin: 0; color: #777; font-size: 14px;">With warm regards,</p>
                       <p style="margin: 5px 0 0 0; color: #4A90E2; font-weight: bold; font-size: 16px;">Team Aarambh</p>
                     </div>
                   </div>`
          }).catch(sendErr => console.error(`[Birthday Email Error] for ${student.name}:`, sendErr.message));
        }
      }
    });
  });
};

// Check student birthdays once daily
setInterval(checkAndSendBirthdayGreetings, 24 * 60 * 60 * 1000);
// Also trigger alert check once on boot after 8 seconds
setTimeout(checkAndSendBirthdayGreetings, 8000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
