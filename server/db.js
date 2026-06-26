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
        admission_number TEXT
      )`);

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
        FOREIGN KEY(student_id) REFERENCES users(id)
      )`);

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
        status TEXT DEFAULT 'pending'
      )`);

      console.log('Database schema ensured.');
    });
  }
});

module.exports = db;
