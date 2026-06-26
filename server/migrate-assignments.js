const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'aarambh.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }

  console.log('Running assignments migration...');

  db.serialize(() => {
    db.run(`ALTER TABLE assignments ADD COLUMN link TEXT`, (err) => {
      if (err) console.log('Column link might already exist:', err.message);
      else console.log('Added link column');
    });
    db.run(`ALTER TABLE assignments ADD COLUMN type TEXT`, (err) => {
      if (err) console.log('Column type might already exist:', err.message);
      else console.log('Added type column');
    });
  });

  setTimeout(() => {
    console.log('Migration finished.');
    process.exit(0);
  }, 1000);
});
