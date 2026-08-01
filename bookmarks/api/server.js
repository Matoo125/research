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

// --- Tag helpers ---

// Normalizes tag names, upserts them for the user, and returns the
// resulting {id, name} rows. Case-insensitive (stored lowercase) so
// "JS" and "js" collapse to one tag.
async function getOrCreateTags(userId, tagNames) {
  const names = [...new Set(
    (tagNames || [])
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean)
  )];
  const tags = [];
  for (const name of names) {
    await db.runAsync(`INSERT OR IGNORE INTO tags (user_id, name) VALUES (?, ?)`, [userId, name]);
    const row = await db.getAsync(`SELECT id, name FROM tags WHERE user_id = ? AND name = ?`, [userId, name]);
    tags.push(row);
  }
  return tags;
}

async function attachTags(bookmarkId, tagIds) {
  for (const tagId of tagIds) {
    await db.runAsync(`INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)`, [bookmarkId, tagId]);
  }
}

// --- Bookmark Routes ---

// Get all bookmarks for user, optionally filtered to those carrying ?tag=
app.get('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const { tag } = req.query;
    let sql = `
      SELECT b.*, GROUP_CONCAT(t.name) AS tag_names
      FROM bookmarks b
      LEFT JOIN bookmark_tags bt ON bt.bookmark_id = b.id
      LEFT JOIN tags t ON t.id = bt.tag_id
      WHERE b.user_id = ?
    `;
    const params = [req.user.id];
    if (tag) {
      sql += ` AND b.id IN (
        SELECT bt2.bookmark_id FROM bookmark_tags bt2
        JOIN tags t2 ON t2.id = bt2.tag_id
        WHERE t2.user_id = ? AND t2.name = ?
      )`;
      params.push(req.user.id, String(tag).trim().toLowerCase());
    }
    sql += ` GROUP BY b.id ORDER BY b.id DESC`;

    const rows = await db.allAsync(sql, params);
    const bookmarks = rows.map(({ tag_names, ...bm }) => ({
      ...bm,
      tags: tag_names ? tag_names.split(',') : [],
    }));
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// List all distinct tags for the user, with usage counts
app.get('/tags', authenticateToken, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT t.name, COUNT(bt.bookmark_id) AS count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE t.user_id = ?
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Add single or bulk bookmarks
app.post('/bookmarks', authenticateToken, async (req, res) => {
  const data = req.body;

  try {
    if (Array.isArray(data)) {
      // Bulk insert
      if (data.length === 0) return res.status(400).json({ error: 'Empty array' });

      await db.runAsync('BEGIN TRANSACTION');
      try {
        for (const bm of data) {
          if (!bm.url) continue;
          const { lastID } = await db.runAsync(
            `INSERT INTO bookmarks (user_id, url, title, description) VALUES (?, ?, ?, ?)`,
            [req.user.id, bm.url, bm.title || null, bm.description || null]
          );
          const tags = await getOrCreateTags(req.user.id, bm.tags);
          await attachTags(lastID, tags.map((t) => t.id));
        }
        await db.runAsync('COMMIT');
      } catch (err) {
        await db.runAsync('ROLLBACK');
        throw err;
      }
      res.status(201).json({ message: 'Bookmarks added successfully' });
    } else {
      // Single insert
      const { url, title, description, tags: tagNames } = data;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      const { lastID } = await db.runAsync(
        `INSERT INTO bookmarks (user_id, url, title, description) VALUES (?, ?, ?, ?)`,
        [req.user.id, url, title || null, description || null]
      );
      const tags = await getOrCreateTags(req.user.id, tagNames);
      await attachTags(lastID, tags.map((t) => t.id));

      res.status(201).json({ id: lastID, url, title, description, tags: tags.map((t) => t.name) });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete bookmark
app.delete('/bookmarks/:id', authenticateToken, async (req, res) => {
  try {
    const { changes } = await db.runAsync(
      `DELETE FROM bookmarks WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (changes === 0) return res.status(404).json({ error: 'Bookmark not found' });
    await db.runAsync(`DELETE FROM bookmark_tags WHERE bookmark_id = ?`, [req.params.id]);
    res.json({ message: 'Bookmark deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
