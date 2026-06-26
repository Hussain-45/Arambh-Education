const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'aarambh.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all(`SELECT id, password FROM users`, async (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(`Found ${rows.length} users. Migrating passwords...`);
    let migratedCount = 0;

    for (const row of rows) {
      // Check if it's already a bcrypt hash (starts with $2b$ or $2a$)
      if (row.password.startsWith('$2b$') || row.password.startsWith('$2a$')) {
        console.log(`User ID ${row.id} already has a hashed password. Skipping.`);
        migratedCount++;
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(row.password, 10);
        db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, row.id], (err) => {
          if (err) console.error(`Error updating User ID ${row.id}:`, err);
        });
        migratedCount++;
      } catch (e) {
        console.error(`Failed to hash password for User ID ${row.id}:`, e);
      }
    }
    
    // Wait for async db ops to complete (dirty timeout)
    setTimeout(() => {
      console.log(`Password migration complete. Migrated ${migratedCount} users.`);
      db.close();
      process.exit(0);
    }, 2000);
  });
});
