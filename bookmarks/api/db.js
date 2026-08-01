const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bookmarks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    // Create Bookmarks table
    db.run(`CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Create Tags table (tag names are unique per user)
    db.run(`CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Join table linking bookmarks to tags (many-to-many)
    db.run(`CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (bookmark_id, tag_id),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks (id),
      FOREIGN KEY (tag_id) REFERENCES tags (id)
    )`);
  }
});

// Promise-based helpers for the routes that need to await multiple
// sequential queries (tag upsert + linking). node-sqlite3's callback
// style doesn't compose well with async/await on its own, and its
// `run` callback carries lastID/changes on `this`, not as a callback
// argument, so a plain util.promisify wouldn't capture them.
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

db.runAsync = runAsync;
db.allAsync = allAsync;
db.getAsync = getAsync;

module.exports = db;
