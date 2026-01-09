// server.js (orcus)
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DATABASE_FILE || './data/orcus.sqlite';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'troque_esta_senha';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'troque_este_segredo';
const INTERSTITIAL_SECONDS = Number(process.env.INTERSTITIAL_SECONDS || 5);
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 50);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(rateLimit({ windowMs: 60*1000, max: 120 }));

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now().toString(36) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

let db;
async function initDb(){
  db = await open({ filename: DB_FILE, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      description TEXT,
      tags TEXT,
      link TEXT,
      file TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip TEXT,
      ua TEXT,
      referrer TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function requireAdmin(req, res, next){
  const authHeader = req.headers.authorization;
  let token = null;
  if(authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  else if (req.query && req.query.token) token = req.query.token;
  if(!token) return res.status(401).json({ error: 'unauthorized' });
  try{ jwt.verify(token, JWT_SECRET); next(); } catch(e){ return res.status(401).json({ error: 'invalid token' }); }
}

// create via JSON (external link)
app.post('/api/books', async (req, res) => {
  const { title, author, description, tags, link } = req.body;
  if(!title) return res.status(400).json({ error: 'missing title' });
  const result = await db.run('INSERT INTO books (title, author, description, tags, link, is_approved) VALUES (?, ?, ?, ?, ?, 1)', title, author||'', description||'', tags||'', link||'');
  res.json({ id: result.lastID });
});

// upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'no file' });
  const { title, author, description, tags } = req.body;
  const result = await db.run('INSERT INTO books (title, author, description, tags, file, is_approved) VALUES (?, ?, ?, ?, ?, 1)', title || req.file.originalname, author||'', description||'', tags||'', req.file.filename);
  res.json({ id: result.lastID, file: req.file.filename });
});

// search
app.get('/api/books', async (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;
  if(q) {
    const like = '%' + q.replace(/%/g,'') + '%';
    rows = await db.all('SELECT id, title, author, description, tags, file, link FROM books WHERE (title LIKE ? OR author LIKE ? OR tags LIKE ?) AND is_approved=1 ORDER BY created_at DESC LIMIT 100', like, like, like);
  } else {
    rows = await db.all('SELECT id, title, author, description, tags, file, link FROM books WHERE is_approved=1 ORDER BY created_at DESC LIMIT 50');
  }
  res.json(rows);
});

// details
app.get('/api/books/:id', async (req, res) => {
  const row = await db.get('SELECT * FROM books WHERE id = ?', req.params.id);
  if(!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

// download (logs + serve/redirect)
app.get('/api/download/:id', async (req, res) => {
  const book = await db.get('SELECT * FROM books WHERE id = ?', req.params.id);
  if(!book) return res.status(404).json({ error: 'not found' });
  const ip = (req.ip || '').slice(0,45);
  await db.run('INSERT INTO downloads (book_id, ip, ua, referrer) VALUES (?, ?, ?, ?)', book.id, ip, req.get('User-Agent')||'', req.get('Referer')||'');
  if(book.file){
    const filePath = path.join(UPLOAD_DIR, book.file);
    return res.download(filePath, book.title + path.extname(book.file));
  } else if(book.link){
    return res.redirect(book.link);
  } else return res.status(400).json({ error: 'no file or link' });
});

// admin login (returns token)
app.post('/api/admin/login', express.json(), (req, res) => {
  const pw = (req.body && req.body.password) || '';
  if(pw !== ADMIN_PW) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// ad script settings
app.post('/api/admin/settings/adscript', express.json(), requireAdmin, async (req, res) => {
  const script = req.body.adScript || '';
  await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'ad_script', script);
  res.json({ ok: true });
});
app.get('/api/admin/settings/adscript', async (req, res) => {
  const row = await db.get('SELECT value FROM settings WHERE key = ?', 'ad_script');
  res.json({ adScript: row ? row.value : '' });
});

app.get('/i/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'interstitial.html'));
});

app.get('/health', (req,res) => res.json({ ok: true }));

initDb().then(() => app.listen(PORT, () => console.log('Orcus listening on', PORT))).catch(err => { console.error(err); process.exit(1); });
