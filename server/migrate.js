const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'aarambh.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error(err);
  console.log('Connected to DB for migration');
  
  db.serialize(() => {
    // Add column if it doesn't exist
    db.run(`ALTER TABLE users ADD COLUMN admission_number TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column:', err.message);
      } else {
        console.log('Added admission_number column or it already exists.');
      }
      
      // Auto-assign existing IDs
      db.all(`SELECT id, role FROM users WHERE admission_number IS NULL OR admission_number = ''`, [], (err, rows) => {
        if (err) return console.error(err);
        
        let sCount = 1;
        let tCount = 1;
        
        db.serialize(() => {
          const stmt = db.prepare(`UPDATE users SET admission_number = ? WHERE id = ?`);
          for (const row of rows) {
            let admissionNumber = '';
            if (row.role === 'student') {
              admissionNumber = `AES${sCount++}`;
            } else if (row.role === 'teacher') {
              admissionNumber = `AET${tCount++}`;
            } else {
              admissionNumber = `ADM${row.id}`;
            }
            stmt.run(admissionNumber, row.id);
          }
          stmt.finalize();
          console.log(`Migrated ${rows.length} existing users with AES/AET IDs.`);
        });
      });
    });
  });
});
