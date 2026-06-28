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

  waClient.initialize();
} catch (error) {
  console.error('[WhatsApp] Failed to init:', error);
  waStatus = 'ERROR';
}
// -----------------------------

// Ethereal Email Setup (Zero-config free testing)
let transporter;
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log('Ethereal Email system initialized. Ready to send free test messages!');
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
  const { role, name, username, password, phone, className, admissionNumber, fees, fatherName } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const formattedName = name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : name;
  const formattedFatherName = fatherName ? fatherName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;

  db.run(`INSERT INTO registration_requests (role, name, username, password, parentPhone, className, admission_number, fees, status, fatherName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, 
    [role, formattedName, username, hashedPassword, phone, className, admissionNumber || null, fees || 0, formattedFatherName], 
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
      db.run(`INSERT INTO users (name, username, password, role, parentPhone, className, admission_number, fatherName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [request.name || request.username, request.username, request.password, request.role, request.parentPhone, request.className, admNum, request.fatherName], 
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
  const { name, className, parentPhone, fatherName } = req.body;
  const hashedPassword = await bcrypt.hash('pass', 10); // default password
  const formattedName = name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : name;
  const formattedFatherName = fatherName ? fatherName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;

  // Generate unique AES admission number
  db.get(`SELECT MAX(CAST(SUBSTR(admission_number, 4) AS INTEGER)) as max_num FROM users WHERE role = 'student'`, [], (err, row) => {
    const nextNum = (row && row.max_num ? row.max_num : 0) + 1;
    const admissionNumber = `AES${nextNum}`;
    
    db.run(`INSERT INTO users (name, role, className, parentPhone, password, admission_number, fatherName) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [formattedName, 'student', className, parentPhone, hashedPassword, admissionNumber, formattedFatherName], 
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
        
        res.json({ id: newUserId, name: formattedName, class: className, parentPhone, admission_number: admissionNumber, fatherName: formattedFatherName });
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
    ? `SELECT fees.*, users.name, users.parentPhone FROM fees JOIN users ON fees.student_id = users.id WHERE fees.student_id = ? AND fees.month = ?`
    : `SELECT fees.*, users.name, users.parentPhone FROM fees JOIN users ON fees.student_id = users.id WHERE fees.student_id = ?`;
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
      
      res.json({ success: true, paid: newPaid, status: newStatus, paymentMode, paymentDate });
    });
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
    res.json({ success: true });
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
app.get('/api/whatsapp/status', authenticateToken, (req, res) => {
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
app.post('/api/sms', authenticateToken, async (req, res) => {
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

  // 3. Fallback to Ethereal Email Simulation
  if (!transporter) {
    return res.status(500).json({ success: false, error: 'Email fallback system not ready yet.' });
  }

  try {
    const info = await transporter.sendMail({
      from: '"Aarambh System" <admin@aarambh.edu>',
      to: `${to}@example.com`,
      subject: "New Message from Aarambh",
      text: message,
    });
    
    const url = nodemailer.getTestMessageUrl(info);
    console.log(`[REAL MESSAGE SENT] Preview URL: ${url}`);
    
    res.json({ 
      success: true, 
      simulated: true, 
      message: 'Message simulated successfully via Ethereal',
      previewUrl: url 
    });
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
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

  // 1. Offline Mode with student-specific context intelligence
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || '';
    let responseText = "I am currently running in Offline FAQ Mode. To unlock my full Artificial Intelligence, please add your Google Gemini API Key in the server settings!";
    
    if (userContext) {
      if (lastUserMessage.includes('fee') || lastUserMessage.includes('pending') || lastUserMessage.includes('due') || lastUserMessage.includes('pay') || lastUserMessage.includes('rupee') || lastUserMessage.includes('money')) {
        const pendingMonths = userContext.fees ? userContext.fees.filter(f => f.status !== 'Paid').map(f => f.month) : [];
        if (pendingMonths.length > 0) {
          responseText = `Hello ${userContext.name}! Your tuition fees are **Pending** for the following month(s): **${pendingMonths.join(', ')}**.\n\nYou can pay these month-by-month through the 'My Receipts' page or directly from your Student Dashboard.`;
        } else {
          responseText = `Great news ${userContext.name}! Your tuition fees for all 12 months (January to December) are fully **Paid**. Thank you so much!`;
        }
      } else if (lastUserMessage.includes('batch') || lastUserMessage.includes('class') || lastUserMessage.includes('schedule') || lastUserMessage.includes('subject')) {
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
    let systemPromptText = "You are Aarambh AI, a highly intelligent and friendly assistant for a tuition management system. You help students, parents, teachers, and admins with queries. Be concise, polite, and use formatting like bolding or bullet points where appropriate.";
    if (userContext) {
      systemPromptText += `\n\nActive Logged-in User Information:
- Student Name: ${userContext.name}
- Role: ${userContext.role}
- Batch/Class Enrolled: ${userContext.class}
- Father's Name: ${userContext.fatherName || 'N/A'}
- 12-Month Tuition Fees Data: ${JSON.stringify(userContext.fees)}`;
    }

    contents.unshift({
      role: 'user',
      parts: [{ text: `System Prompt: ${systemPromptText}` }]
    });
    contents.unshift({
      role: 'model',
      parts: [{ text: "Understood. I am Aarambh AI, and I am loaded with the current student's personal batch, fees, and father's name context. I will personalize my responses accordingly." }]
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
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
