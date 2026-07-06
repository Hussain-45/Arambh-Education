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
const waClients = {};
const waQrDataUrls = {};
const waStatuses = {};

// Keep global variables for backward compatibility
let waClient = null;
let waStatus = 'DISCONNECTED';
let waQrDataUrl = null;

const initializeUserWaClient = (userId) => {
  if (waClients[userId]) return waClients[userId];
  
  waStatuses[userId] = 'INITIALIZING';
  waQrDataUrls[userId] = null;
  console.log(`[WhatsApp User ${userId}] Initializing WhatsApp Client...`);

  try {
    const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const hasLocalChrome = fs.existsSync(defaultChromePath);

    const puppeteerOpts = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (hasLocalChrome) {
      puppeteerOpts.executablePath = defaultChromePath;
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: `user_${userId}` }),
      puppeteer: puppeteerOpts
    });

    client.on('qr', async (qr) => {
      waStatuses[userId] = 'AWAITING_SCAN';
      waQrDataUrls[userId] = await qrcode.toDataURL(qr);
      console.log(`[WhatsApp User ${userId}] QR Code generated. Waiting for scan...`);
    });

    client.on('ready', () => {
      waStatuses[userId] = 'CONNECTED';
      waQrDataUrls[userId] = null;
      console.log(`[WhatsApp User ${userId}] Client is completely READY and connected!`);
    });

    client.on('disconnected', (reason) => {
      waStatuses[userId] = 'DISCONNECTED';
      waQrDataUrls[userId] = null;
      console.log(`[WhatsApp User ${userId}] Client disconnected:`, reason);
      try {
        client.destroy();
      } catch (e) {}
      delete waClients[userId];
    });

    client.initialize().catch(err => {
      console.error(`[WhatsApp User ${userId}] Client initialization failed asynchronously:`, err.message);
      waStatuses[userId] = 'ERROR';
    });

    waClients[userId] = client;
    return client;
  } catch (error) {
    console.error(`[WhatsApp User ${userId}] Failed to init:`, error);
    waStatuses[userId] = 'ERROR';
  }
};

const getSenderWaClient = (senderId) => {
  if (senderId && waClients[senderId]) {
    return {
      client: waClients[senderId],
      status: waStatuses[senderId]
    };
  }
  // Fallback to any connected client
  for (const uid in waClients) {
    if (waStatuses[uid] === 'CONNECTED') {
      return {
        client: waClients[uid],
        status: waStatuses[uid]
      };
    }
  }
  return { client: null, status: 'DISCONNECTED' };
};

// Scan database and auto-initialize WhatsApp clients for users with active sessions on startup
setTimeout(() => {
  db.all(`SELECT id FROM users WHERE role IN ('admin', 'teacher')`, [], (err, rows) => {
    if (err || !rows) return;
    rows.forEach(row => {
      const sessionPath = path.join(__dirname, '.wwebjs_auth', `session-user_${row.id}`);
      if (fs.existsSync(sessionPath)) {
        console.log(`[WhatsApp] Auto-reconnecting user ${row.id} session...`);
        initializeUserWaClient(row.id);
      }
    });
  });
}, 2000);
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
  let token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    token = req.query.token;
  }
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
// seedClasses();

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
      res.json({ 
        token, 
        user: { 
          id: row.id, 
          role: row.role, 
          name: row.name, 
          email: row.email, 
          email_alerts: row.email_alerts !== 0 ? 1 : 0, 
          sms_alerts: row.sms_alerts !== 0 ? 1 : 0, 
          language: row.language || 'English' 
        } 
      });
    });
  } else if (role === 'teacher') {
    db.get(`SELECT * FROM users WHERE username = ? AND role = 'teacher'`, [username], async (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Invalid teacher credentials' });
      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(401).json({ error: 'Invalid teacher credentials' });
      
      // First-time login approval check
      if (row.login_approved === 0) {
        db.get(`SELECT COUNT(*) as count FROM registration_requests WHERE username = ? AND status = 'pending'`, [row.username], (err, reqRow) => {
          if (!err && (!reqRow || reqRow.count === 0)) {
            db.run(`INSERT INTO registration_requests (role, name, username, password, parentPhone, className, status, fatherName, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              ['teacher', row.name, row.username, 'DUMMY_PW', row.phone, 'Teacher Account', 'pending', 'FIRST_LOGIN', row.email],
              (err) => {
                if (err) console.error('[Registration Request Insertion Error]', err.message);
              });
          }
        });
        return res.status(403).json({ error: 'Your account requires first-time login approval by the administrator. A request has been sent.' });
      }

      // Get assigned classes
      db.all(`SELECT class_name FROM teacher_classes WHERE teacher_id = ?`, [row.id], (err, classes) => {
        row.assignedClasses = classes ? classes.map(c => c.class_name) : [];
        const token = jwt.sign({ id: row.id, role: row.role, name: row.name }, JWT_SECRET);
        res.json({ 
          token, 
          user: { 
            id: row.id, 
            role: row.role, 
            name: row.name, 
            email: row.email, 
            assignedClasses: row.assignedClasses,
            email_alerts: row.email_alerts !== 0 ? 1 : 0, 
            sms_alerts: row.sms_alerts !== 0 ? 1 : 0, 
            language: row.language || 'English'
          } 
        });
      });
    });
  } else if (role === 'student') {
    // Support login using email, phone, parentPhone, or admission number
    db.get(`SELECT * FROM users WHERE (email = ? OR phone = ? OR parentPhone = ? OR admission_number = ?) AND role = 'student'`, [username, username, username, username], async (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Invalid student credentials' });
      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(401).json({ error: 'Invalid student credentials' });
      
      // First-time login approval check
      if (row.login_approved === 0) {
        const reqUsername = row.username || row.email || row.admission_number;
        db.get(`SELECT COUNT(*) as count FROM registration_requests WHERE username = ? AND status = 'pending'`, [reqUsername], (err, reqRow) => {
          if (!err && (!reqRow || reqRow.count === 0)) {
            db.run(`INSERT INTO registration_requests (role, name, username, password, parentPhone, className, admission_number, status, fatherName, email, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              ['student', row.name, reqUsername, 'DUMMY_PW', row.parentPhone, row.className, row.admission_number, 'pending', 'FIRST_LOGIN', row.email, row.birthdate],
              (err) => {
                if (err) console.error('[Registration Request Insertion Error]', err.message);
              });
          }
        });
        return res.status(403).json({ error: 'Your account requires first-time login approval by the administrator. A request has been sent.' });
      }

      const token = jwt.sign({ id: row.id, role: row.role, name: row.name, class: row.className, admission_number: row.admission_number }, JWT_SECRET);
      // Map className to class for frontend compatibility
      row.class = row.className;
      res.json({ 
        token, 
        user: { 
          id: row.id, 
          role: row.role, 
          name: row.name, 
          class: row.class, 
          admission_number: row.admission_number,
          email: row.email,
          registrationDate: row.registrationDate,
          email_alerts: row.email_alerts !== 0 ? 1 : 0, 
          sms_alerts: row.sms_alerts !== 0 ? 1 : 0, 
          language: row.language || 'English'
        } 
      });
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

// Update Password (Authenticated)
app.post('/api/auth/update-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current password and new password are required' });
  }

  const userId = req.user.id;
  db.get(`SELECT password FROM users WHERE id = ?`, [userId], async (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, row.password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedNewPassword, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      logAction('PASSWORD_CHANGED', `User ID ${userId} updated their password`);
      res.json({ success: true, message: 'Password updated successfully' });
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
    
    db.get(`SELECT id FROM users WHERE username = ? OR email = ? OR phone = ? OR (admission_number = ? AND role = ?)`, [request.username, request.username, request.username, request.admission_number, request.role], (err, userRow) => {
      if (userRow) {
        // User already exists (First-Time Login Approval Flow)
        db.run(`UPDATE users SET login_approved = 1 WHERE id = ?`, [userRow.id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          db.run(`DELETE FROM registration_requests WHERE id = ?`, [reqId]);
          logAction('REQUEST_APPROVED', `Admin approved first-time login for ${request.name || request.username} (${request.role})`);
          
          if (request.parentPhone) {
            sendAutoSms(request.parentPhone, `Your first-time login request at Aarambh has been approved! You can now log in.`, req.user.id);
          }
          
          res.json({ success: true, message: 'First-time login request approved' });
        });
      } else {
        // Normal registration request. Create a new user account.
        db.get(`SELECT admission_number FROM users WHERE role = ? ORDER BY id DESC LIMIT 1`, [request.role], (err, row) => {
      let nextNum = 1;
      if (row && row.admission_number) {
        const parts = row.admission_number.split('-');
        if (parts.length === 2) {
          const currentNum = parseInt(parts[1], 10);
          if (!isNaN(currentNum)) {
            nextNum = currentNum + 1;
          }
        }
      }
      const prefix = request.role === 'student' ? 'AES' : request.role === 'teacher' ? 'AET' : 'ADM';
      const finalAdmissionNumber = `${prefix}-${nextNum.toString().padStart(2, '0')}`;
      
      // Fetch monthly fee from class definition if student
      if (request.role === 'student') {
        db.get(`SELECT monthlyFee FROM classes WHERE name = ?`, [request.className], (err, classRow) => {
          const baseFee = (classRow && classRow.monthlyFee) ? classRow.monthlyFee : 0;
          // Calculate scholarship discount
          const discountVal = parseInt(request.discountPercent) || 0;
          const finalFee = Math.max(0, Math.round(baseFee * (1 - discountVal / 100)));
          
          insertUser(finalAdmissionNumber, finalFee);
        });
      } else {
        insertUser(finalAdmissionNumber, 0);
      }
    });

    function insertUser(admNum, monthlyFee) {
      const regDate = new Date().toISOString().split('T')[0];
      db.run(`INSERT INTO users (name, username, password, role, parentPhone, className, admission_number, fatherName, email, birthdate, registrationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [request.name || request.username, request.username, request.password, request.role, request.parentPhone, request.className, admNum, request.fatherName, request.email, request.birthdate, regDate], 
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const newUserId = this.lastID;
          
          // If student, create fee records starting from the month they joined (registration month)
          if (request.role === 'student') {
            const monthsList = [
              'January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const currentMonthIdx = new Date().getMonth(); // 0-based index
            monthsList.forEach((m, idx) => {
              if (idx >= currentMonthIdx) {
                const monthNum = String(idx + 1).padStart(2, '0');
                const dueDate = `10/${monthNum}/2026`;
                db.run(`INSERT INTO fees (student_id, total, paid, status, due_date, month) VALUES (?, ?, 0, 'Pending', ?, ?)`, 
                  [newUserId, monthlyFee, dueDate, m]);
              }
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
      }
    });
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
  const { name, grade, time, monthlyFee } = req.body;
  const fee = parseInt(monthlyFee) || 0;
  db.run(`INSERT INTO classes (name, grade, time, monthlyFee) VALUES (?, ?, ?, ?)`, [name, grade, time, fee], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('CLASS_ADDED', `Admin created new batch: ${name}`);
    res.json({ id: this.lastID, name, grade, time, monthlyFee: fee });
  });
});

// Edit a class (Admin only)
app.put('/api/classes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const classId = parseInt(req.params.id);
  const { name, grade, time, monthlyFee } = req.body;
  const fee = parseInt(monthlyFee) || 0;

  db.get(`SELECT name FROM classes WHERE id = ?`, [classId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Class not found' });
    const oldName = row.name;

    db.run(`UPDATE classes SET name = ?, grade = ?, time = ?, monthlyFee = ? WHERE id = ?`, 
      [name, grade, time, fee, classId], 
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Cascade class name change to students, teachers, assignments, and library
        if (oldName !== name) {
          db.run(`UPDATE users SET className = ? WHERE className = ? AND role = 'student'`, [name, oldName]);
          db.run(`UPDATE teacher_classes SET class_name = ? WHERE class_name = ?`, [name, oldName]);
          db.run(`UPDATE assignments SET subject = ? WHERE subject = ?`, [name, oldName]);
          db.run(`UPDATE library SET subject = ? WHERE subject = ?`, [name, oldName]);
        }
        
        logAction('CLASS_UPDATED', `Admin updated batch: ${name}`);
        res.json({ id: classId, name, grade, time, monthlyFee: fee });
      }
    );
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
      db.run(`DELETE FROM teacher_classes WHERE class_name = ?`, [row.name]);
      logAction('CLASS_DELETED', `Admin deleted batch: ${row.name}`);
      res.json({ success: true });
    });
  });
});

// Get all students
app.get('/api/students', authenticateToken, (req, res) => {
  db.all(`SELECT id, name, parentPhone, className as class, password, fatherName, admission_number, email, phone, motherName, gender, bloodGroup, address, discountPercent, registrationDate FROM users WHERE role = 'student'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a student (Admin only)
app.post('/api/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, className, parentPhone, fatherName, email, birthdate, phone, motherName, gender, bloodGroup, address, discountPercent, registrationDate, password } = req.body;
  
  const studentPassword = password || 'password';
  const hashedPassword = await bcrypt.hash(studentPassword, 10);
  const formattedName = name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : name;
  const formattedFatherName = fatherName ? fatherName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;
  const discountVal = parseInt(discountPercent) || 0;
  const regDate = registrationDate || new Date().toISOString().split('T')[0];

  // Fetch monthly fee from class definition
  db.get(`SELECT monthlyFee FROM classes WHERE name = ?`, [className], (err, classRow) => {
    const baseFee = (classRow && classRow.monthlyFee) ? classRow.monthlyFee : 0;
    const finalFee = Math.max(0, Math.round(baseFee * (1 - discountVal / 100)));

    // Generate unique AES admission number (AES-01, AES-02...)
    db.get(`SELECT admission_number FROM users WHERE role = 'student' ORDER BY id DESC LIMIT 1`, (err, row) => {
      let nextNum = 1;
      if (row && row.admission_number) {
        const parts = row.admission_number.split('-');
        if (parts.length === 2) {
          const currentNum = parseInt(parts[1], 10);
          if (!isNaN(currentNum)) {
            nextNum = currentNum + 1;
          }
        }
      }
      const admissionNumber = `AES-${nextNum.toString().padStart(2, '0')}`;
      
      db.run(`INSERT INTO users (name, role, className, parentPhone, password, admission_number, fatherName, email, birthdate, phone, motherName, gender, bloodGroup, address, discountPercent, registrationDate, login_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, 
        [formattedName, 'student', className, parentPhone, hashedPassword, admissionNumber, formattedFatherName, email || null, birthdate || null, phone || null, motherName || null, gender || null, bloodGroup || null, address || null, discountVal, regDate], 
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const newUserId = this.lastID;

          const parts = regDate.split('-');
          let startingMonthIdx = 0;
          if (parts.length >= 2) {
            const parsedMonth = parseInt(parts[1], 10);
            if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
              startingMonthIdx = parsedMonth - 1;
            }
          }

          // Create initial fee records for student starting from registration month
          const monthsList = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          monthsList.forEach((m, idx) => {
            if (idx >= startingMonthIdx) {
              const monthNum = String(idx + 1).padStart(2, '0');
              const dueDate = `10/${monthNum}/2026`;
              db.run(`INSERT INTO fees (student_id, total, paid, status, due_date, month) VALUES (?, ?, 0, 'Pending', ?, ?)`, 
                [newUserId, finalFee, dueDate, m]);
            }
          });
          
          logAction('STUDENT_ADDED', `Admin added new student: ${formattedName} (${admissionNumber}) to class ${className}`);
          
          res.json({ 
            id: newUserId, 
            name: formattedName, 
            class: className, 
            parentPhone, 
            admission_number: admissionNumber, 
            fatherName: formattedFatherName, 
            email,
            phone,
            motherName,
            gender,
            bloodGroup,
            address,
            discountPercent: discountVal,
            registrationDate: regDate
          });
      });
    });
  });
});

// Edit a student (Admin only)
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const studentId = parseInt(req.params.id);
  const { name, className, parentPhone, fatherName, email, birthdate, phone, motherName, gender, bloodGroup, address, discountPercent, registrationDate, password } = req.body;
  
  const discountVal = parseInt(discountPercent) || 0;
  const formattedName = name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : name;
  const formattedFatherName = fatherName ? fatherName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;

  const updateStudentDb = (hashedPassword) => {
    let query = `UPDATE users SET name = ?, className = ?, parentPhone = ?, fatherName = ?, email = ?, birthdate = ?, phone = ?, motherName = ?, gender = ?, bloodGroup = ?, address = ?, discountPercent = ?, registrationDate = ?`;
    let params = [formattedName, className, parentPhone, formattedFatherName, email, birthdate, phone, motherName, gender, bloodGroup, address, discountVal, registrationDate];

    if (hashedPassword) {
      query += `, password = ?`;
      params.push(hashedPassword);
    }
    query += ` WHERE id = ? AND role = 'student'`;
    params.push(studentId);

    db.run(query, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Update future unpaid fees totals based on new class/discount fee mapping
      db.get(`SELECT monthlyFee FROM classes WHERE name = ?`, [className], (err, classRow) => {
        const baseFee = (classRow && classRow.monthlyFee) ? classRow.monthlyFee : 0;
        const finalFee = Math.max(0, Math.round(baseFee * (1 - discountVal / 100)));

        db.run(`UPDATE fees SET total = ? WHERE student_id = ? AND status = 'Pending'`, [finalFee, studentId], (err) => {
          logAction('STUDENT_UPDATED', `Admin updated student record: ${formattedName}`);
          res.json({
            id: studentId,
            name: formattedName,
            class: className,
            parentPhone,
            fatherName: formattedFatherName,
            email,
            birthdate,
            phone,
            motherName,
            gender,
            bloodGroup,
            address,
            discountPercent: discountVal,
            registrationDate
          });
        });
      });
    });
  };

  if (password && password.trim() !== '') {
    const hash = await bcrypt.hash(password, 10);
    updateStudentDb(hash);
  } else {
    updateStudentDb(null);
  }
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

// Helper for immediate attendance alert
const triggerImmediateAttendanceAlert = (studentId, date, status, senderId = null) => {
  if (status !== 'Absent' && status !== 'Late') return;

  db.get(`SELECT name, parentPhone FROM users WHERE id = ?`, [studentId], async (err, student) => {
    if (err || !student || !student.parentPhone) return;

    const messageBody = `*Aarambh Attendance Alert* ⚠️\n\nDear Parent, this is to inform you that your child *${student.name}* has been marked *${status}* on *${date}*.\n\nPlease contact the school desk if you have any questions.\n\nThank you,\n*Aarambh Institution*`;
    
    console.log(`[Auto-SMS] Dispatching immediate attendance alert to ${student.parentPhone} via WhatsApp...`);
    
    const { client, status: senderStatus } = getSenderWaClient(senderId);
    if (senderStatus === 'CONNECTED' && client) {
      try {
        const sanitizedNumber = student.parentPhone.replace(/[^\d]/g, '');
        const chatId = sanitizedNumber.length <= 10 ? `91${sanitizedNumber}@c.us` : `${sanitizedNumber}@c.us`;
        await client.sendMessage(chatId, messageBody);
        console.log(`[Auto-SMS] Sent immediate attendance alert via WhatsApp to ${chatId}`);
      } catch (e) {
        console.error('[Auto-SMS Error] WhatsApp transmission failed:', e.message);
      }
    } else {
      console.log(`[Auto-SMS Fallback] WhatsApp offline. Logged simulated attendance SMS: "${messageBody}"`);
    }
  });
};

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
        triggerImmediateAttendanceAlert(studentId, date, status, req.user.id);
        res.json({ success: true, updated: true });
      });
    } else {
      db.run(`INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)`, [studentId, date, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        triggerImmediateAttendanceAlert(studentId, date, status, req.user.id);
        res.json({ success: true, inserted: true });
      });
    }
  });
});

// Get all attendance logs
app.get('/api/attendance', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM attendance ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
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
  if (!transporter) return res.status(200).json({ success: false, error: 'Email service is offline or unverified. Please verify your Gmail SMTP configuration in settings.' });

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
  db.all(`SELECT id, name, username, password, email, phone, salary, specialization, admission_number as teacherIdNumber FROM users WHERE role = 'teacher'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Get assigned classes for each
    const promises = rows.map(teacher => {
      return new Promise((resolve, reject) => {
        db.all(`SELECT class_name FROM teacher_classes WHERE teacher_id = ?`, [teacher.id], (err, classes) => {
          if (err) reject(err);
          teacher.assignedClasses = classes ? classes.map(c => c.class_name) : [];
          resolve(teacher);
        });
      });
    });

    Promise.all(promises).then(teachers => res.json(teachers)).catch(err => res.status(500).json({ error: err.message }));
  });
});

// Add a teacher (Admin only)
app.post('/api/teachers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, email, phone, salary, specialization, assignedClasses, password } = req.body;
  const teacherSalary = parseInt(salary) || 0;
  const teacherPassword = password || '1526'; // Default default password if not provided

  // Generate next sequential Teacher ID (AET-01, AET-02...)
  db.get(`SELECT admission_number FROM users WHERE role = 'teacher' ORDER BY id DESC LIMIT 1`, (err, row) => {
    let nextNum = 1;
    if (row && row.admission_number) {
      const parts = row.admission_number.split('-');
      if (parts.length === 2) {
        const currentNum = parseInt(parts[1], 10);
        if (!isNaN(currentNum)) {
          nextNum = currentNum + 1;
        }
      }
    }
    const teacherIdStr = `AET-${nextNum.toString().padStart(2, '0')}`;

    bcrypt.hash(teacherPassword, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Password hashing failed' });

      db.run(`INSERT INTO users (name, username, password, role, email, phone, salary, specialization, admission_number, login_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [name, email, hash, 'teacher', email, phone, teacherSalary, specialization, teacherIdStr],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const teacherId = this.lastID;

          // Insert class assignments
          if (assignedClasses && assignedClasses.length > 0) {
            const stmt = db.prepare(`INSERT INTO teacher_classes (teacher_id, class_name) VALUES (?, ?)`);
            assignedClasses.forEach(c => stmt.run(teacherId, c));
            stmt.finalize();
          }

          logAction('TEACHER_ADDED', `Admin added teacher: ${name} (${teacherIdStr})`);
          res.json({
            id: teacherId,
            name,
            username: email,
            email,
            phone,
            salary: teacherSalary,
            specialization,
            teacherIdNumber: teacherIdStr,
            assignedClasses: assignedClasses || []
          });
        }
      );
    });
  });
});

// Edit a teacher (Admin only)
app.put('/api/teachers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const teacherId = parseInt(req.params.id);
  const { name, email, phone, salary, specialization, assignedClasses, password } = req.body;
  const teacherSalary = parseInt(salary) || 0;

  const updateTeacher = (hashedPassword) => {
    let query = `UPDATE users SET name = ?, username = ?, email = ?, phone = ?, salary = ?, specialization = ?`;
    let params = [name, email, email, phone, teacherSalary, specialization];

    if (hashedPassword) {
      query += `, password = ?`;
      params.push(hashedPassword);
    }

    query += ` WHERE id = ? AND role = 'teacher'`;
    params.push(teacherId);

    db.run(query, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Update class assignments: Clear old ones and insert new ones
      db.run(`DELETE FROM teacher_classes WHERE teacher_id = ?`, [teacherId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (assignedClasses && assignedClasses.length > 0) {
          const stmt = db.prepare(`INSERT INTO teacher_classes (teacher_id, class_name) VALUES (?, ?)`);
          assignedClasses.forEach(c => stmt.run(teacherId, c));
          stmt.finalize();
        }

        logAction('TEACHER_UPDATED', `Admin updated teacher profile: ${name}`);
        res.json({
          id: teacherId,
          name,
          username: email,
          email,
          phone,
          salary: teacherSalary,
          specialization,
          assignedClasses: assignedClasses || []
        });
      });
    });
  };

  if (password && password.trim() !== '') {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Password hashing failed' });
      updateTeacher(hash);
    });
  } else {
    updateTeacher(null);
  }
});

// Delete a teacher (Admin only)
app.delete('/api/teachers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const teacherId = parseInt(req.params.id);

  db.get(`SELECT name FROM users WHERE id = ? AND role = 'teacher'`, [teacherId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Teacher not found' });
    const teacherName = row.name;

    db.run(`DELETE FROM users WHERE id = ? AND role = 'teacher'`, [teacherId], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Delete assigned classes
      db.run(`DELETE FROM teacher_classes WHERE teacher_id = ?`, [teacherId]);

      logAction('TEACHER_DELETED', `Admin deleted teacher: ${teacherName}`);
      res.json({ success: true });
    });
  });
});

// Get fees
app.get('/api/fees', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM fees`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // mapping db snake_case to frontend camelCase
    const mapped = rows.map(r => ({
      id: r.id, studentId: r.student_id, total: r.total, paid: r.paid, status: r.status, dueDate: r.due_date,
      paymentMode: r.payment_mode, paymentDate: r.payment_date, month: r.month,
      upiTransactionId: r.upi_transaction_id, upiPaymentStatus: r.upi_payment_status, upiPaymentNotes: r.upi_payment_notes
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
const sendAutoSms = async (phone, message, senderId = null) => {
  if (!phone) return;
  console.log(`[Auto-SMS] Dispatching to ${phone} via WhatsApp (sender: ${senderId || 'default'})...`);
  
  let sentViaWa = false;
  const { client, status } = getSenderWaClient(senderId);
  if (status === 'CONNECTED' && client) {
    try {
      let rawPhone = phone.replace(/\D/g, '');
      if (rawPhone.length === 10) rawPhone = `91${rawPhone}`;
      const chatId = `${rawPhone}@c.us`;
      await client.sendMessage(chatId, message);
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
    ? `SELECT fees.*, users.name, users.parentPhone, users.email, users.className, users.admission_number, users.discountPercent FROM fees JOIN users ON fees.student_id = users.id WHERE fees.student_id = ? AND fees.month = ?`
    : `SELECT fees.*, users.name, users.parentPhone, users.email, users.className, users.admission_number, users.discountPercent FROM fees JOIN users ON fees.student_id = users.id WHERE fees.student_id = ?`;
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
      
      const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
      
      if (fee.parentPhone) {
        const waReceiptMessage = `*🧾 AARAMBH INSTITUTION - PAYMENT RECEIPT*\n` +
          `----------------------------------------\n` +
          `*Receipt No:* ${receiptNo}\n` +
          `*Date:* ${paymentDate || new Date().toLocaleDateString()}\n` +
          `*Student Name:* ${fee.name}\n` +
          `*Admission No:* ${fee.admission_number || 'N/A'}\n` +
          `*Class/Batch:* ${fee.className || 'N/A'}\n\n` +
          `*Payment Details:*\n` +
          `- *Month:* ${month || 'Current'}\n` +
          `- *Total Fee:* ₹${fee.total}\n` +
          `- *Discount Applied:* ${fee.discountPercent || 0}%\n` +
          `- *Amount Paid:* ₹${amount}\n` +
          `- *Payment Mode:* ${paymentMode || 'Cash'}\n` +
          `- *Status:* PAID ✅\n\n` +
          `Thank you for your payment!\n` +
          `_For any queries, contact accounts@aarambh.edu_`;
          
        sendAutoSms(fee.parentPhone, waReceiptMessage);
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

// Submit UPI payment verification request
app.put('/api/fees/:id/submit-upi', authenticateToken, (req, res) => {
  const feeId = parseInt(req.params.id);
  const { upiTransactionId } = req.body;

  if (!upiTransactionId) {
    return res.status(400).json({ error: 'UPI Transaction ID is required' });
  }

  db.get(`SELECT * FROM fees WHERE id = ?`, [feeId], (err, fee) => {
    if (err || !fee) {
      return res.status(404).json({ error: 'Fee record not found' });
    }

    if (req.user.role !== 'admin' && req.user.id !== fee.student_id) {
      return res.sendStatus(403);
    }

    db.run(
      `UPDATE fees SET payment_mode = 'UPI', upi_transaction_id = ?, upi_payment_status = 'pending_verification', status = 'Pending Verification' WHERE id = ?`,
      [upiTransactionId, feeId],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        logAction('UPI_SUBMITTED', `Student ID ${fee.student_id} submitted UPI Transaction ID ${upiTransactionId} for fee ID ${feeId}`);
        res.json({ success: true, message: 'UPI transaction submitted for verification' });
      }
    );
  });
});

// Verify UPI payment (Admin only)
app.put('/api/fees/:id/verify-upi', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const feeId = parseInt(req.params.id);
  const { status, notes } = req.body;

  if (status !== 'verified' && status !== 'rejected') {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.get(
    `SELECT fees.*, users.name, users.parentPhone, users.email, users.className, users.admission_number, users.discountPercent 
     FROM fees JOIN users ON fees.student_id = users.id WHERE fees.id = ?`,
    [feeId],
    (err, fee) => {
      if (err || !fee) {
        return res.status(404).json({ error: 'Fee record not found' });
      }

      const paymentDate = new Date().toLocaleDateString();
      if (status === 'verified') {
        const newPaid = fee.total;
        db.run(
          `UPDATE fees SET paid = ?, status = 'Paid', payment_mode = 'UPI', payment_date = ?, upi_payment_status = 'verified', upi_payment_notes = ? WHERE id = ?`,
          [newPaid, paymentDate, notes || 'Approved by Admin', feeId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            logAction('FEE_PAID', `Admin verified UPI payment of Rs. ${fee.total} for student ID ${fee.student_id}. Transaction ID: ${fee.upi_transaction_id}`);

            const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
            
            if (fee.parentPhone) {
              const waReceiptMessage = `*🧾 AARAMBH INSTITUTION - UPI PAYMENT VERIFIED*\n` +
                `----------------------------------------\n` +
                `*Receipt No:* ${receiptNo}\n` +
                `*Date:* ${paymentDate}\n` +
                `*Student Name:* ${fee.name}\n` +
                `*Admission No:* ${fee.admission_number || 'N/A'}\n` +
                `*Class/Batch:* ${fee.className || 'N/A'}\n\n` +
                `*Payment Details:*\n` +
                `- *Month:* ${fee.month || 'Current'}\n` +
                `- *Total Fee:* ₹${fee.total}\n` +
                `- *UPI Transaction ID:* ${fee.upi_transaction_id}\n` +
                `- *Status:* PAID ✅ (Verified)\n\n` +
                `Thank you for your payment!\n` +
                `_For any queries, contact accounts@aarambh.edu_`;
                
              sendAutoSms(fee.parentPhone, waReceiptMessage);
            }

            if (fee.email && transporter) {
              transporter.sendMail({
                from: '"Aarambh Invoice Service" <billing@aarambh.edu>',
                to: fee.email,
                subject: `🧾 UPI PAYMENT VERIFIED: ${fee.name} - ${fee.month || 'Current'} Month`,
                text: `Dear Parent,\n\nWe have verified the UPI payment (Transaction ID: ${fee.upi_transaction_id}) of Rs. ${fee.total} for ${fee.name} for the month of ${fee.month || 'Current'}.\n\nReceipt Details:\n- Receipt No: ${receiptNo}\n- Amount: Rs. ${fee.total}\n- Payment Mode: UPI (Verified)\n- Payment Date: ${paymentDate}\n\nThank you for choosing Aarambh!\n\nBest regards,\nAarambh Accounts`,
                html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #eaeaea; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #fafafa;">
                         <div style="text-align: center; border-bottom: 2px solid #2ecc71; padding-bottom: 15px; margin-bottom: 20px;">
                           <h2 style="color: #2ecc71; margin: 0; font-size: 24px;">Aarambh Tuition Centre</h2>
                           <small style="color: #666; text-transform: uppercase; letter-spacing: 1px;">UPI Payment Verified</small>
                         </div>
                         <p>Dear Parent,</p>
                         <p>We have successfully verified your UPI payment for the student.</p>
                         <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px dashed #ddd; margin: 20px 0;">
                           <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                             <tr><td style="padding: 6px 0; color: #666;"><strong>Receipt No:</strong></td><td style="padding: 6px 0; text-align: right;">${receiptNo}</td></tr>
                             <tr><td style="padding: 6px 0; color: #666;"><strong>Student Name:</strong></td><td style="padding: 6px 0; text-align: right;"><strong>${fee.name}</strong></td></tr>
                             <tr><td style="padding: 6px 0; color: #666;"><strong>For Month:</strong></td><td style="padding: 6px 0; text-align: right;">${fee.month || 'Current'}</td></tr>
                             <tr><td style="padding: 6px 0; color: #666;"><strong>UPI Txn ID:</strong></td><td style="padding: 6px 0; text-align: right;">${fee.upi_transaction_id}</td></tr>
                             <tr style="border-top: 1px solid #eee; margin-top: 10px;"><td style="padding: 10px 0; color: #666; font-size: 16px;"><strong>Amount Paid:</strong></td><td style="padding: 10px 0; text-align: right; font-size: 18px; color: #2ecc71;"><strong>Rs. ${fee.total}</strong></td></tr>
                           </table>
                         </div>
                       </div>`
              }).catch(err => console.error('[Fee Invoice Email Error]', err.message));
            }

            res.json({ success: true, message: 'UPI Payment verified successfully' });
          }
        );
      } else {
        db.run(
          `UPDATE fees SET upi_payment_status = 'rejected', upi_payment_notes = ?, status = 'Pending' WHERE id = ?`,
          [notes || 'Rejected by Admin', feeId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            logAction('UPI_REJECTED', `Admin rejected UPI payment for student ID ${fee.student_id}. Note: ${notes}`);

            if (fee.parentPhone) {
              const waRejectionMessage = `*⚠️ AARAMBH INSTITUTION - UPI PAYMENT REJECTED*\n` +
                `----------------------------------------\n` +
                `We were unable to verify the UPI payment of ₹${fee.total} for the month of *${fee.month}* for student *${fee.name}*.\n\n` +
                `*Reason:* ${notes || 'Invalid Transaction ID'}\n\n` +
                `Please double-check your reference number and submit it again in the Student Portal.`;
              sendAutoSms(fee.parentPhone, waRejectionMessage);
            }

            res.json({ success: true, message: 'UPI Payment verification rejected' });
          }
        );
      }
    }
  );
});

// Send automatic fee reminders to all students with pending fees
app.post('/api/fees/remind-pending', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);

  db.get(`SELECT value FROM system_settings WHERE key = 'email_fee_alerts'`, (err, settingRow) => {
    const emailFeeAlertsEnabled = settingRow ? settingRow.value === 'true' : true;

    db.all(`SELECT fees.*, users.name, users.parentPhone, users.email FROM fees JOIN users ON fees.student_id = users.id WHERE fees.status != 'Paid'`, [], async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let sentCount = 0;
      let failedCount = 0;
      let emailSentCount = 0;
      
      const { client: adminClient, status: adminStatus } = getSenderWaClient(req.user.id);
      
      for (const row of rows) {
        const dueAmount = row.total - row.paid;
        const message = `Dear Parent, this is a reminder from Aarambh that the tuition fee of Rs. ${dueAmount} for ${row.name} for the month of ${row.month || 'Current'} is currently pending. Please clear the dues at your earliest convenience. Thank you!`;
        
        // 1. Send via WhatsApp if phone exists
        if (row.parentPhone) {
          if (adminStatus === 'CONNECTED' && adminClient) {
            try {
              let phone = row.parentPhone.replace(/\D/g, '');
              if (phone.length === 10) phone = `91${phone}`;
              const chatId = `${phone}@c.us`;
              
              await adminClient.sendMessage(chatId, message);
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

// Delete single history log
app.delete('/api/admin/history/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const logId = parseInt(req.params.id);
  db.run(`DELETE FROM audit_logs WHERE id = ?`, [logId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Clear all history logs
app.delete('/api/admin/history', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run(`DELETE FROM audit_logs`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
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

// Delete assignment
app.delete('/api/assignments/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const assignmentId = parseInt(req.params.id);
  db.run(`DELETE FROM assignments WHERE id = ?`, [assignmentId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('ASSIGNMENT_DELETED', `User ${req.user.username} deleted assignment ID: ${assignmentId}`);
    res.json({ message: 'Assignment deleted successfully' });
  });
});

// Delete library material
app.delete('/api/library/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const materialId = parseInt(req.params.id);
  db.run(`DELETE FROM library WHERE id = ?`, [materialId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('LIBRARY_DELETED', `User ${req.user.username} deleted study material ID: ${materialId}`);
    res.json({ message: 'Study material deleted successfully' });
  });
});

// --- SUBMISSIONS ENDPOINTS ---

// Submit an assignment (Student only, or simulated)
app.post('/api/submissions', authenticateToken, upload.single('file'), (req, res) => {
  const assignment_id = req.body.assignmentId || req.body.assignment_id;
  const student_id = req.user.role === 'student' ? req.user.id : (req.body.studentId || req.body.student_id);
  const link = req.body.link || '';
  const text = req.body.text || '';
  
  if (!assignment_id || !student_id) {
    return res.status(400).json({ error: 'assignmentId and studentId are required' });
  }

  let file_path = '';
  if (req.file) {
    file_path = `http://localhost:5000/uploads/${req.file.filename}`;
  }

  db.run(
    `INSERT INTO submissions (assignment_id, student_id, link, text, file_path, status, timestamp) VALUES (?, ?, ?, ?, ?, 'Submitted', datetime('now', 'localtime'))`,
    [assignment_id, student_id, link, text, file_path],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        assignmentId: parseInt(assignment_id),
        studentId: parseInt(student_id),
        link,
        text,
        file_path,
        status: 'Submitted',
        timestamp: new Date().toLocaleString(),
        grade: null,
        feedback: null
      });
    }
  );
});

// Get submissions (Teachers/Admins view filtered/all, Students view only their own)
app.get('/api/submissions', authenticateToken, (req, res) => {
  let sql = `SELECT * FROM submissions`;
  let params = [];
  if (req.user.role === 'student') {
    sql += ` WHERE student_id = ?`;
    params.push(req.user.id);
  } else {
    const studentId = req.query.studentId || req.query.student_id;
    const assignmentId = req.query.assignmentId || req.query.assignment_id;
    let conditions = [];
    if (studentId) {
      conditions.push(`student_id = ?`);
      params.push(studentId);
    }
    if (assignmentId) {
      conditions.push(`assignment_id = ?`);
      params.push(assignmentId);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({
      id: r.id,
      assignmentId: r.assignment_id,
      studentId: r.student_id,
      link: r.link,
      text: r.text,
      file_path: r.file_path,
      status: r.status,
      timestamp: r.timestamp,
      grade: r.grade,
      feedback: r.feedback
    })));
  });
});

// Delete a submission (Student only, if not graded yet)
app.delete('/api/submissions/:id', authenticateToken, (req, res) => {
  const submissionId = parseInt(req.params.id);
  const studentId = req.user.id;

  // Verify the submission belongs to the student and is not graded
  db.get(`SELECT * FROM submissions WHERE id = ?`, [submissionId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Submission not found' });

    if (row.student_id !== studentId) {
      return res.status(403).json({ error: 'Unauthorized to delete this submission' });
    }

    if (row.grade) {
      return res.status(400).json({ error: 'Cannot delete a graded submission' });
    }

    db.run(`DELETE FROM submissions WHERE id = ?`, [submissionId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAction('SUBMISSION_DELETED', `Student deleted submission ID ${submissionId} for assignment ID ${row.assignment_id}`);
      res.json({ success: true, message: 'Submission deleted successfully' });
    });
  });
});

// Grade a submission (Teacher/Admin only)
app.put('/api/submissions/:id/grade', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const submissionId = parseInt(req.params.id);
  const { grade, feedback } = req.body;

  if (!grade) {
    return res.status(400).json({ error: 'Grade is required' });
  }

  db.run(
    `UPDATE submissions SET grade = ?, feedback = ?, status = 'Graded' WHERE id = ?`,
    [grade, feedback || '', submissionId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Fetch details for WhatsApp and Email notifications
      db.get(
        `SELECT s.*, u.name as student_name, u.email as student_email, u.parentPhone as parent_phone, a.title as assignment_title
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         JOIN assignments a ON s.assignment_id = a.id
         WHERE s.id = ?`,
        [submissionId],
        async (err, row) => {
          if (err || !row) {
            console.warn('[Grading Notification Warning] Could not fetch student/assignment details:', err?.message);
            return res.json({ success: true, message: 'Graded (Notification skipped)' });
          }

          // 1. Email to Student
          if (row.student_email) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.ethereal.email',
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: false,
              auth: {
                user: process.env.SMTP_USER || 'aarambhinstitute46@gmail.com',
                pass: process.env.SMTP_PASS || 'pass'
              }
            });

            db.all(`SELECT key, value FROM system_settings WHERE key IN ('email_user', 'email_pass')`, [], async (err, settings) => {
              let userVal = 'aarambhinstitute46@gmail.com';
              let passVal = '';
              if (!err && settings) {
                settings.forEach(s => {
                  if (s.key === 'email_user') userVal = s.value;
                  if (s.key === 'email_pass') passVal = s.value;
                });
              }

              const mailOptions = {
                from: `"Aarambh Institute" <${userVal}>`,
                to: row.student_email,
                subject: `📝 Assignment Graded: ${row.assignment_title}`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Your Assignment has been Graded</h2>
                    <p>Hello <strong>${row.student_name}</strong>,</p>
                    <p>Your submission for assignment <strong>"${row.assignment_title}"</strong> has been graded by your teacher.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Grade:</strong> <span style="font-size: 18px; color: #10b981; font-weight: bold;">${grade}</span></p>
                      <p style="margin: 5px 0;"><strong>Feedback:</strong> ${feedback || 'No feedback provided.'}</p>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated notification from Aarambh School Management System.</p>
                  </div>
                `
              };

              try {
                const info = await transporter.sendMail(mailOptions);
                console.log(`[Grading Email Sent] to ${row.student_email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
              } catch (e) {
                console.error('[Grading Email Error] Failed to send email:', e.message);
              }
            });
          }

          // 2. WhatsApp to Parent
          if (row.parent_phone) {
            const messageBody = `*Aarambh Notification* 📝\n\nDear Parent, your child *${row.student_name}*'s submission for assignment *"${row.assignment_title}"* has been graded.\n\n*Grade:* ${grade}\n*Feedback:* ${feedback || 'No feedback.'}\n\nThank you,\n*Aarambh Institution*`;
            console.log(`[Auto-SMS] Dispatching grading alert to ${row.parent_phone} via WhatsApp...`);
            
            const { client: teacherClient, status: teacherStatus } = getSenderWaClient(req.user.id);
            if (teacherStatus === 'CONNECTED' && teacherClient) {
              try {
                const sanitizedNumber = row.parent_phone.replace(/[^\d]/g, '');
                const chatId = sanitizedNumber.length <= 10 ? `91${sanitizedNumber}@c.us` : `${sanitizedNumber}@c.us`;
                await teacherClient.sendMessage(chatId, messageBody);
                console.log(`[Auto-SMS] Sent grading alert via WhatsApp to ${chatId}`);
              } catch (e) {
                console.error('[Auto-SMS] WhatsApp transmission failed:', e.message);
              }
            } else {
              console.log(`[Auto-SMS Fallback] WhatsApp offline. Logged simulated grading SMS: "${messageBody}"`);
            }
          }

          // Log action
          logAction('SUBMISSION_GRADED', `Teacher graded submission ID ${submissionId} for student ${row.student_name}: ${grade}`);
          res.json({ success: true, message: 'Submission graded successfully' });
        }
      );
    }
  );
});

// --- DOUBT CLEARANCE TICKETS ENDPOINTS ---

// Get doubt tickets
app.get('/api/doubts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'student') {
    db.all(`SELECT * FROM doubt_tickets WHERE student_id = ? ORDER BY id DESC`, [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentClass: r.student_class,
        subject: r.subject,
        description: r.description,
        status: r.status,
        timestamp: r.timestamp,
        reply: r.reply
      })));
    });
  } else {
    // Admin or Teacher can see all doubt tickets
    db.all(`SELECT * FROM doubt_tickets ORDER BY id DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentClass: r.student_class,
        subject: r.subject,
        description: r.description,
        status: r.status,
        timestamp: r.timestamp,
        reply: r.reply
      })));
    });
  }
});

// Submit a doubt ticket (Student only)
app.post('/api/doubts', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') return res.sendStatus(403);
  const { subject, description } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  const studentId = req.user.id;
  
  // Look up student details to save name and class
  db.get(`SELECT name, className FROM users WHERE id = ?`, [studentId], (err, userRow) => {
    if (err || !userRow) return res.status(500).json({ error: 'Student details not found' });

    const timestamp = new Date().toLocaleString();
    db.run(
      `INSERT INTO doubt_tickets (student_id, student_name, student_class, subject, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, userRow.name, userRow.className || 'General', subject, description, timestamp],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        logAction('DOUBT_SUBMITTED', `Student ${userRow.name} submitted doubt ticket #${this.lastID} in ${subject}`);
        res.json({
          id: this.lastID,
          studentId,
          studentName: userRow.name,
          studentClass: userRow.className || 'General',
          subject,
          description,
          status: 'Pending',
          timestamp,
          reply: null
        });
      }
    );
  });
});

// Reply to a doubt ticket (Teacher/Admin only)
app.post('/api/doubts/:id/reply', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.sendStatus(403);
  const { reply } = req.body;
  const ticketId = req.params.id;
  if (!reply) {
    return res.status(400).json({ error: 'Reply content is required' });
  }

  db.run(
    `UPDATE doubt_tickets SET reply = ?, status = 'Resolved' WHERE id = ?`,
    [reply, ticketId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Doubt ticket not found' });

      logAction('DOUBT_RESOLVED', `User ${req.user.name} resolved doubt ticket #${ticketId}`);
      res.json({ success: true, message: 'Reply submitted and ticket marked as Resolved' });
    }
  );
});

// --- EVENTS ENDPOINTS ---

// Get all calendar events
app.get('/api/events', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM calendar_events ORDER BY date ASC, time ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new calendar event (Admin only)
app.post('/api/events', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { title, date, time, type, description } = req.body;
  if (!title || !date || !type) {
    return res.status(400).json({ error: 'title, date, and type are required' });
  }

  db.run(
    `INSERT INTO calendar_events (title, date, time, type, description) VALUES (?, ?, ?, ?, ?)`,
    [title, date, time || '', type, description || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAction('EVENT_CREATED', `Admin created event: ${title} on ${date}`);
      res.json({ id: this.lastID, title, date, time, type, description });
    }
  );
});

// Delete calendar event (Admin only)
app.delete('/api/events/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const eventId = parseInt(req.params.id);
  db.run(`DELETE FROM calendar_events WHERE id = ?`, [eventId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    logAction('EVENT_DELETED', `Admin deleted event ID: ${eventId}`);
    res.json({ success: true, message: 'Event deleted successfully' });
  });
});

// Check WhatsApp Status
app.get('/api/whatsapp/status', authenticateToken, (req, res) => {
  const userId = req.user.id;
  if (!waClients[userId]) {
    initializeUserWaClient(userId);
  }
  res.json({
    status: waStatuses[userId] || 'DISCONNECTED',
    qr: waQrDataUrls[userId] || null
  });
});

// Restart WhatsApp Client (Re-generate QR code)
app.post('/api/whatsapp/restart', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    console.log(`[WhatsApp User ${userId}] Re-initializing WhatsApp Web client...`);
    if (waClients[userId]) {
      try {
        await waClients[userId].destroy();
      } catch (err) {
        console.error('Error destroying old client:', err);
      }
      delete waClients[userId];
    }
    
    initializeUserWaClient(userId);
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
  const { client, status } = getSenderWaClient(req.user.id);
  if ((channel === 'Auto-WhatsApp' || channel === 'WhatsApp') && status === 'CONNECTED' && client) {
    try {
      let phone = to.replace(/\D/g, '');
      if (phone.length === 10) phone = `91${phone}`; // default to India if 10 digits
      const chatId = `${phone}@c.us`;
      
      await client.sendMessage(chatId, message);
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

// AI Study Companion / Academic Tutor Endpoint (Google Gemini)
app.post('/api/ai/study-help', authenticateToken, async (req, res) => {
  const { question, history } = req.body;
  const subject = req.body.subject || 'General Academics';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // 1. Offline Mode Fallback
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return res.json({
      success: true,
      text: `***[OFFLINE MODE]***
I am currently operating offline because the Gemini API key is not configured.
Here is a quick study guide for **${subject}**:
* Re-read your chapter notes.
* Solve mock questions in the **Quizzes** section.
* Contact your teacher directly in the classroom!

To enable the interactive AI Study Tutor, please add your Google Gemini API Key in the server configuration.`
    });
  }

  // 2. Online Mode using Google Gemini API
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const contents = [];

    const systemPromptText = `You are the Aarambh AI Study Tutor, a friendly and highly knowledgeable academic tutor. 
Your specialty is teaching and explaining concepts in: **${subject}**.
Follow these strict rules:
1. Focus entirely on academic and learning topics relevant to ${subject}.
2. If the question is a math, science, or programming problem, do NOT just output the final answer immediately. Walk through the explanation step-by-step.
3. Be encouraging and end your response by presenting one follow-up check-for-understanding practice question or quiz item for the student.
4. Render all mathematical equations, chemical formulas, and code snippets in clean Markdown format (e.g. use standard LaTeX notation like $E=mc^2$ or code fences).
5. Politely refuse to answer any non-academic or system administrative questions (e.g. fees, schedules, passwords, database settings).`;

    contents.push({
      role: 'user',
      parts: [{ text: `System Prompt: ${systemPromptText}` }]
    });

    contents.push({
      role: 'model',
      parts: [{ text: `Understood! I am now locked in as the Aarambh AI Study Tutor for ${subject}. I will provide step-by-step academic explanations, utilize clean Markdown/LaTeX formatting, refuse non-academic queries, and conclude my responses with a checking question.` }]
    });

    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Response Status: ${response.statusText}`);
    }

    const data = await response.json();
    const botText = data.candidates[0].content.parts[0].text;
    res.json({ success: true, text: botText });
  } catch (error) {
    console.error('[AI TUTOR ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to contact AI provider' });
  }
});

// --- AI Doubt Solver Vision Endpoint ---
app.post('/api/ai/solve-doubt', authenticateToken, async (req, res) => {
  const { image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!image) return res.status(400).json({ error: 'Image is required' });

  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid image format' });
  const mimeType = match[1];
  const base64Data = match[2];

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return res.json({
      success: true,
      text: `***[OFFLINE MODE]***
I parsed your image doubt. Here is the offline explanation:
* **Step 1:** Read the question carefully to identify the given quantities.
* **Step 2:** Formulate the equation. For example: $F = m \cdot a$ or $y = mx + c$.
* **Step 3:** Substitute the values and calculate the final result.

Configure your Google Gemini API key to enable live OCR analysis!`
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [
          { text: "Explain this homework doubt or question step-by-step. Render math equations using standard LaTeX syntax like $E=mc^2$ or $$F=ma$$." },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Gemini API call failed');
    const data = await response.json();
    const botText = data.candidates[0].content.parts[0].text;
    res.json({ success: true, text: botText });
  } catch (err) {
    console.error('[SOLVE DOUBT ERROR]', err);
    res.status(500).json({ error: 'Failed to analyze the doubt image.' });
  }
});

// --- AI Academic Audio Podcasts Endpoint ---
app.post('/api/ai/generate-podcast', authenticateToken, async (req, res) => {
  const { topic } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    const mockScript = [
      { speaker: 'Dr. Elena', line: `Hello Alex! Today we are studying ${topic}. Ready to dive in?` },
      { speaker: 'Alex', line: `Yes, Dr. Elena! How does it work?` },
      { speaker: 'Dr. Elena', line: `Essentially, ${topic} is key for understanding our daily sciences. Think of it like a stepping stone.` },
      { speaker: 'Alex', line: `Ah, that makes perfect sense! Thanks!` }
    ];
    return res.json({ success: true, script: mockScript });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const promptText = `Generate a script for a podcast explanation of "${topic}". The format MUST be a valid JSON array of objects, where each object has exactly two fields: "speaker" (either "Dr. Elena" or "Alex") and "line" (what they say). Keep the explanation short (6-8 turns total) and conversational. Output raw JSON array only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) throw new Error('Gemini API call failed');
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();

    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    const script = JSON.parse(text);
    res.json({ success: true, script });
  } catch (err) {
    console.error('[AI PODCAST ERROR]', err);
    res.status(500).json({ error: 'Failed to generate academic audio script.' });
  }
});

// --- Batch Discussion Rooms Endpoints ---
app.get('/api/batches/:className/messages', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM batch_messages WHERE class_name = ? ORDER BY id ASC LIMIT 50`,
    [req.params.className],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/batches/:className/messages', authenticateToken, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message text is required' });

  db.run(
    `INSERT INTO batch_messages (class_name, sender_id, sender_name, sender_role, text) VALUES (?, ?, ?, ?, ?)`,
    [req.params.className, req.user.id, req.user.name, req.user.role, text],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const msgId = this.lastID;
      
      // Award 5 XP for classroom cooperation
      awardXP(req.user.id, 5, () => {
        res.json({ success: true, msgId });
      });
    }
  );
});

// --- Admissions CRM Leads Endpoints ---
app.get('/api/leads', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  db.all(`SELECT * FROM leads ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/leads', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { student_name, parent_name, phone, email, grade, status, notes } = req.body;
  if (!student_name || !parent_name || !phone) {
    return res.status(400).json({ error: 'Student Name, Parent Name, and Phone are required' });
  }
  db.run(
    `INSERT INTO leads (student_name, parent_name, phone, email, grade, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [student_name, parent_name, phone, email || null, grade || null, status || 'New', notes || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, leadId: this.lastID });
    }
  );
});

app.put('/api/leads/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  db.run(
    `UPDATE leads SET status = ? WHERE id = ?`,
    [status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.put('/api/leads/:id/notes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { notes } = req.body;
  db.run(
    `UPDATE leads SET notes = ? WHERE id = ?`,
    [notes, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/leads/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  db.run(`DELETE FROM leads WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Support Desk & Ticketing System Endpoints ---
app.get('/api/tickets', authenticateToken, (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'teacher') {
    db.all(`SELECT * FROM support_tickets ORDER BY id DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } else {
    db.all(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC`, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post('/api/tickets', authenticateToken, (req, res) => {
  const { title, category, description } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Title, Category, and Description are required' });
  }
  db.run(
    `INSERT INTO support_tickets (user_id, user_name, user_role, title, category, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, req.user.name, req.user.role, title, category, description, 'Open'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, ticketId: this.lastID });
    }
  );
});

app.put('/api/tickets/:id/reply', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { reply, status } = req.body;
  if (!reply || !status) {
    return res.status(400).json({ error: 'Reply and Status are required' });
  }
  db.run(
    `UPDATE support_tickets SET admin_reply = ?, status = ? WHERE id = ?`,
    [reply, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// --- Parent WhatsApp Alerts Endpoint ---
app.post('/api/admin/send-whatsapp-progress', authenticateToken, (req, res) => {
  const { studentId, parentPhone } = req.body;
  if (!studentId || !parentPhone) return res.status(400).json({ error: 'Student ID and Parent Phone are required' });

  db.get(
    `SELECT name, className, IFNULL(xp, 0) as xp FROM users WHERE id = ?`,
    [studentId],
    (err, student) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!student) return res.status(404).json({ error: 'Student not found' });

      db.all(`SELECT score, total_questions FROM quiz_attempts WHERE student_id = ?`, [studentId], (err, attempts) => {
        if (err) return res.status(500).json({ error: err.message });

        let quizAvg = 'N/A';
        if (attempts.length > 0) {
          const totalScores = attempts.reduce((acc, a) => acc + (a.score / a.total_questions), 0);
          quizAvg = Math.round((totalScores / attempts.length) * 100);
        }

        db.all(`SELECT status FROM attendance WHERE student_id = ?`, [studentId], async (err, atts) => {
          if (err) return res.status(500).json({ error: err.message });

          let attendanceRate = '100';
          if (atts.length > 0) {
            const presents = atts.filter(a => a.status === 'Present').length;
            attendanceRate = Math.round((presents / atts.length) * 100);
          }

          const level = Math.floor(student.xp / 500) + 1;
          const messageText = `*📚 Aarambh Education Weekly Progress Report*

Dear Parent,
Here is the performance report for your child *${student.name}*:
- *Class:* ${student.className || 'General'}
- *Student ID:* ${studentId}
- *Level:* ${level} (${student.xp} XP)
- *Quiz Average:* ${quizAvg}%
- *Attendance:* ${attendanceRate}%

Thank you for partnering with Aarambh Institute!
Best regards,
Aarambh Education Team`;

          const { client, status } = getSenderWaClient(req.user.id);
          if (status === 'CONNECTED' && client) {
            try {
              const cleanPhone = parentPhone.replace(/\D/g, '');
              const waId = cleanPhone.length === 10 ? `91${cleanPhone}@c.us` : `${cleanPhone}@c.us`;
              await client.sendMessage(waId, messageText);
              res.json({ success: true, message: 'Progress Report sent to parent via WhatsApp!' });
            } catch (err) {
              console.error('[WHATSAPP SEND FAIL]', err);
              res.json({ success: true, message: 'WhatsApp failed to deliver. Delivery simulated in log console.', mock_sent: true });
            }
          } else {
            res.json({ success: true, message: 'WhatsApp service not connected. Delivery simulated in log console.', mock_sent: true });
          }
        });
      });
    }
  );
});

// ============================================================================
// NEW FEATURES: GAMIFICATION, FLASHCARDS, AND STUDY PLANNER ENDPOINTS
// ============================================================================

// Reusable Gamification Helpers
function awardXP(studentId, amount, callback = () => {}) {
  db.run(
    `UPDATE users SET xp = IFNULL(xp, 0) + ? WHERE id = ?`,
    [amount, studentId],
    (err) => {
      if (err) console.error('[XP AWARD ERROR]', err.message);
      
      // Let's audit log this reward
      db.run(
        `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
        ['XP_AWARD', `Student ID ${studentId} awarded ${amount} XP.`]
      );
      callback();
    }
  );
}

function unlockBadge(studentId, badgeName, badgeType, callback = () => {}) {
  db.get(
    `SELECT id FROM student_badges WHERE student_id = ? AND badge_name = ?`,
    [studentId, badgeName],
    (err, row) => {
      if (!err && !row) {
        db.run(
          `INSERT INTO student_badges (student_id, badge_name, badge_type) VALUES (?, ?, ?)`,
          [studentId, badgeName, badgeType],
          (err) => {
            if (!err) {
              console.log(`[BADGE UNLOCKED] Student ID ${studentId} unlocked "${badgeName}"`);
              // Let's award 100 bonus XP for unlocking a badge!
              awardXP(studentId, 100, callback);
            } else {
              callback();
            }
          }
        );
      } else {
        callback();
      }
    }
  );
}

// 1. Gamification & Leaderboard Routes
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  db.all(
    `SELECT id, name, className, IFNULL(xp, 0) as xp
     FROM users 
     WHERE role = 'student' 
     ORDER BY xp DESC`,
    [],
    (err, students) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Fetch badges for each student
      db.all(`SELECT student_id, badge_name, badge_type FROM student_badges`, [], (err, badges) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const leaderboard = students.map(s => {
          const sBadges = badges.filter(b => b.student_id === s.id).map(b => b.badge_name);
          return {
            ...s,
            badges: sBadges
          };
        });
        
        res.json(leaderboard);
      });
    }
  );
});

app.get('/api/gamification/profile', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, className, IFNULL(xp, 0) as xp FROM users WHERE id = ?`, [req.user.id], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    db.all(`SELECT badge_name, badge_type, unlocked_at FROM student_badges WHERE student_id = ?`, [req.user.id], (err, badges) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        xp: student.xp,
        badges: badges
      });
    });
  });
});

// 2. AI Flashcard Routes
app.post('/api/flashcards/generate', authenticateToken, async (req, res) => {
  const { topic } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  // Create local offline fallback if no API key
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    const offlineCards = [
      { front: `What is the main definition of ${topic}?`, back: `Placeholder study explanation for ${topic}.` },
      { front: `List 2 key formulas or facts related to ${topic}.`, back: `1. Fact A\n2. Formula/Fact B.` },
      { front: `State one typical application of ${topic}.`, back: `Used in school homeworks and exam preparation.` }
    ];
    
    db.run(`INSERT INTO flashcard_decks (student_id, title) VALUES (?, ?)`, [req.user.id, topic], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const deckId = this.lastID;
      
      const insertStmt = db.prepare(`INSERT INTO flashcards (deck_id, front, back, next_review_date) VALUES (?, ?, ?, date('now'))`);
      offlineCards.forEach(c => insertStmt.run([deckId, c.front, c.back]));
      insertStmt.finalize();
      
      awardXP(req.user.id, 50, () => {
        res.json({ success: true, message: 'Flashcard deck created offline successfully!', deckId });
      });
    });
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const promptText = `Generate 5 flashcard Q&A items for the topic "${topic}". Output format must be a valid JSON array of objects, where each object has exactly two fields: "front" (the question or term) and "back" (the answer or explanation). Do not wrap the JSON in Markdown or any other text; output raw JSON only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) throw new Error('Failed to fetch from Gemini');
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();
    
    // Sanitize response markdown block wrap if any
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    const cards = JSON.parse(text);
    if (!Array.isArray(cards)) throw new Error('Response is not a valid array');

    db.run(`INSERT INTO flashcard_decks (student_id, title) VALUES (?, ?)`, [req.user.id, topic], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const deckId = this.lastID;
      
      const insertStmt = db.prepare(`INSERT INTO flashcards (deck_id, front, back, next_review_date) VALUES (?, ?, ?, date('now'))`);
      cards.forEach(c => insertStmt.run([deckId, c.front || 'Q', c.back || 'A']));
      insertStmt.finalize();
      
      awardXP(req.user.id, 50, () => {
        // Unlock badge if they have 3+ decks
        db.get(`SELECT COUNT(*) as count FROM flashcard_decks WHERE student_id = ?`, [req.user.id], (err, row) => {
          if (!err && row && row.count >= 3) {
            unlockBadge(req.user.id, 'Flashcard Scholar', 'academic');
          }
        });
        res.json({ success: true, message: 'Flashcards generated successfully!', deckId });
      });
    });
  } catch (err) {
    console.error('[AI FLASHCARD ERROR]', err);
    res.status(500).json({ error: 'Failed to generate flashcards via AI.' });
  }
});

app.get('/api/flashcards/decks', authenticateToken, (req, res) => {
  db.all(
    `SELECT d.*, COUNT(f.id) as card_count 
     FROM flashcard_decks d
     LEFT JOIN flashcards f ON f.deck_id = d.id
     WHERE d.student_id = ?
     GROUP BY d.id`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/api/flashcards/decks/:id', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM flashcards WHERE deck_id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/flashcards/:id/review', authenticateToken, (req, res) => {
  const { rating } = req.body; // 1 (Hard), 3 (Good), 5 (Easy)
  if (!rating) return res.status(400).json({ error: 'Rating is required' });

  db.get(`SELECT * FROM flashcards WHERE id = ?`, [req.params.id], (err, card) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    let { interval, ease_factor, repetitions } = card;
    if (rating >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 4;
      else interval = Math.round(interval * ease_factor);
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    db.run(
      `UPDATE flashcards 
       SET interval = ?, ease_factor = ?, repetitions = ?, next_review_date = date('now', '+' || ? || ' days')
       WHERE id = ?`,
      [interval, ease_factor, repetitions, interval, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        awardXP(req.user.id, 15, () => {
          unlockBadge(req.user.id, 'Memory Master', 'academic');
          res.json({ success: true, nextReviewInDays: interval });
        });
      }
    );
  });
});

app.delete('/api/flashcards/decks/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM flashcard_decks WHERE id = ? AND student_id = ?`, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 3. AI Study Planner Routes
app.get('/api/study-planner', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM study_planner WHERE student_id = ? ORDER BY date ASC, time ASC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/study-planner', authenticateToken, (req, res) => {
  const { title, date, time, duration_minutes, subject } = req.body;
  db.run(
    `INSERT INTO study_planner (student_id, title, date, time, duration_minutes, subject, completed) VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [req.user.id, title, date, time, duration_minutes || 30, subject],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const eventId = this.lastID;
      awardXP(req.user.id, 10, () => {
        res.json({ success: true, eventId });
      });
    }
  );
});

app.put('/api/study-planner/:id', authenticateToken, (req, res) => {
  const { completed } = req.body;
  db.run(
    `UPDATE study_planner SET completed = ? WHERE id = ? AND student_id = ?`,
    [completed ? 1 : 0, req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const xpReward = completed ? 30 : 0;
      awardXP(req.user.id, xpReward, () => {
        if (completed) {
          db.get(`SELECT COUNT(*) as count FROM study_planner WHERE student_id = ? AND completed = 1`, [req.user.id], (err, row) => {
            if (!err && row && row.count >= 5) {
              unlockBadge(req.user.id, 'Organized Learner', 'academic');
            }
          });
        }
        res.json({ success: true });
      });
    }
  );
});

app.delete('/api/study-planner/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM study_planner WHERE id = ? AND student_id = ?`, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/study-planner/generate-ai', authenticateToken, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    // Local fallback planning
    const offlinePlans = [
      { title: 'Physics Revision: Mechanics', date: today, time: '16:00', duration_minutes: 45, subject: 'Physics' },
      { title: 'Mathematics practice questions', date: today, time: '18:00', duration_minutes: 60, subject: 'Mathematics' },
      { title: 'Biology reading: Chapter 4', date: today, time: '15:00', duration_minutes: 30, subject: 'Biology' }
    ];

    const stmt = db.prepare(`INSERT INTO study_planner (student_id, title, date, time, duration_minutes, subject, completed, created_by) VALUES (?, ?, ?, ?, ?, ?, 0, 'ai')`);
    offlinePlans.forEach(p => stmt.run([req.user.id, p.title, p.date, p.time, p.duration_minutes, p.subject]));
    stmt.finalize();

    awardXP(req.user.id, 50, () => {
      res.json({ success: true, message: 'AI study schedule generated offline!' });
    });
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const promptText = `Generate a weekly study schedule for a student. Return a JSON array of event objects, each having exactly these fields: "title" (e.g. "Math: Integration Problems"), "date" (YYYY-MM-DD format), "time" (HH:MM format), "duration_minutes" (integer), and "subject". Provide exactly 5 events spread over the next 7 days starting from today (${today}). Output raw JSON array only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) throw new Error('Failed to generate study planner schedule via Gemini');
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();

    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    const events = JSON.parse(text);
    if (!Array.isArray(events)) throw new Error('Gemini response is not a valid array');

    const stmt = db.prepare(`INSERT INTO study_planner (student_id, title, date, time, duration_minutes, subject, completed, created_by) VALUES (?, ?, ?, ?, ?, ?, 0, 'ai')`);
    events.forEach(p => stmt.run([req.user.id, p.title || 'Study Session', p.date || today, p.time || '17:00', p.duration_minutes || 45, p.subject || 'General']));
    stmt.finalize();

    awardXP(req.user.id, 50, () => {
      res.json({ success: true, message: 'AI weekly schedule generated successfully!' });
    });
  } catch (err) {
    console.error('[AI PLANNER ERROR]', err);
    res.status(500).json({ error: 'Failed to generate AI study plan.' });
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

// Update Profile Preferences (Notification toggles & Language)
app.put('/api/users/profile/preferences', authenticateToken, (req, res) => {
  const { emailAlerts, smsAlerts, language } = req.body;
  db.run(
    `UPDATE users SET email_alerts = ?, sms_alerts = ?, language = ? WHERE id = ?`,
    [emailAlerts ? 1 : 0, smsAlerts ? 1 : 0, language || 'English', req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, email_alerts: emailAlerts ? 1 : 0, sms_alerts: smsAlerts ? 1 : 0, language: language || 'English' });
    }
  );
});

// Update Profile Password
app.put('/api/users/profile/password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required' });
  
  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], async (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'User not found' });
    
    const match = await bcrypt.compare(currentPassword, row.password);
    if (!match) return res.status(400).json({ error: 'Incorrect current password' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashed, req.user.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      logAction('PASSWORD_CHANGED', `User ID ${req.user.id} updated password`);
      res.json({ success: true });
    });
  });
});

// Direct Database Backup Download
app.get('/api/admin/backup/download', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const dbFile = path.resolve(__dirname, 'aarambh.db');
  res.download(dbFile, 'aarambh_backup.db', (err) => {
    if (err) {
      console.error('Backup download error:', err);
      res.status(500).send('Failed to download backup database.');
    } else {
      logAction('BACKUP_DOWNLOADED', 'Admin downloaded SQLite database backup file directly.');
    }
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
      return res.status(200).json({ 
        success: false, 
        error: 'Email service is offline or unverified. You can download the backup file directly.', 
        downloadUrl: '/admin/backup/download' 
      });
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
      res.status(200).json({ 
        success: false, 
        error: 'SMTP Email dispatch failed (' + e.message + '). Direct download is available below.', 
        downloadUrl: '/admin/backup/download' 
      });
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
            return res.status(200).json({ 
              success: false, 
              error: 'Email service is offline or unverified. Previewing report content below.', 
              reportHtml 
            });
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
            res.json({ success: true, previewUrl, reportHtml });
          } catch(e) {
            console.error(e);
            res.status(200).json({ 
              success: false, 
              error: 'SMTP Email dispatch failed (' + e.message + '). Previewing report content below.', 
              reportHtml 
            });
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

// --- QUIZ & MOCK TEST PORTAL ENDPOINTS ---

// Get all quizzes
app.get('/api/quizzes', authenticateToken, (req, res) => {
  if (req.user.role === 'student') {
    db.get(`SELECT className FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err || !user) return res.status(500).json({ error: 'Failed to retrieve user class' });
      const studentClass = user.className || 'General';
      db.all(
        `SELECT * FROM quizzes WHERE class_name = ? OR class_name = 'All' ORDER BY id DESC`,
        [studentClass],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows);
        }
      );
    });
  } else {
    db.all(`SELECT * FROM quizzes ORDER BY id DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

// Get quiz questions
app.get('/api/quizzes/:id/questions', authenticateToken, (req, res) => {
  const quizId = parseInt(req.params.id);
  const isStudent = req.user.role === 'student';
  
  const columns = isStudent 
    ? `id, quiz_id, question_text, option_a, option_b, option_c, option_d` 
    : `id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option`;

  db.all(
    `SELECT ${columns} FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC`,
    [quizId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const mapped = rows.map(r => ({
        id: r.id,
        quizId: r.quiz_id,
        questionText: r.question_text,
        optionA: r.option_a,
        optionB: r.option_b,
        optionC: r.option_c,
        optionD: r.option_d,
        ...(isStudent ? {} : { correctOption: r.correct_option })
      }));
      res.json(mapped);
    }
  );
});

// Create quiz (Admin/Teacher only)
app.post('/api/quizzes', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const { title, className, subject, durationMinutes, questions } = req.body;

  if (!title || !className || !subject || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Missing required quiz fields or invalid questions array' });
  }

  db.serialize(() => {
    db.run(
      `INSERT INTO quizzes (title, class_name, subject, duration_minutes) VALUES (?, ?, ?, ?)`,
      [title, className, subject, durationMinutes || 30],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const quizId = this.lastID;

        const stmt = db.prepare(
          `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        questions.forEach(q => {
          stmt.run([quizId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption]);
        });

        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: err.message });
          logAction('QUIZ_CREATED', `Quiz "${title}" created for batch ${className}`);
          res.json({ success: true, quizId, title });
        });
      }
    );
  });
});

// Delete quiz (Admin/Teacher only)
app.delete('/api/quizzes/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const quizId = parseInt(req.params.id);

  db.serialize(() => {
    db.run(`DELETE FROM quiz_questions WHERE quiz_id = ?`, [quizId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(`DELETE FROM quizzes WHERE id = ?`, [quizId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run(`DELETE FROM quiz_attempts WHERE quiz_id = ?`, [quizId], (err) => {
          logAction('QUIZ_DELETED', `Deleted quiz ID ${quizId}`);
          res.json({ success: true, message: 'Quiz deleted successfully' });
        });
      });
    });
  });
});

// Submit quiz answers (Student only)
app.post('/api/quizzes/:id/submit', authenticateToken, (req, res) => {
  const quizId = parseInt(req.params.id);
  const studentId = req.user.id;
  const { answers } = req.body;

  if (!answers) return res.status(400).json({ error: 'Missing answers object' });

  db.all(`SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ?`, [quizId], (err, questions) => {
    if (err) return res.status(500).json({ error: err.message });
    if (questions.length === 0) return res.status(400).json({ error: 'Quiz contains no questions' });

    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach(q => {
      const studentAnswer = answers[q.id.toString()];
      if (studentAnswer === q.correct_option) {
        score++;
      }
    });

    db.run(
      `INSERT INTO quiz_attempts (quiz_id, student_id, score, total_questions) VALUES (?, ?, ?, ?)`,
      [quizId, studentId, score, totalQuestions],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        logAction('QUIZ_ATTEMPT', `Student ID ${studentId} completed quiz ID ${quizId} with score ${score}/${totalQuestions}`);
        
        awardXP(studentId, 100, () => {
          if (score === totalQuestions) {
            unlockBadge(studentId, 'Perfect Score', 'academic', () => {
              res.json({ success: true, attemptId: this.lastID, score, totalQuestions });
            });
          } else {
            res.json({ success: true, attemptId: this.lastID, score, totalQuestions });
          }
        });
      }
    );
  });
});

// Get quiz attempts
app.get('/api/quizzes-attempts', authenticateToken, (req, res) => {
  if (req.user.role === 'student') {
    db.all(
      `SELECT quiz_attempts.*, quizzes.title, quizzes.subject, quizzes.duration_minutes
       FROM quiz_attempts 
       JOIN quizzes ON quiz_attempts.quiz_id = quizzes.id 
       WHERE quiz_attempts.student_id = ? 
       ORDER BY quiz_attempts.id DESC`,
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const mapped = rows.map(r => ({
          id: r.id,
          quizId: r.quiz_id,
          studentId: r.student_id,
          score: r.score,
          totalQuestions: r.total_questions,
          attemptDate: r.attempt_date,
          quizTitle: r.title,
          quizSubject: r.subject,
          quizDuration: r.duration_minutes
        }));
        res.json(mapped);
      }
    );
  } else {
    db.all(
      `SELECT quiz_attempts.*, quizzes.title, quizzes.subject, users.name as student_name, users.className as student_class
       FROM quiz_attempts 
       JOIN quizzes ON quiz_attempts.quiz_id = quizzes.id 
       JOIN users ON quiz_attempts.student_id = users.id 
       ORDER BY quiz_attempts.id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const mapped = rows.map(r => ({
          id: r.id,
          quizId: r.quiz_id,
          studentId: r.student_id,
          score: r.score,
          totalQuestions: r.total_questions,
          attemptDate: r.attempt_date,
          quizTitle: r.title,
          quizSubject: r.subject,
          studentName: r.student_name,
          studentClass: r.student_class
        }));
        res.json(mapped);
      }
    );
  }
});

// --- SYLLABUS & LESSON PROGRESS TRACKER ENDPOINTS ---

// Get all syllabus items
app.get('/api/syllabus', authenticateToken, (req, res) => {
  if (req.user.role === 'student') {
    db.get(`SELECT className FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err || !user) return res.status(500).json({ error: 'Failed to retrieve student batch' });
      const studentClass = user.className || 'General';
      db.all(
        `SELECT * FROM syllabus_tracker WHERE class_name = ? OR class_name = 'All' ORDER BY id ASC`,
        [studentClass],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows);
        }
      );
    });
  } else {
    // Admin/Teacher see all syllabus items
    db.all(`SELECT * FROM syllabus_tracker ORDER BY id DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

// Create new syllabus topic (Admin/Teacher only)
app.post('/api/syllabus', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const { className, subject, topicName } = req.body;

  if (!className || !subject || !topicName) {
    return res.status(400).json({ error: 'className, subject, and topicName are required' });
  }

  db.run(
    `INSERT INTO syllabus_tracker (class_name, subject, topic_name) VALUES (?, ?, ?)`,
    [className, subject, topicName],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAction('SYLLABUS_CREATED', `Topic "${topicName}" added for class ${className}`);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update syllabus topic status (Admin/Teacher only)
app.put('/api/syllabus/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const topicId = parseInt(req.params.id);
  const { status } = req.body; // 'Not Started', 'In Progress', 'Completed'

  if (!status) return res.status(400).json({ error: 'Status is required' });

  db.run(
    `UPDATE syllabus_tracker SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, topicId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAction('SYLLABUS_UPDATED', `Syllabus topic ID ${topicId} status updated to ${status}`);
      res.json({ success: true });
    }
  );
});

// Delete syllabus topic (Admin/Teacher only)
app.delete('/api/syllabus/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'student') return res.sendStatus(403);
  const topicId = parseInt(req.params.id);

  db.run(`DELETE FROM syllabus_tracker WHERE id = ?`, [topicId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    logAction('SYLLABUS_DELETED', `Deleted syllabus topic ID ${topicId}`);
    res.json({ success: true });
  });
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
