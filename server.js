const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  initDb,
  characterQueries, skillQueries, weaponQueries,
  possessionQueries, diceQueries, configQueries, evidenceQueries,
  npcQueries, weaponCatalogQueries, sessionQueries,
  sessionLogQueries, annotationQueries, authQueries,
  DEFAULT_CONFIG,
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── JWT ──────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || randomUUID();
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Token invalido ou expirado' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* ignore */ }
  }
  next();
}

// ─── Books directory (serverless-safe) ────────────────────────
// In serverless (/var/task is read-only), use /tmp or a configurable path
const BOOKS_DIR = process.env.BOOKS_PATH || (() => {
  try {
    const p = path.join(__dirname, 'books');
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    return p;
  } catch {
    fs.mkdirSync('/tmp/books', { recursive: true });
    return '/tmp/books';
  }
})();

const DATA_DIR = (() => {
  try {
    const p = path.join(__dirname, 'data');
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    return p;
  } catch {
    fs.mkdirSync('/tmp/data', { recursive: true });
    return '/tmp/data';
  }
})();

const SHARES_DIR = path.join(DATA_DIR, 'shares');
if (!fs.existsSync(SHARES_DIR)) try { fs.mkdirSync(SHARES_DIR, { recursive: true }); } catch { /* sqlite data dir is created by db init */ }

const bookStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, BOOKS_DIR),
  filename: (_, file, cb) => {
    const safe = Buffer.from(file.originalname, 'latin1').toString('utf8')
      .replace(/[^a-zA-Z0-9._\-\u00C0-\u024F ]/g, '_');
    cb(null, safe);
  },
});
const bookUpload = multer({
  storage: bookStorage,
  fileFilter: (_, file, cb) => cb(null, file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')),
  limits: { fileSize: 150 * 1024 * 1024 },
});

app.use(express.json({ limit: '10mb' }));

// Serve static with error handling for serverless paths
try {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/books', express.static(BOOKS_DIR, { dotfiles: 'deny' }));
  app.use('/pdfjs', express.static(path.join(__dirname, 'public', 'pdfjs')));
  app.use('/build', express.static(path.join(__dirname, 'public', 'pdfjs', 'build')));
} catch { /* ignore static errors in serverless */ }

// ─── Auth ────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, is_master } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username e password obrigatorios' });
    if (password.length < 4) return res.status(400).json({ error: 'Senha deve ter no minimo 4 caracteres' });
    const result = await authQueries.register(username.toLowerCase().trim(), password);
    if (result.error) return res.status(400).json({ error: result.error });

    const userId = result.id;
    if (is_master) await authQueries.setMaster(userId, true);

    const token = jwt.sign({ userId: result.id, username: result.username, is_master: !!result.is_master }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.status(201).json({ token, user: { id: result.id, username: result.username, is_master: !!result.is_master } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username e password obrigatorios' });
    const user = await authQueries.login(username.toLowerCase().trim(), password);
    if (!user) return res.status(401).json({ error: 'Credenciais invalidas' });
    const token = jwt.sign({ userId: user.id, username: user.username, is_master: !!user.is_master }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token, user: { id: user.id, username: user.username, is_master: !!user.is_master } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await authQueries.getById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/users', authenticateToken, async (req, res) => {
  // Only masters can list all users
  if (!req.user.is_master) return res.status(403).json({ error: 'Apenas mestres podem ver usuarios' });
  try {
    // For now return friends as "users"
    const friends = await characterQueries.listFriends();
    res.json({ users: friends });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Session Sharing ─────────────────────────────────────────

// Master creates/gets share token for an active session
app.post('/api/sessions/:id/share', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_master) return res.status(403).json({ error: 'Apenas mestres podem compartilhar sessoes' });
    const session = await sessionQueries.getById(+req.params.id);
    if (!session) return res.status(404).json({ error: 'Sessao nao encontrada' });

    let token = session.share_token;
    if (!token) {
      token = await sessionQueries.generateShareToken(+req.params.id);
    }
    const shareUrl = `${req.protocol}://${req.get('host')}/s/${token}`;
    res.json({ share_token: token, share_url: shareUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public: join session via share token
app.get('/api/session/join/:token', optionalAuth, async (req, res) => {
  try {
    const session = await sessionQueries.getByShareToken(req.params.token);
    if (!session) return res.status(404).json({ error: 'Sessao nao encontrada ou expirada' });

    // Get characters in this session
    const sessionChars = await characterQueries.listBySessionToken(req.params.token);
    const detailChars = await Promise.all(sessionChars.map(c => characterQueries.getById(c.id)));

    res.json({
      session: {
        id: session.id,
        name: session.name,
        notes: session.notes,
        share_token: session.share_token,
      },
      characters: detailChars,
      // If the joining user is logged in and has a character, they're already in session
      // Otherwise they need to create one joined to the session
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create a character as a friend, joined to session
app.post('/api/session/join/:token/character', async (req, res) => {
  try {
    const session = await sessionQueries.getByShareToken(req.params.token);
    if (!session) return res.status(404).json({ error: 'Sessao nao encontrada ou expirada' });
    const id = await characterQueries.create({ ...req.body, is_friend: true, session_token: req.params.token });
    const c = await characterQueries.getById(id);
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Master sees active session with all players
app.get('/api/sessions/active/players', authenticateToken, async (req, res) => {
  try {
    const active = await sessionQueries.getActive();
    if (!active) return res.status(404).json({ error: 'Nenhuma sessao ativa' });

    const shareToken = active.share_token;
    const chars = shareToken ? await characterQueries.listBySessionToken(shareToken) : [];
    const detailChars = await Promise.all(chars.map(c => characterQueries.getById(c.id)));

    res.json({ session: active, players: detailChars });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Master can kick a character from a session
app.delete('/api/session/character/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_master) return res.status(403).json({ error: 'Apenas mestres podem remover jogadores' });
    await characterQueries.update(+req.params.id, { session_token: null, is_friend: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SPA: Serve session join page ─────────────────────────
app.get('/s/:token', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'session-join.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// ─── Personagens ─────────────────────────────────────────────

app.get('/api/characters', async (req, res) => {
  try { res.json(await characterQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/characters/:id', async (req, res) => {
  try {
    const c = await characterQueries.getById(+req.params.id);
    if (!c) return res.status(404).json({ error: 'Personagem nao encontrado' });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/characters', async (req, res) => {
  try {
    const id = await characterQueries.create(req.body);
    const c = await characterQueries.getById(id);
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/characters/:id', async (req, res) => {
  try {
    const id = +req.params.id;
    const data = req.body;
    if (data.dex !== undefined)
      await skillQueries.updateByName(id, 'Dodge', Math.floor(data.dex / 2));
    if (data.edu !== undefined)
      await skillQueries.updateByName(id, 'Language (Own)', data.edu);
    await characterQueries.update(id, data);
    res.json(await characterQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/characters/:id', async (req, res) => {
  try { await characterQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Export / Import ─────────────────────────────────────────

app.get('/api/export/:id', async (req, res) => {
  try {
    const c = await characterQueries.getById(+req.params.id);
    if (!c) return res.status(404).json({ error: 'Personagem nao encontrado' });
    const safeName = (c.name || 'personagem').replace(/[^a-z0-9_\-\s]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ version: 3, exportedAt: new Date().toISOString(), character: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/export-friend/:id', async (req, res) => {
  try {
    const c = await characterQueries.getById(+req.params.id);
    if (!c) return res.status(404).json({ error: 'Personagem nao encontrado' });

    const loreFields = [
      'appearance_desc','ideology','significant_people','meaningful_locations',
      'treasured_possessions','traits','injuries_scars','phobias_manias',
      'arcane_tomes','backstory','notes',
    ];
    const friendChar = { ...c };
    loreFields.forEach(f => delete friendChar[f]);

    const safeName = (c.name || 'personagem').replace(/[^a-z0-9_\-\s]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_amigo.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ version: 3, exportedAt: new Date().toISOString(), isFriendExport: true, character: friendChar });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/import', async (req, res) => {
  try {
    const { character, isFriendExport } = req.body;
    if (!character?.name) return res.status(400).json({ error: 'JSON invalid: campo "character" obrigatorio' });

    const uuid = character.uuid;
    delete character.id;
    delete character.created_at;
    delete character.updated_at;
    if (uuid) character.uuid = uuid;
    if (isFriendExport) character.is_friend = 1;

    const existingByUuid = uuid ? await characterQueries.getByUuid(uuid) : null;
    const id = await characterQueries.import(character);
    const result = await characterQueries.getById(id);
    res.status(201).json({ ...result, wasUpdated: !!existingByUuid, isFriend: !!isFriendExport });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/shares', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload?.character?.name) {
      return res.status(400).json({ error: 'Payload de compartilhamento invalido' });
    }
    const id = randomUUID();
    const filePath = path.join(SHARES_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify({
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    }));
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/shares/:id', async (req, res) => {
  try {
    const safeId = String(req.params.id || '').replace(/[^a-zA-Z0-9-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'ID de compartilhamento invalido' });
    const filePath = path.join(SHARES_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Compartilhamento nao encontrado' });
    }
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Habilidades ─────────────────────────────────────────────

app.put('/api/skills/:id', async (req, res) => {
  try { await skillQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Armas ───────────────────────────────────────────────────

app.post('/api/characters/:id/weapons', async (req, res) => {
  try { res.status(201).json({ id: await weaponQueries.create(+req.params.id) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/weapons/:id', async (req, res) => {
  try { await weaponQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/weapons/:id', async (req, res) => {
  try { await weaponQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Posses ──────────────────────────────────────────────────

app.post('/api/characters/:id/possessions', async (req, res) => {
  try { res.status(201).json({ id: await possessionQueries.create(+req.params.id, req.body.item || '') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/possessions/:id', async (req, res) => {
  try { await possessionQueries.update(+req.params.id, req.body.item); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/possessions/:id', async (req, res) => {
  try { await possessionQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Dados ───────────────────────────────────────────────────

app.post('/api/dice/roll', async (req, res) => {
  try {
    const { expression, characterId, bonus, penalty } = req.body;
    const result = rollDice(expression, bonus || 0, penalty || 0);
    await diceQueries.addHistory(characterId, result.expression, result.total, JSON.stringify(result.rolls));
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/dice/history', async (req, res) => {
  try {
    const { characterId, limit } = req.query;
    res.json(await diceQueries.getHistory(characterId ? +characterId : null, limit ? +limit : 20));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Configurações ───────────────────────────────────────────

app.get('/api/config', async (req, res) => {
  try { res.json(await configQueries.getAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/config', async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) await configQueries.set(k, String(v));
    res.json(await configQueries.getAll());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config/reset', async (req, res) => {
  try { res.json(await configQueries.resetToDefaults()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Vista do Mestre ─────────────────────────────────────────

app.get('/api/gm', async (req, res) => {
  try {
    const list = await characterQueries.listAll();
    const detailed = await Promise.all(list.map(c => characterQueries.getById(c.id)));
    res.json(detailed);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/friends', async (req, res) => {
  try {
    const list = await characterQueries.listFriends();
    const detailed = await Promise.all(list.map(c => characterQueries.getById(c.id)));
    res.json(detailed);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Motor de Dados ──────────────────────────────────────────

function rollDice(expression, bonus = 0, penalty = 0) {
  const expr = expression.toLowerCase().trim();
  const match = expr.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error(`Expressao invalida: ${expression}`);

  const count    = parseInt(match[1] || '1');
  const sides    = parseInt(match[2]);
  const modifier = parseInt(match[3] || '0');
  if (count < 1 || count > 100)   throw new Error('Quantidade de dados: 1-100');
  if (sides < 2 || sides > 1000)  throw new Error('Lados: 2-1000');

  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  let total = rolls.reduce((a, b) => a + b, 0) + modifier;
  let bonusPenaltyRolls = [];

  if (sides === 100 && (bonus > 0 || penalty > 0)) {
    const ones = (rolls[0] - 1) % 10;
    const tens  = Math.floor((rolls[0] - 1) / 10) * 10;
    const extraTens = Array.from({ length: Math.max(bonus, penalty) }, () => Math.floor(Math.random() * 10) * 10);
    bonusPenaltyRolls = extraTens;
    const allTens = [tens, ...extraTens];
    const chosen = bonus > 0 ? Math.min(...allTens) : Math.max(...allTens);
    total = Math.max(1, Math.min(100, chosen + ones + 1));
  }

  return {
    expression: `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}${bonus > 0 ? ` (+${bonus}b)` : ''}${penalty > 0 ? ` (-${penalty}p)` : ''}`,
    rolls, bonusPenaltyRolls, modifier, total,
    isCriticalSuccess: sides === 100 && total === 1,
    isCriticalFail:    sides === 100 && (total === 100 || total >= 96),
  };
}

// ─── Livros (PDFs) ───────────────────────────────────────────

const pdfTextCache = new Map();

async function extractPdfText(filename) {
  const pdfParse = require('pdf-parse');
  const fp = path.join(BOOKS_DIR, filename);
  const stat = fs.statSync(fp);
  const key = `${filename}:${stat.mtime.getTime()}`;
  if (pdfTextCache.has(key)) return pdfTextCache.get(key);

  const pageStarts = [];
  let accumulated = '';

  const options = {
    pagerender: async (pageData) => {
      pageStarts.push(accumulated.length);
      const tc = await pageData.getTextContent();
      const str = tc.items.map(i => i.str).join('') + '\n';
      accumulated += str;
      return str;
    }
  };

  const buf = fs.readFileSync(fp);
  await pdfParse(buf, options);

  const result = { text: accumulated, pages: pageStarts.length, pageStarts };
  pdfTextCache.set(key, result);
  return result;
}

function getPage(pos, pageStarts) {
  let lo = 0, hi = pageStarts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (pageStarts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

app.get('/api/books/search', async (req, res) => {
  try {
    const q       = (req.query.q || '').trim();
    const useRegex = req.query.regex === 'true';
    if (!q || q.length < 2) return res.json([]);

    let pattern;
    if (useRegex) {
      try { pattern = new RegExp(q, 'gi'); }
      catch (e) { return res.status(400).json({ error: `Regex invalido: ${e.message}` }); }
    } else {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, 'gi');
    }

    const files = fs.readdirSync(BOOKS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    const results = [];
    for (const file of files) {
      try {
        const { text, pageStarts } = await extractPdfText(file);
        const matches = [];
        let m;
        pattern.lastIndex = 0;
        while ((m = pattern.exec(text)) !== null && matches.length < 5) {
          const idx   = m.index;
          const start = Math.max(0, idx - 120);
          const end   = Math.min(text.length, idx + m[0].length + 120);
          const page  = getPage(idx, pageStarts);
          matches.push({
            context: text.slice(start, end).replace(/\s+/g, ' ').trim(),
            pos: idx,
            page,
            matchText: m[0],
          });
        }
        if (matches.length) results.push({ book: file, matches });
      } catch { /* skip unreadable PDF */ }
    }
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/books', (req, res) => {
  try {
    const files = fs.readdirSync(BOOKS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    res.json(files.map(f => {
      const stat = fs.statSync(path.join(BOOKS_DIR, f));
      return { name: f, size: stat.size, modified: stat.mtime };
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/books/upload', bookUpload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo PDF necessario' });
  res.json({ name: req.file.filename, size: req.file.size });
});

app.delete('/api/books/:filename', (req, res) => {
  try {
    const safe = path.basename(req.params.filename);
    const fp = path.join(BOOKS_DIR, safe);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Evidencias ──────────────────────────────────────────────

app.get('/api/evidence/export', async (req, res) => {
  try {
    const items = await evidenceQueries.listAll();
    res.json({ version: 1, exportedAt: new Date().toISOString(), evidence: items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/evidence/import', (req, res) => {
  try {
    const { evidence } = req.body;
    if (!Array.isArray(evidence)) return res.status(400).json({ error: 'Campo "evidence" deve ser array' });
    let count = 0;
    for (const item of evidence) {
      const { title, description, session_tag, image } = item;
      evidenceQueries.create({ title: title || 'Nova Evidencia', description: description || '', session_tag: session_tag || '', image: image || null });
      count++;
    }
    res.json({ success: true, count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/evidence', async (req, res) => {
  try { res.json(await evidenceQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/evidence', async (req, res) => {
  try {
    const id = await evidenceQueries.create(req.body);
    res.status(201).json(await evidenceQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/evidence/:id', async (req, res) => {
  try { await evidenceQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/evidence/:id', async (req, res) => {
  try { await evidenceQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── NPCs / Inimigos ─────────────────────────────────────────

app.get('/api/npcs', async (req, res) => {
  try { res.json(await npcQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/npcs/export', async (req, res) => {
  try {
    const npcs = await Promise.all((await npcQueries.listAll()).map(n => npcQueries.getById(n.id)));
    res.setHeader('Content-Disposition', 'attachment; filename="npcs_export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({ version: 1, exportedAt: new Date().toISOString(), npcs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/npcs/export/:id', async (req, res) => {
  try {
    const n = await npcQueries.getById(+req.params.id);
    if (!n) return res.status(404).json({ error: 'NPC nao encontrado' });
    const safeName = (n.name || 'npc').replace(/[^a-z0-9_\-\s]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ version: 1, exportedAt: new Date().toISOString(), npc: n });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/npcs/import', async (req, res) => {
  try {
    const list = req.body.npcs || (req.body.npc ? [req.body.npc] : null);
    if (!Array.isArray(list)) return res.status(400).json({ error: 'Formato invalido: esperado { npcs: [...] }' });
    const ids = [];
    for (const n of list) {
      delete n.id; delete n.created_at; delete n.updated_at;
      delete n.createdat; delete n.updatedat;
      const id = await npcQueries.create(n);
      ids.push(id);
    }
    res.status(201).json({ success: true, count: ids.length, ids });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/npcs/:id', async (req, res) => {
  try {
    const n = await npcQueries.getById(+req.params.id);
    if (!n) return res.status(404).json({ error: 'NPC nao encontrado' });
    res.json(n);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/npcs', async (req, res) => {
  try {
    const id = await npcQueries.create(req.body);
    res.status(201).json(await npcQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/npcs/:id', async (req, res) => {
  try {
    await npcQueries.update(+req.params.id, req.body);
    res.json(await npcQueries.getById(+req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/npcs/:id', async (req, res) => {
  try { await npcQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Catálogo de Armas ────────────────────────────────────────

app.get('/api/weapon-catalog', async (req, res) => {
  try { res.json(await weaponCatalogQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/weapon-catalog', async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'name e obrigatorio' });
    const id = await weaponCatalogQueries.create(req.body);
    res.status(201).json(await weaponCatalogQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/weapon-catalog/:id', async (req, res) => {
  try { await weaponCatalogQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/weapon-catalog/:id', async (req, res) => {
  try { await weaponCatalogQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/weapon-catalog/export', async (req, res) => {
  try {
    const items = await weaponCatalogQueries.listAll();
    res.setHeader('Content-Disposition', 'attachment; filename="weapon_catalog.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({ version: 1, exportedAt: new Date().toISOString(), weapons: items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/weapon-catalog/import', async (req, res) => {
  try {
    const weapons = req.body.weapons || req.body;
    if (!Array.isArray(weapons)) return res.status(400).json({ error: 'weapons deve ser um array' });
    await weaponCatalogQueries.importBulk(weapons);
    res.json({ success: true, count: weapons.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Sessões ──────────────────────────────────────────────────

app.get('/api/sessions', async (req, res) => {
  try { res.json(await sessionQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions/active', async (req, res) => {
  try { res.json(await sessionQueries.getActive() || null); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const id = await sessionQueries.create(req.body);
    res.status(201).json(await sessionQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    await sessionQueries.update(+req.params.id, req.body);
    res.json(await sessionQueries.getById(+req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/sessions/:id/activate', async (req, res) => {
  try {
    await sessionQueries.activate(+req.params.id);
    res.json(await sessionQueries.getById(+req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try { await sessionQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Session Log ──────────────────────────────────────────────
app.get('/api/sessions/:id/log', async (req, res) => {
  try { res.json(await sessionLogQueries.list(+req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions/:id/log', async (req, res) => {
  try {
    const id = await sessionLogQueries.create(+req.params.id, req.body.content || '');
    res.status(201).json({ id, session_id: +req.params.id, content: req.body.content || '', created_at: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/session-log/:id', async (req, res) => {
  try { await sessionLogQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PDF Annotations ──────────────────────────────────────────
app.get('/api/pdf-annotations', async (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) return res.status(400).json({ error: 'filename obrigatorio' });
    res.json(await annotationQueries.list(filename));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pdf-annotations', async (req, res) => {
  try {
    const id = await annotationQueries.create(req.body);
    res.status(201).json({ id, ...req.body, created_at: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/pdf-annotations/:id', async (req, res) => {
  try { await annotationQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pdf-annotations/:id', async (req, res) => {
  try { await annotationQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SPA Fallback ─────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Boot ─────────────────────────────────────────────────────
async function main() {
  await initDb();
  app.listen(PORT, () => console.log(`\n  Call of Cthulhu Sheet → http://localhost:${PORT}\n`));
}
main().catch(e => { console.error(e); process.exit(1); });
