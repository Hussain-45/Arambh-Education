const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'aarambh.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Tables
    db.serialize(() => {
      // Users Table (Admin, Teacher, Student)
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        parentPhone TEXT,
        className TEXT,
        admission_number TEXT,
        email TEXT,
        fatherName TEXT,
        birthdate TEXT,
        phone TEXT,
        motherName TEXT,
        gender TEXT,
        bloodGroup TEXT,
        address TEXT,
        discountPercent INTEGER DEFAULT 0,
        registrationDate TEXT,
        salary INTEGER DEFAULT 0,
        specialization TEXT,
        login_approved INTEGER DEFAULT 1
      )`);

      // Migration: Ensure all columns exist on users table
      const userCols = [
        'email TEXT', 'fatherName TEXT', 'birthdate TEXT', 'phone TEXT', 'motherName TEXT',
        'gender TEXT', 'bloodGroup TEXT', 'address TEXT', 'discountPercent INTEGER DEFAULT 0',
        'registrationDate TEXT', 'salary INTEGER DEFAULT 0', 'specialization TEXT',
        'email_alerts INTEGER DEFAULT 1', 'sms_alerts INTEGER DEFAULT 0', 'language TEXT DEFAULT \'English\'',
        'login_approved INTEGER DEFAULT 1'
      ];
      userCols.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col}`, (err) => {
          // Ignore error if column already exists
        });
      });

      // Classes Table
      db.run(`CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        grade TEXT,
        time TEXT,
        monthlyFee INTEGER DEFAULT 0
      )`);

      // Migration: Ensure monthlyFee column exists on classes table
      db.run(`ALTER TABLE classes ADD COLUMN monthlyFee INTEGER DEFAULT 0`, (err) => {
        // Ignore error if column already exists
      });

      // Teacher Assigned Classes
      db.run(`CREATE TABLE IF NOT EXISTS teacher_classes (
        teacher_id INTEGER,
        class_name TEXT,
        FOREIGN KEY(teacher_id) REFERENCES users(id),
        FOREIGN KEY(class_name) REFERENCES classes(name)
      )`);

      // Fees Table
      db.run(`CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        total INTEGER DEFAULT 0,
        paid INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        due_date TEXT,
        month TEXT,
        payment_mode TEXT DEFAULT 'Cash',
        payment_date TEXT,
        FOREIGN KEY(student_id) REFERENCES users(id)
      )`);

      // Migration: Add columns if not exists
      db.run(`ALTER TABLE fees ADD COLUMN month TEXT`, (err) => {});
      db.run(`ALTER TABLE fees ADD COLUMN payment_mode TEXT DEFAULT 'Cash'`, (err) => {});
      db.run(`ALTER TABLE fees ADD COLUMN payment_date TEXT`, (err) => {});
      db.run(`ALTER TABLE fees ADD COLUMN upi_transaction_id TEXT`, (err) => {});
      db.run(`ALTER TABLE fees ADD COLUMN upi_payment_status TEXT`, (err) => {});
      db.run(`ALTER TABLE fees ADD COLUMN upi_payment_notes TEXT`, (err) => {});

      // Attendance Table
      db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES users(id)
      )`);

      // Assignments Table
      db.run(`CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        due_date TEXT,
        link TEXT,
        type TEXT
      )`);

      // Migration: Add columns if not exists
      db.run(`ALTER TABLE assignments ADD COLUMN link TEXT`, (err) => {});
      db.run(`ALTER TABLE assignments ADD COLUMN type TEXT`, (err) => {});

      // Library Table
      db.run(`CREATE TABLE IF NOT EXISTS library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        type TEXT NOT NULL,
        link TEXT
      )`);

      // Registration Requests Table
      db.run(`CREATE TABLE IF NOT EXISTS registration_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        name TEXT,
        username TEXT,
        password TEXT NOT NULL,
        parentPhone TEXT,
        className TEXT,
        admission_number TEXT,
        fees INTEGER,
        status TEXT DEFAULT 'pending',
        fatherName TEXT,
        email TEXT,
        birthdate TEXT
      )`);

      // Migration: Add fatherName to registration_requests if not exists
      db.run(`ALTER TABLE registration_requests ADD COLUMN fatherName TEXT`, (err) => {
        // Ignore error if column already exists
      });
      db.run(`ALTER TABLE registration_requests ADD COLUMN email TEXT`, (err) => {
        // Ignore error if column already exists
      });
      db.run(`ALTER TABLE registration_requests ADD COLUMN birthdate TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Audit Logs Table (History)
      db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Expenses Table (Profit & Loss)
      db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL
      )`);

      // Announcements Table
      db.run(`CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        target_class TEXT DEFAULT 'All',
        date TEXT NOT NULL
      )`);

      // Doubt Tickets Table
      db.run(`CREATE TABLE IF NOT EXISTS doubt_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        student_name TEXT NOT NULL,
        student_class TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        timestamp TEXT NOT NULL,
        reply TEXT,
        FOREIGN KEY(student_id) REFERENCES users(id)
      )`);

      // System Settings Table
      db.run(`CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`);

      // Submissions Table
      db.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        link TEXT,
        text TEXT,
        file_path TEXT,
        status TEXT DEFAULT 'Submitted',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        grade TEXT,
        feedback TEXT,
        FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Calendar Events Table
      db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        type TEXT NOT NULL,
        description TEXT
      )`);

      // Quizzes Table
      db.run(`CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        class_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Quiz Questions Table
      db.run(`CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL,
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )`);

      // Quiz Attempts Table
      db.run(`CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Syllabus Tracker Table
      db.run(`CREATE TABLE IF NOT EXISTS syllabus_tracker (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic_name TEXT NOT NULL,
        status TEXT DEFAULT 'Not Started',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Gamification columns & tables
      db.run(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`, (err) => {
        // Ignore error if column already exists
      });

      db.run(`CREATE TABLE IF NOT EXISTS student_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        badge_name TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Flashcards tables
      db.run(`CREATE TABLE IF NOT EXISTS flashcard_decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        interval INTEGER DEFAULT 1,
        ease_factor REAL DEFAULT 2.5,
        repetitions INTEGER DEFAULT 0,
        next_review_date TEXT,
        FOREIGN KEY(deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
      )`);

      // Study Planner table
      db.run(`CREATE TABLE IF NOT EXISTS study_planner (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        duration_minutes INTEGER DEFAULT 30,
        subject TEXT,
        completed INTEGER DEFAULT 0,
        created_by TEXT DEFAULT 'user',
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Batch classroom discussion messages table
      db.run(`CREATE TABLE IF NOT EXISTS batch_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Seed a default admin if no users exist
      db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
        if (!err && row && row.count === 0) {
          const bcrypt = require('bcrypt');
          bcrypt.hash('pass', 10, (err, hash) => {
            if (!err) {
              db.run(`INSERT INTO users (name, username, password, role, email) VALUES (?, ?, ?, ?, ?)`,
                ['System Admin', 'admin', hash, 'admin', 'admin@aarambh.edu'],
                (err) => {
                  if (err) console.error('Error seeding default admin:', err.message);
                  else console.log('Default admin seeded successfully (admin / pass).');
                }
              );
            }
          });
        }
      });

      console.log('Database schema ensured.');
    });
  }
});

module.exports = db;
