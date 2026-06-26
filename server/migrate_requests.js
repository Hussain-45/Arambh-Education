const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'aarambh.db'));
db.serialize(() => {
  db.run(`ALTER TABLE registration_requests ADD COLUMN admission_number TEXT`, (err) => {
    if (err) console.log(err.message);
  });
  db.run(`ALTER TABLE registration_requests ADD COLUMN fees INTEGER`, (err) => {
    if (err) console.log(err.message);
  });
});
