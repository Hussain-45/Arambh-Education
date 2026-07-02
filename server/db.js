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
        fatherName TEXT
      )`);

      // Migration: Add email & fatherName columns if not exists
      db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => {
        // Ignore error if column already exists
      });
      db.run(`ALTER TABLE users ADD COLUMN fatherName TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Classes Table
      db.run(`CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        grade TEXT,
        time TEXT
      )`);

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
        FOREIGN KEY(student_id) REFERENCES users(id)
      )`);

      // Migration: Add month column if not exists
      db.run(`ALTER TABLE fees ADD COLUMN month TEXT`, (err) => {
        // Ignore error if column already exists
      });

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
        due_date TEXT
      )`);

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
        email TEXT
      )`);

      // Migration: Add fatherName to registration_requests if not exists
      db.run(`ALTER TABLE registration_requests ADD COLUMN fatherName TEXT`, (err) => {
        // Ignore error if column already exists
      });
      db.run(`ALTER TABLE registration_requests ADD COLUMN email TEXT`, (err) => {
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

      // System Settings Table
      db.run(`CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`);

      console.log('Database schema ensured.');
    });
  }
});

module.exports = db;
