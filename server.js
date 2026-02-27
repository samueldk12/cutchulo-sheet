const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  initDb,
  characterQueries, skillQueries, weaponQueries,
  possessionQueries, diceQueries, configQueries, evidenceQueries,
  DEFAULT_CONFIG,
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Books directory ──────────────────────────────────────────
const BOOKS_DIR = path.join(__dirname, 'books');
if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });

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
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded books
app.use('/books', express.static(BOOKS_DIR, { dotfiles: 'deny' }));

// ─── Personagens ─────────────────────────────────────────────

app.get('/api/characters', (req, res) => {
  try { res.json(characterQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/characters/:id', (req, res) => {
  try {
    const c = characterQueries.getById(+req.params.id);
    if (!c) return res.status(404).json({ error: 'Personagem não encontrado' });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/characters', (req, res) => {
  try {
    const id = characterQueries.create(req.body);
    const c = characterQueries.getById(id);
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/characters/:id', (req, res) => {
  try {
    const id = +req.params.id;
    const data = req.body;
    if (data.dex !== undefined)
      skillQueries.updateByName(id, 'Dodge', Math.floor(data.dex / 2));
    if (data.edu !== undefined)
      skillQueries.updateByName(id, 'Language (Own)', data.edu);
    characterQueries.update(id, data);
    res.json(characterQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/characters/:id', (req, res) => {
  try { characterQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Export / Import ─────────────────────────────────────────

app.get('/api/export/:id', (req, res) => {
  try {
    const c = characterQueries.getById(+req.params.id);
    if (!c) return res.status(404).json({ error: 'Personagem não encontrado' });
    const safeName = (c.name || 'personagem').replace(/[^a-z0-9_\-\s]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ version: 2, exportedAt: new Date().toISOString(), character: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/import', (req, res) => {
  try {
    const { character } = req.body;
    if (!character?.name) return res.status(400).json({ error: 'JSON inválido: campo "character" obrigatório' });
    // Strip ID so a new one is generated
    delete character.id;
    delete character.created_at;
    delete character.updated_at;
    const id = characterQueries.import(character);
    res.status(201).json(characterQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Habilidades ─────────────────────────────────────────────

app.put('/api/skills/:id', (req, res) => {
  try { skillQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Armas ───────────────────────────────────────────────────

app.post('/api/characters/:id/weapons', (req, res) => {
  try { res.status(201).json({ id: weaponQueries.create(+req.params.id) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/weapons/:id', (req, res) => {
  try { weaponQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/weapons/:id', (req, res) => {
  try { weaponQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Posses ──────────────────────────────────────────────────

app.post('/api/characters/:id/possessions', (req, res) => {
  try { res.status(201).json({ id: possessionQueries.create(+req.params.id, req.body.item || '') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/possessions/:id', (req, res) => {
  try { possessionQueries.update(+req.params.id, req.body.item); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/possessions/:id', (req, res) => {
  try { possessionQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Dados ───────────────────────────────────────────────────

app.post('/api/dice/roll', (req, res) => {
  try {
    const { expression, characterId, bonus, penalty } = req.body;
    const result = rollDice(expression, bonus || 0, penalty || 0);
    diceQueries.addHistory(characterId, result.expression, result.total, JSON.stringify(result.rolls));
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/dice/history', (req, res) => {
  try {
    const { characterId, limit } = req.query;
    res.json(diceQueries.getHistory(characterId ? +characterId : null, limit ? +limit : 20));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Configurações ───────────────────────────────────────────

app.get('/api/config', (req, res) => {
  try { res.json(configQueries.getAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/config', (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) configQueries.set(k, String(v));
    res.json(configQueries.getAll());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config/reset', (req, res) => {
  try { res.json(configQueries.resetToDefaults()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Vista do Mestre ─────────────────────────────────────────

app.get('/api/gm', (req, res) => {
  try {
    const list = characterQueries.listAll();
    res.json(list.map(c => characterQueries.getById(c.id)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Motor de Dados ──────────────────────────────────────────

function rollDice(expression, bonus = 0, penalty = 0) {
  const expr = expression.toLowerCase().trim();
  const match = expr.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error(`Expressão inválida: ${expression}`);

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
  if (!req.file) return res.status(400).json({ error: 'Arquivo PDF necessário' });
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

// ─── Evidências ──────────────────────────────────────────────

app.get('/api/evidence', (req, res) => {
  try { res.json(evidenceQueries.listAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/evidence', (req, res) => {
  try {
    const id = evidenceQueries.create(req.body);
    res.status(201).json(evidenceQueries.getById(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/evidence/:id', (req, res) => {
  try { evidenceQueries.update(+req.params.id, req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/evidence/:id', (req, res) => {
  try { evidenceQueries.delete(+req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SPA Fallback ─────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Boot ─────────────────────────────────────────────────────
async function main() {
  await initDb();
  app.listen(PORT, () => console.log(`\n🐙 Call of Cthulhu Sheet → http://localhost:${PORT}\n`));
}
main().catch(e => { console.error(e); process.exit(1); });
