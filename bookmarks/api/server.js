require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, username });
    });
  } catch (err) {
    res.status(500).json({ error: 'Error hashing password' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  });
});

// --- Bookmark Routes ---

// Get all bookmarks for user
app.get('/bookmarks', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM bookmarks WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Add single or bulk bookmarks
app.post('/bookmarks', authenticateToken, (req, res) => {
  const data = req.body;
  
  if (Array.isArray(data)) {
    // Bulk insert
    if (data.length === 0) return res.status(400).json({ error: 'Empty array' });
    
    const stmt = db.prepare(`INSERT INTO bookmarks (user_id, url, title, description) VALUES (?, ?, ?, ?)`);
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      data.forEach(bm => {
        stmt.run(req.user.id, bm.url, bm.title || null, bm.description || null);
      });
      db.run('COMMIT', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to insert bookmarks' });
        res.status(201).json({ message: 'Bookmarks added successfully' });
      });
      stmt.finalize();
    });
  } else {
    // Single insert
    const { url, title, description } = data;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    db.run(`INSERT INTO bookmarks (user_id, url, title, description) VALUES (?, ?, ?, ?)`, 
      [req.user.id, url, title || null, description || null], 
      function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ id: this.lastID, url, title, description });
      }
    );
  }
});

// Delete bookmark
app.delete('/bookmarks/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM bookmarks WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Bookmark not found' });
    res.json({ message: 'Bookmark deleted' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
