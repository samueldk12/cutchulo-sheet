const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

// ─── Database backend selection ──────────────────────────────
const POSTGRES_URL = process.env.DATABASE_URL
  || process.env.POSTGRES_URL
  || null;
const USE_PG = !!POSTGRES_URL;

let DB = null;
let isPg = USE_PG;

// ─── Postgres ────────────────────────────────────────────────
if (USE_PG) {
  const { Pool } = require('pg');
  DB = new Pool({
    connectionString: POSTGRES_URL,
    ssl: process.env.PGSSL === 'false' ? false
      : process.env.PGSSL === 'require' ? { rejectUnauthorized: false }
      : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });
}

// ─── SQLite helpers (before DB is initialized) ───────────────
let sqliteInstance = null;

function sqliteSave() {
  if (!sqliteInstance) return;
  const data = sqliteInstance.export();
  const DB_DIR = path.join(__dirname, 'data');
  const DB_PATH = path.join(DB_DIR, 'cthulhu.db');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function sqliteQuery(sql, params = []) {
  const stmt = sqliteInstance.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function sqliteOne(sql, params = []) { return sqliteQuery(sql, params)[0] ?? null; }
function sqliteAll(sql, params = []) { return sqliteQuery(sql, params); }
function sqliteRun(sql, params = []) { sqliteInstance.run(sql, params); sqliteSave(); }
function sqliteInsert(sql, params = []) { sqliteRun(sql, params); return sqliteQuery('SELECT last_insert_rowid() as id')[0]?.id; }

async function pgOne(sql, params = []) {
  const res = await DB.query(sql, params);
  return res.rows[0] || null;
}
async function pgAll(sql, params = []) {
  const res = await DB.query(sql, params);
  return res.rows;
}
async function pgRun(sql, params = []) { await DB.query(sql, params); }
async function pgInsert(sql, params = []) {
  const res = await DB.query(sql + ' RETURNING id', params);
  return res.rows[0].id;
}

// Unified helpers
async function run(sql, params = []) {
  return isPg ? pgRun(sql, params) : sqliteRun(sql, params);
}
async function queryOne(sql, params = []) {
  return isPg ? await pgOne(sql, params) : sqliteOne(sql, params);
}
async function queryAll(sql, params = []) {
  return isPg ? await pgAll(sql, params) : sqliteAll(sql, params);
}
async function insertRow(sql, params = []) {
  return isPg ? pgInsert(sql, params) : sqliteInsert(sql, params);
}
function dbRaw(sql, params = []) {
  (isPg ? DB : sqliteInstance).run(sql, params);
}
function getDb() { return isPg ? DB : sqliteInstance; }
function getSqliteInstance() { return sqliteInstance; }

// ─── Schema ──────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  formula_hp:         'Math.floor((CON + SIZ) / 10)',
  formula_mp:         'Math.floor(POW / 5)',
  formula_san:        'POW * 5',
  formula_dodge:      'Math.floor(DEX / 2)',
  formula_lang_own:   'EDU',
  formula_mov:        '((STR > SIZ && DEX > SIZ) ? 9 : ((STR < SIZ && DEX < SIZ) ? 7 : 8)) - (AGE >= 80 ? 5 : AGE >= 70 ? 4 : AGE >= 60 ? 3 : AGE >= 50 ? 2 : AGE >= 40 ? 1 : 0)',
  formula_occ_points: 'EDU * 4',
  formula_int_points: 'INT * 2',
  formula_brawl:      '25',
  auto_calc:          'true',
};

// Shared table creation snippets (Postgres version)
const PG_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, is_master BOOLEAN DEFAULT false,
  display_name TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS weapon_catalog (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '', skill TEXT DEFAULT '', damage TEXT DEFAULT '',
  range TEXT DEFAULT '', attacks_per_round TEXT DEFAULT '1',
  ammo INTEGER DEFAULT 0, malfunction INTEGER DEFAULT 100, category TEXT DEFAULT 'other',
  notes TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Nova Sessao', role TEXT DEFAULT 'player',
  character_id INTEGER, notes TEXT DEFAULT '', is_active BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE DEFAULT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS session_log_entries (
  id SERIAL PRIMARY KEY, session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pdf_annotations (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL, page INTEGER DEFAULT 1,
  note TEXT DEFAULT '', color TEXT DEFAULT 'yellow', created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  uuid TEXT DEFAULT '', name TEXT NOT NULL DEFAULT 'Novo Investigador',
  player TEXT DEFAULT '', occupation TEXT DEFAULT '', age INTEGER DEFAULT 25,
  gender TEXT DEFAULT '', residence TEXT DEFAULT '', birthplace TEXT DEFAULT '',
  str INTEGER DEFAULT 50, dex INTEGER DEFAULT 50, int_val INTEGER DEFAULT 50,
  con INTEGER DEFAULT 50, app INTEGER DEFAULT 50, pow INTEGER DEFAULT 50,
  siz INTEGER DEFAULT 50, edu INTEGER DEFAULT 50, luck INTEGER DEFAULT 50,
  hp_current INTEGER DEFAULT 10, hp_max INTEGER DEFAULT 10,
  mp_current INTEGER DEFAULT 10, mp_max INTEGER DEFAULT 10,
  san_current INTEGER DEFAULT 50, san_max INTEGER DEFAULT 50,
  temporary_insanity INTEGER DEFAULT 0, indefinite_insanity INTEGER DEFAULT 0,
  cash TEXT DEFAULT '', assets TEXT DEFAULT '', spending_level TEXT DEFAULT '',
  appearance_desc TEXT DEFAULT '', ideology TEXT DEFAULT '', significant_people TEXT DEFAULT '',
  meaningful_locations TEXT DEFAULT '', treasured_possessions TEXT DEFAULT '',
  traits TEXT DEFAULT '', injuries_scars TEXT DEFAULT '', phobias_manias TEXT DEFAULT '',
  arcane_tomes TEXT DEFAULT '', backstory TEXT DEFAULT '', notes TEXT DEFAULT '',
  image TEXT DEFAULT '', is_friend BOOLEAN DEFAULT false, session_token TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY, character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL, base_value INTEGER DEFAULT 0, value INTEGER DEFAULT 0,
  is_occupation BOOLEAN DEFAULT false, is_interest BOOLEAN DEFAULT false,
  occ_points INTEGER DEFAULT 0, int_points INTEGER DEFAULT 0, game_points INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS weapons (
  id SERIAL PRIMARY KEY, character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT DEFAULT '', skill TEXT DEFAULT '', damage TEXT DEFAULT '', range TEXT DEFAULT '',
  attacks_per_round TEXT DEFAULT '1', ammo INTEGER DEFAULT 0, malfunction INTEGER DEFAULT 100
);
CREATE TABLE IF NOT EXISTS possessions (
  id SERIAL PRIMARY KEY, character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  item TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS dice_history (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  character_id INTEGER, expression TEXT NOT NULL, result INTEGER NOT NULL,
  details TEXT DEFAULT '', rolled_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova Evidencia', description TEXT DEFAULT '',
  session_tag TEXT DEFAULT '', image TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS npcs (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo NPC', type TEXT DEFAULT 'npc',
  description TEXT DEFAULT '', str INTEGER DEFAULT 50, dex INTEGER DEFAULT 50,
  int_val INTEGER DEFAULT 50, con INTEGER DEFAULT 50, pow INTEGER DEFAULT 50,
  siz INTEGER DEFAULT 50, hp_current INTEGER DEFAULT 10, hp_max INTEGER DEFAULT 10,
  mp_current INTEGER DEFAULT 10, mp_max INTEGER DEFAULT 10,
  san_current INTEGER DEFAULT 50, san_max INTEGER DEFAULT 50,
  damage_bonus TEXT DEFAULT '', build TEXT DEFAULT '', armor INTEGER DEFAULT 0,
  attacks TEXT DEFAULT '[]', skills_text TEXT DEFAULT '',
  special_abilities TEXT DEFAULT '', notes TEXT DEFAULT '', image TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
`;

// SQLite version
const SQLITE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, is_master INTEGER DEFAULT 0,
  display_name TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS weapon_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL DEFAULT '', skill TEXT DEFAULT '', damage TEXT DEFAULT '',
  range TEXT DEFAULT '', attacks_per_round TEXT DEFAULT '1',
  ammo INTEGER DEFAULT 0, malfunction INTEGER DEFAULT 100, category TEXT DEFAULT 'other',
  notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL DEFAULT 'Nova Sessao', role TEXT DEFAULT 'player',
  character_id INTEGER, notes TEXT DEFAULT '', is_active INTEGER DEFAULT 0,
  share_token TEXT UNIQUE DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS session_log_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER REFERENCES sessions(id),
  content TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS pdf_annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  filename TEXT NOT NULL, page INTEGER DEFAULT 1,
  note TEXT DEFAULT '', color TEXT DEFAULT 'yellow', created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  uuid TEXT DEFAULT '', name TEXT NOT NULL DEFAULT 'Novo Investigador',
  player TEXT DEFAULT '', occupation TEXT DEFAULT '', age INTEGER DEFAULT 25,
  gender TEXT DEFAULT '', residence TEXT DEFAULT '', birthplace TEXT DEFAULT '',
  str INTEGER DEFAULT 50, dex INTEGER DEFAULT 50, int_val INTEGER DEFAULT 50,
  con INTEGER DEFAULT 50, app INTEGER DEFAULT 50, pow INTEGER DEFAULT 50,
  siz INTEGER DEFAULT 50, edu INTEGER DEFAULT 50, luck INTEGER DEFAULT 50,
  hp_current INTEGER DEFAULT 10, hp_max INTEGER DEFAULT 10,
  mp_current INTEGER DEFAULT 10, mp_max INTEGER DEFAULT 10,
  san_current INTEGER DEFAULT 50, san_max INTEGER DEFAULT 50,
  temporary_insanity INTEGER DEFAULT 0, indefinite_insanity INTEGER DEFAULT 0,
  cash TEXT DEFAULT '', assets TEXT DEFAULT '', spending_level TEXT DEFAULT '',
  appearance_desc TEXT DEFAULT '', ideology TEXT DEFAULT '', significant_people TEXT DEFAULT '',
  meaningful_locations TEXT DEFAULT '', treasured_possessions TEXT DEFAULT '',
  traits TEXT DEFAULT '', injuries_scars TEXT DEFAULT '', phobias_manias TEXT DEFAULT '',
  arcane_tomes TEXT DEFAULT '', backstory TEXT DEFAULT '', notes TEXT DEFAULT '',
  image TEXT DEFAULT '', is_friend INTEGER DEFAULT 0, session_token TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER REFERENCES characters(id),
  name TEXT NOT NULL, base_value INTEGER DEFAULT 0, value INTEGER DEFAULT 0,
  is_occupation INTEGER DEFAULT 0, is_interest INTEGER DEFAULT 0,
  occ_points INTEGER DEFAULT 0, int_points INTEGER DEFAULT 0, game_points INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS weapons (
  id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER REFERENCES characters(id),
  name TEXT DEFAULT '', skill TEXT DEFAULT '', damage TEXT DEFAULT '', range TEXT DEFAULT '',
  attacks_per_round TEXT DEFAULT '1', ammo INTEGER DEFAULT 0, malfunction INTEGER DEFAULT 100
);
CREATE TABLE IF NOT EXISTS possessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER REFERENCES characters(id),
  item TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS dice_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  character_id INTEGER, expression TEXT NOT NULL, result INTEGER NOT NULL,
  details TEXT DEFAULT '', rolled_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL DEFAULT 'Nova Evidencia', description TEXT DEFAULT '',
  session_tag TEXT DEFAULT '', image TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS npcs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL DEFAULT 'Novo NPC', type TEXT DEFAULT 'npc',
  description TEXT DEFAULT '', str INTEGER DEFAULT 50, dex INTEGER DEFAULT 50,
  int_val INTEGER DEFAULT 50, con INTEGER DEFAULT 50, pow INTEGER DEFAULT 50,
  siz INTEGER DEFAULT 50, hp_current INTEGER DEFAULT 10, hp_max INTEGER DEFAULT 10,
  mp_current INTEGER DEFAULT 10, mp_max INTEGER DEFAULT 10,
  san_current INTEGER DEFAULT 50, san_max INTEGER DEFAULT 50,
  damage_bonus TEXT DEFAULT '', build TEXT DEFAULT '', armor INTEGER DEFAULT 0,
  attacks TEXT DEFAULT '[]', skills_text TEXT DEFAULT '',
  special_abilities TEXT DEFAULT '', notes TEXT DEFAULT '', image TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
`;

async function initDb() {
  if (isPg) {
    try {
      await DB.query('SELECT 1');
      await DB.query(PG_TABLES);
      for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
        await DB.query(
          'INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
          [key, value]
        );
      }
      console.log('[db] PostgreSQL connected');
      return;
    } catch (e) {
      console.error('[db] PostgreSQL failed, falling back to SQLite:', e.message);
      isPg = false;
      DB = null;
    }
  }
  // SQLite
  const initSqlJs = require('sql.js');
  const s = await initSqlJs();
  const DB_DIR = path.join(__dirname, 'data');
  const DB_PATH = path.join(DB_DIR, 'cthulhu.db');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const exists = fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).isFile();
  sqliteInstance = exists ? new s.Database(fs.readFileSync(DB_PATH)) : new s.Database();
  DB = sqliteInstance;
  DB.run('PRAGMA foreign_keys = ON');
  DB.run(SQLITE_TABLES);

  // Migrations: add user_id columns if missing
  const migCols = [
    'ALTER TABLE characters ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE sessions ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE npcs ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE evidence ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE dice_history ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE weapon_catalog ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE pdf_annotations ADD COLUMN user_id INTEGER DEFAULT 0',
    'ALTER TABLE characters ADD COLUMN image TEXT DEFAULT \'\'',
    'ALTER TABLE characters ADD COLUMN uuid TEXT DEFAULT \'\'',
    'ALTER TABLE characters ADD COLUMN cash TEXT DEFAULT \'\'',
    'ALTER TABLE characters ADD COLUMN assets TEXT DEFAULT \'\'',
    'ALTER TABLE characters ADD COLUMN spending_level TEXT DEFAULT \'\'',
    'ALTER TABLE characters ADD COLUMN is_friend INTEGER DEFAULT 0',
    'ALTER TABLE characters ADD COLUMN session_token TEXT DEFAULT NULL',
    'ALTER TABLE skills ADD COLUMN occ_points INTEGER DEFAULT 0',
    'ALTER TABLE skills ADD COLUMN int_points INTEGER DEFAULT 0',
    'ALTER TABLE skills ADD COLUMN game_points INTEGER DEFAULT 0',
    'ALTER TABLE sessions ADD COLUMN share_token TEXT DEFAULT NULL',
  ];
  for (const m of migCols) { try { sqliteInstance.run(m); } catch {} }
  sqliteSave();

  // Generate UUIDs for characters that don't have one
  sqliteInstance.run("UPDATE characters SET uuid = '' WHERE uuid IS NULL");
  const noUuid = sqliteQuery("SELECT id FROM characters WHERE uuid = '' OR uuid IS NULL");
  for (const row of noUuid) sqliteInstance.run('UPDATE characters SET uuid = ? WHERE id = ?', [randomUUID(), row.id]);
  sqliteSave();

  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    if (!sqliteOne('SELECT key FROM config WHERE key = ?', [key])) {
      sqliteInstance.run('INSERT INTO config (key, value) VALUES (?, ?)', [key, value]);
    }
  }
  sqliteSave();
  console.log('[db] SQLite initialized');
}

// ─── Default Skills ─────────────────────────────────────────
const DEFAULT_SKILLS = [
  { name: 'Accounting (Contabilidade)', base: 5 },
  { name: 'Anthropology (Antropologia)', base: 1 },
  { name: 'Appraise (Avaliar)', base: 5 },
  { name: 'Archaeology (Arqueologia)', base: 1 },
  { name: 'Art/Craft (Arte/Artesanato)', base: 5 },
  { name: 'Charm (Charme)', base: 15 },
  { name: 'Climb (Escalar)', base: 20 },
  { name: 'Computer Use (Computador)', base: 5 },
  { name: 'Credit Rating (Credito)', base: 0 },
  { name: 'Cthulhu Mythos (Mitos de Cthulhu)', base: 0 },
  { name: 'Demolitions (Demolicoes)', base: 1 },
  { name: 'Disguise (Disfarce)', base: 5 },
  { name: 'Diving (Mergulho)', base: 1 },
  { name: 'Dodge (Esquivar)', base: 0 },
  { name: 'Drive Auto (Dirigir)', base: 20 },
  { name: 'Elec. Repair (Rep. Eletrica)', base: 10 },
  { name: 'Electronics (Eletronica)', base: 1 },
  { name: 'Fast Talk (Conversa Fiada)', base: 5 },
  { name: 'Fighting (Brawl) (Luta)', base: 25 },
  { name: 'Firearms (Handgun) (Pistola)', base: 20 },
  { name: 'Firearms (Rifle/Shotgun) (Rifle)', base: 25 },
  { name: 'Firearms (Submachine Gun) (Submetralhadora)', base: 15 },
  { name: 'First Aid (Primeiros Socorros)', base: 30 },
  { name: 'History (Historia)', base: 5 },
  { name: 'Intimidate (Intimidar)', base: 15 },
  { name: 'Jump (Saltar)', base: 20 },
  { name: 'Language (Other) (Idioma - Outro)', base: 1 },
  { name: 'Language (Own) (Idioma - Proprio)', base: 0 },
  { name: 'Law (Direito)', base: 5 },
  { name: 'Library Use (Pesquisa em Biblioteca)', base: 20 },
  { name: 'Listen (Ouvir)', base: 20 },
  { name: 'Locksmith (Ladrao de Cofres)', base: 1 },
  { name: 'Mech. Repair (Rep. Mecanica)', base: 10 },
  { name: 'Medicine (Medicina)', base: 1 },
  { name: 'Natural World (Mundo Natural)', base: 10 },
  { name: 'Navigate (Navegacao)', base: 10 },
  { name: 'Occult (Ocultismo)', base: 5 },
  { name: 'Op. Heavy Machinery (Op. Maq. Pesada)', base: 1 },
  { name: 'Persuade (Persuadir)', base: 10 },
  { name: 'Photography (Fotografia)', base: 1 },
  { name: 'Pilot (Pilotagem)', base: 1 },
  { name: 'Psychology (Psicologia)', base: 10 },
  { name: 'Psychoanalysis (Psicanalise)', base: 1 },
  { name: 'Read Lips (Leitura Labial)', base: 1 },
  { name: 'Ride (Equitacao)', base: 5 },
  { name: 'Science (Biology) (Biologia)', base: 1 },
  { name: 'Science (Botany) (Botanica)', base: 1 },
  { name: 'Science (Chemistry) (Quimica)', base: 1 },
  { name: 'Science (Cryptography) (Criptografia)', base: 1 },
  { name: 'Science (Engineering) (Engenharia)', base: 1 },
  { name: 'Science (Forensics) (Forense)', base: 1 },
  { name: 'Science (Geology) (Geologia)', base: 1 },
  { name: 'Science (Mathematics) (Matematica)', base: 1 },
  { name: 'Science (Meteorology) (Meteorologia)', base: 1 },
  { name: 'Science (Pharmacy) (Farmacia)', base: 1 },
  { name: 'Science (Physics) (Fisica)', base: 1 },
  { name: 'Science (Zoology) (Zoologia)', base: 1 },
  { name: 'Sleight of Hand (Prestidigitacao)', base: 10 },
  { name: 'Spot Hidden (Detectar)', base: 25 },
  { name: 'Stealth (Furtividade)', base: 20 },
  { name: 'Survival (Sobrevivencia)', base: 10 },
  { name: 'Swim (Nadar)', base: 20 },
  { name: 'Throw (Arremesso)', base: 20 },
  { name: 'Track (Rastrear)', base: 10 },
];

async function createDefaultSkills(characterId, dex, edu) {
  for (const skill of DEFAULT_SKILLS) {
    let base = skill.base;
    if (skill.name.includes('Dodge')) base = Math.floor(dex / 2);
    if (skill.name.includes('Language (Own)')) base = edu;
    const isOcc = skill.name.includes('Credit Rating');
    if (isPg) {
      await DB.query(
        'INSERT INTO skills (character_id, name, base_value, value, is_occupation) VALUES ($1,$2,$3,$4,$5)',
        [characterId, skill.name, base, base, isOcc]
      );
    } else {
      sqliteInstance.run(
        'INSERT INTO skills (character_id, name, base_value, value, is_occupation) VALUES (?,?,?,?,?)',
        [characterId, skill.name, base, base, isOcc ? 1 : 0]
      );
    }
  }
  if (!isPg) sqliteSave();
}

// ─── Auth ─────────────────────────────────────────────────────
const authQueries = {
  async register(username, password) {
    const hash = await bcrypt.hash(password, 10);
    if (isPg) {
      try {
        await DB.query(
          'INSERT INTO users (username, password_hash, display_name) VALUES ($1,$2,$3)',
          [username, hash, username]
        );
      } catch (e) {
        if (e.code === '23505') return { error: 'Usuario ja existe' };
        throw e;
      }
      return authQueries.getByUsername(username);
    } else {
      try {
        sqliteInstance.run('INSERT INTO users (username, password_hash, display_name) VALUES (?,?,?)', [username, hash, username]);
        sqliteSave();
      } catch (e) {
        if (e.message?.includes('UNIQUE')) return { error: 'Usuario ja existe' };
        throw e;
      }
      return sqliteOne('SELECT * FROM users WHERE username = ?', [username]);
    }
  },
  async login(username, password) {
    const user = isPg
      ? (await DB.query('SELECT * FROM users WHERE username = $1', [username])).rows[0] || null
      : sqliteOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    return user;
  },
  async getByUsername(username) {
    return isPg
      ? (await DB.query('SELECT * FROM users WHERE username = $1', [username])).rows[0] || null
      : sqliteOne('SELECT * FROM users WHERE username = ?', [username]);
  },
  async setMaster(userId, isMaster) {
    if (isPg) await DB.query('UPDATE users SET is_master = $1 WHERE id = $2', [isMaster, userId]);
    else { sqliteInstance.run('UPDATE users SET is_master = ? WHERE id = ?', [isMaster ? 1 : 0, userId]); sqliteSave(); }
  },
  async getById(id) {
    return isPg
      ? (await DB.query('SELECT id, username, is_master, display_name, created_at FROM users WHERE id = $1', [id])).rows[0] || null
      : sqliteOne('SELECT id, username, is_master, display_name, created_at FROM users WHERE id = ?', [id]);
  },
  async getAllForMaster() {
    return isPg
      ? (await DB.query('SELECT id, username, is_master, display_name, created_at FROM users ORDER BY created_at')).rows
      : sqliteAll('SELECT id, username, is_master, display_name, created_at FROM users ORDER BY created_at');
  },
};

// ─── Character Queries ────────────────────────────────────────
const characterQueries = {
  async listAll(userId) {
    return await queryAll(isPg
      ? "SELECT id, uuid, name, player, occupation, age, user_id FROM characters WHERE user_id = $1 AND NOT is_friend ORDER BY updated_at DESC"
      : "SELECT id, uuid, name, player, occupation, age, user_id FROM characters WHERE user_id = ? AND (is_friend = 0 OR is_friend IS NULL) ORDER BY updated_at DESC",
      [userId]);
  },
  async listFriends(userId) {
    return await queryAll(isPg
      ? "SELECT id, uuid, name, player, occupation, age, user_id FROM characters WHERE user_id = $1 AND is_friend ORDER BY updated_at DESC"
      : "SELECT id, uuid, name, player, occupation, age, user_id FROM characters WHERE user_id = ? AND is_friend = 1 ORDER BY updated_at DESC",
      [userId]);
  },
  async listBySessionToken(token) {
    if (!token) return [];
    return await queryAll(
      isPg
        ? "SELECT id, uuid, name, player, occupation, age FROM characters WHERE session_token = $1 ORDER BY updated_at DESC"
        : "SELECT id, uuid, name, player, occupation, age FROM characters WHERE session_token = ? ORDER BY updated_at DESC",
      [token]);
  },
  async getById(id) {
    const c = await queryOne('SELECT * FROM characters WHERE id = ?', [id]);
    if (!c) return null;
    c.skills = await queryAll('SELECT * FROM skills WHERE character_id = ? ORDER BY name', [id]);
    c.weapons = await queryAll('SELECT * FROM weapons WHERE character_id = ?', [id]);
    c.possessions = await queryAll('SELECT * FROM possessions WHERE character_id = ?', [id]);
    return c;
  },
  async getByUuid(uuid) {
    if (!uuid) return null;
    return await queryOne('SELECT id FROM characters WHERE uuid = ?', [uuid]);
  },
  async create(data) {
    const userId = data.user_id || 1;
    const hpMax = data.hp_max ?? Math.floor(((data.con || 50) + (data.siz || 50)) / 10);
    const mpMax = data.mp_max ?? Math.floor((data.pow || 50) / 5);
    const sanVal = data.san_max ?? (data.pow || 50) * 5;
    const uuid = data.uuid || randomUUID();
    const isFr = !!data.is_friend;
    const st = data.session_token || null;
    const cols = `(uuid,name,player,occupation,age,gender,residence,birthplace,str,dex,int_val,con,app,pow,siz,edu,luck,hp_current,hp_max,mp_current,mp_max,san_current,san_max,is_friend,session_token,user_id)`;
    if (isPg) {
      const res = await DB.query(`INSERT INTO characters ${cols} VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING id`,
        [uuid, data.name||'Novo Investigador', data.player||'', data.occupation||'', data.age||25, data.gender||'', data.residence||'', data.birthplace||'',
         data.str||50, data.dex||50, data.int_val||50, data.con||50, data.app||50, data.pow||50, data.siz||50, data.edu||50, data.luck||50,
         data.hp_current ?? hpMax, hpMax, data.mp_current ?? mpMax, mpMax, data.san_current ?? sanVal, sanVal, isFr, st, userId]);
      const id = res.rows[0].id;
      await createDefaultSkills(id, data.dex || 50, data.edu || 50);
      return id;
    } else {
      sqliteInstance.run(`INSERT INTO characters ${cols} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [uuid, data.name||'Novo Investigador', data.player||'', data.occupation||'', data.age||25, data.gender||'', data.residence||'', data.birthplace||'',
         data.str||50, data.dex||50, data.int_val||50, data.con||50, data.app||50, data.pow||50, data.siz||50, data.edu||50, data.luck||50,
         data.hp_current ?? hpMax, hpMax, data.mp_current ?? mpMax, mpMax, data.san_current ?? sanVal, sanVal, isFr ? 1 : 0, st, userId]);
      const id = sqliteQuery('SELECT last_insert_rowid() as id')[0].id;
      sqliteSave();
      await createDefaultSkills(id, data.dex || 50, data.edu || 50);
      return id;
    }
  },
  async import(data) {
    if (data.uuid) {
      const existing = await this.getByUuid(data.uuid);
      if (existing) return await this._updateFromImport(existing.id, data);
    }
    const userId = data.user_id || 1;
    const hpMax = data.hp_max ?? Math.floor(((data.con || 50) + (data.siz || 50)) / 10);
    const mpMax = data.mp_max ?? Math.floor((data.pow || 50) / 5);
    const sanVal = data.san_max ?? (data.pow || 50) * 5;
    const uuid = data.uuid || randomUUID();
    let id;
    if (isPg) {
      const res = await DB.query(
        `INSERT INTO characters (uuid,name,player,occupation,age,gender,residence,birthplace,str,dex,int_val,con,app,pow,siz,edu,luck,hp_current,hp_max,mp_current,mp_max,san_current,san_max,is_friend,user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING id`,
        [uuid, data.name||'Importado', data.player||'', data.occupation||'', data.age||25, data.gender||'', data.residence||'', data.birthplace||'',
         data.str||50, data.dex||50, data.int_val||50, data.con||50, data.app||50, data.pow||50, data.siz||50, data.edu||50, data.luck||50,
         data.hp_current ?? hpMax, hpMax, data.mp_current ?? mpMax, mpMax, data.san_current ?? sanVal, sanVal, !!data.is_friend, userId]);
      id = res.rows[0].id;
      const textFields = ['appearance_desc','ideology','significant_people','meaningful_locations','treasured_possessions','traits','injuries_scars','phobias_manias','arcane_tomes','backstory','notes','image','cash','assets','spending_level'];
      for (const f of textFields) {
        if (data[f]) await DB.query(`UPDATE characters SET ${f} = $1 WHERE id = $2`, [data[f], id]);
      }
    } else {
      sqliteInstance.run(`INSERT INTO characters (uuid,name,player,occupation,age,gender,residence,birthplace,str,dex,int_val,con,app,pow,siz,edu,luck,hp_current,hp_max,mp_current,mp_max,san_current,san_max,is_friend,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [uuid, data.name||'Importado', data.player||'', data.occupation||'', data.age||25, data.gender||'', data.residence||'', data.birthplace||'',
         data.str||50, data.dex||50, data.int_val||50, data.con||50, data.app||50, data.pow||50, data.siz||50, data.edu||50, data.luck||50,
         data.hp_current ?? hpMax, hpMax, data.mp_current ?? mpMax, mpMax, data.san_current ?? sanVal, sanVal, data.is_friend ? 1 : 0, userId]);
      id = sqliteQuery('SELECT last_insert_rowid() as id')[0].id;
      const textFields = ['appearance_desc','ideology','significant_people','meaningful_locations','treasured_possessions','traits','injuries_scars','phobias_manias','arcane_tomes','backstory','notes','image','cash','assets','spending_level'];
      for (const f of textFields) {
        if (data[f]) sqliteInstance.run(`UPDATE characters SET ${f} = ? WHERE id = ?`, [data[f], id]);
      }
      sqliteSave();
    }
    await this._importRelations(id, data);
    return id;
  },
  async _updateFromImport(id, data) {
    const allowed = ['name','player','occupation','age','gender','residence','birthplace','str','dex','int_val','con','app','pow','siz','edu','luck','hp_current','hp_max','mp_current','mp_max','san_current','san_max','is_friend','appearance_desc','ideology','significant_people','meaningful_locations','treasured_possessions','traits','injuries_scars','phobias_manias','arcane_tomes','backstory','notes','image','cash','assets','spending_level'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length) {
      const p = (i) => isPg ? `$${i}` : '?';
      const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
      await run(`UPDATE characters SET ${set}, updated_at = ${isPg ? 'NOW()' : "datetime('now')"} WHERE id = ${p(fields.length + 1)}`, [...fields.map(f => data[f]), id]);
    }
    if (data.skills?.length) {
      await run('DELETE FROM skills WHERE character_id = ?', [id]);
      for (const s of data.skills) {
        await run('INSERT INTO skills (character_id,name,base_value,value,is_occupation,is_interest,occ_points,int_points,game_points) VALUES (?,?,?,?,?,?,?,?,?)',
          [id, s.name, s.base_value||0, s.value||0, s.is_occupation||0, s.is_interest||0, s.occ_points||0, s.int_points||0, s.game_points||0]);
      }
    }
    if (data.weapons?.length) {
      await run('DELETE FROM weapons WHERE character_id = ?', [id]);
      for (const w of data.weapons) {
        await run('INSERT INTO weapons (character_id,name,skill,damage,range,attacks_per_round,ammo,malfunction) VALUES (?,?,?,?,?,?,?,?)',
          [id, w.name||'', w.skill||'', w.damage||'', w.range||'', w.attacks_per_round||'1', w.ammo||0, w.malfunction||100]);
      }
    }
    if (!isPg) sqliteSave();
    return id;
  },
  async _importRelations(id, data) {
    if (data.skills?.length) {
      for (const s of data.skills) {
        await run('INSERT INTO skills (character_id,name,base_value,value,is_occupation,is_interest,occ_points,int_points,game_points) VALUES (?,?,?,?,?,?,?,?,?)',
          [id, s.name, s.base_value||0, s.value||0, s.is_occupation||0, s.is_interest||0, s.occ_points||0, s.int_points||0, s.game_points||0]);
      }
    } else {
      await createDefaultSkills(id, data.dex||50, data.edu||50);
    }
    for (const w of (data.weapons||[])) {
      await run('INSERT INTO weapons (character_id,name,skill,damage,range,attacks_per_round,ammo,malfunction) VALUES (?,?,?,?,?,?,?,?)',
        [id, w.name||'', w.skill||'', w.damage||'', w.range||'', w.attacks_per_round||'1', w.ammo||0, w.malfunction||100]);
    }
    for (const p of (data.possessions||[])) {
      await run('INSERT INTO possessions (character_id, item) VALUES (?,?)', [id, p.item||'']);
    }
    if (!isPg) sqliteSave();
  },
  async update(id, data) {
    const allowed = ['name','player','occupation','age','gender','residence','birthplace','str','dex','int_val','con','app','pow','siz','edu','luck','hp_current','hp_max','mp_current','mp_max','san_current','san_max','temporary_insanity','indefinite_insanity','appearance_desc','ideology','significant_people','meaningful_locations','treasured_possessions','traits','injuries_scars','phobias_manias','arcane_tomes','backstory','notes','image','cash','assets','spending_level','session_token'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const p = (i) => isPg ? `$${i}` : '?';
    const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
    await run(`UPDATE characters SET ${set}, updated_at = ${isPg ? 'NOW()' : "datetime('now')"} WHERE id = ${p(fields.length + 1)}`, [...fields.map(f => data[f]), id]);
  },
  async delete(id) {
    await run('DELETE FROM skills WHERE character_id = ?', [id]);
    await run('DELETE FROM weapons WHERE character_id = ?', [id]);
    await run('DELETE FROM possessions WHERE character_id = ?', [id]);
    await run('DELETE FROM dice_history WHERE character_id = ?', [id]);
    await run('DELETE FROM characters WHERE id = ?', [id]);
  },
};

// ─── Skill Queries ────────────────────────────────────────────
const skillQueries = {
  async update(id, data) {
    if (data.occ_points !== undefined || data.int_points !== undefined || data.game_points !== undefined) {
      const skill = await queryOne('SELECT base_value FROM skills WHERE id = ?', [id]);
      const base = skill?.base_value ?? 0;
      const occ = data.occ_points ?? 0;
      const int_ = data.int_points ?? 0;
      const game = data.game_points ?? 0;
      const total = base + occ + int_ + game;
      const occB = occ > 0; const intB = int_ > 0;
      const occV = isPg ? occB : (occB ? 1 : 0);
      const intV = isPg ? intB : (intB ? 1 : 0);
      await run('UPDATE skills SET occ_points=?, int_points=?, game_points=?, value=?, is_occupation=?, is_interest=? WHERE id=?',
        [occ, int_, game, total, occV, intV, id]);
    } else {
      const occV = isPg ? (!!data.is_occupation) : (data.is_occupation ? 1 : 0);
      const intV = isPg ? (!!data.is_interest) : (data.is_interest ? 1 : 0);
      await run('UPDATE skills SET value=?, is_occupation=?, is_interest=? WHERE id=?',
        [data.value, occV, intV, id]);
    }
  },
  async updateByName(characterId, nameLike, base) {
    await run("UPDATE skills SET base_value=? WHERE character_id=? AND name LIKE ?", [base, characterId, `%${nameLike}%`]);
  },
};

// ─── Weapon Queries ────────────────────────────────────────────
const weaponQueries = {
  async create(characterId) {
    if (isPg) { const r = await DB.query('INSERT INTO weapons (character_id) VALUES ($1) RETURNING id', [characterId]); return r.rows[0].id; }
    sqliteInstance.run('INSERT INTO weapons (character_id) VALUES (?)', [characterId]);
    sqliteSave();
    return sqliteQuery('SELECT last_insert_rowid() as id')[0].id;
  },
  async update(id, data) {
    await run('UPDATE weapons SET name=?,skill=?,damage=?,range=?,attacks_per_round=?,ammo=?,malfunction=? WHERE id=?',
      [data.name,data.skill,data.damage,data.range,data.attacks_per_round,data.ammo,data.malfunction,id]);
  },
  async delete(id) { await run('DELETE FROM weapons WHERE id=?', [id]); },
};

// ─── Possession Queries ───────────────────────────────────────
const possessionQueries = {
  async create(characterId, item) {
    if (isPg) { const r = await DB.query('INSERT INTO possessions (character_id, item) VALUES ($1,$2) RETURNING id', [characterId, item]); return r.rows[0].id; }
    sqliteInstance.run('INSERT INTO possessions (character_id, item) VALUES (?,?)', [characterId, item]);
    sqliteSave();
    return sqliteQuery('SELECT last_insert_rowid() as id')[0].id;
  },
  async update(id, item) { await run('UPDATE possessions SET item=? WHERE id=?', [item, id]); },
  async delete(id) { await run('DELETE FROM possessions WHERE id=?', [id]); },
};

// ─── Dice Queries ──────────────────────────────────────────────
const diceQueries = {
  async addHistory(userId, characterId, expression, result, details) {
    await run('INSERT INTO dice_history (user_id, character_id, expression, result, details) VALUES (?,?,?,?,?)',
      [userId||null, characterId||null, expression, result, details]);
  },
  async getHistory(userId, characterId, limit = 20) {
    if (userId && characterId) {
      return await queryAll('SELECT * FROM dice_history WHERE user_id=? AND character_id=? ORDER BY rolled_at DESC LIMIT ?', [userId, characterId, limit]);
    }
    if (userId) return await queryAll('SELECT * FROM dice_history WHERE user_id=? ORDER BY rolled_at DESC LIMIT ?', [userId, limit]);
    return await queryAll('SELECT * FROM dice_history ORDER BY rolled_at DESC LIMIT ?', [limit]);
  },
};

// ─── Config Queries ────────────────────────────────────────────
const configQueries = {
  async getAll() {
    const rows = await queryAll('SELECT key, value FROM config');
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    return obj;
  },
  async set(key, value) {
    const exists = await queryOne('SELECT key FROM config WHERE key=?', [key]);
    if (exists) await run('UPDATE config SET value=? WHERE key=?', [value, key]);
    else await run('INSERT INTO config (key, value) VALUES (?,?)', [key, value]);
  },
  async resetToDefaults() {
    for (const [k, v] of Object.entries(DEFAULT_CONFIG)) {
      if (isPg) await DB.query('INSERT INTO config (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = $2', [k, v]);
      else await run('INSERT OR REPLACE INTO config (key, value) VALUES (?,?)', [k, v]);
    }
    return DEFAULT_CONFIG;
  },
};

// ─── Evidence Queries ─────────────────────────────────────────
const evidenceQueries = {
  async listAll(userId) { return await queryAll('SELECT * FROM evidence WHERE user_id = ? ORDER BY created_at DESC', [userId]); },
  async getById(id) { return await queryOne('SELECT * FROM evidence WHERE id = ?', [id]); },
  async create(userId, data) {
    return await insertRow('INSERT INTO evidence (user_id, title, description, session_tag, image) VALUES (?,?,?,?,?)',
      [userId, data.title||'Nova Evidencia', data.description||'', data.session_tag||'', data.image||'']);
  },
  async update(id, data) {
    const allowed = ['title','description','session_tag','image'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const p = (i) => isPg ? `$${i}` : '?';
    const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
    await run(`UPDATE evidence SET ${set} WHERE id = ${p(fields.length+1)}`, [...fields.map(f => data[f]), id]);
  },
  async delete(id) { await run('DELETE FROM evidence WHERE id = ?', [id]); },
};

// ─── Weapon Catalog Queries ────────────────────────────────────
const weaponCatalogQueries = {
  async listAll(userId) { return await queryAll('SELECT * FROM weapon_catalog WHERE user_id = ? ORDER BY category, name', [userId]); },
  async getById(id) { return await queryOne('SELECT * FROM weapon_catalog WHERE id = ?', [id]); },
  async create(userId, data) {
    return await insertRow('INSERT INTO weapon_catalog (user_id, name,skill,damage,range,attacks_per_round,ammo,malfunction,category,notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [userId, data.name||'', data.skill||'', data.damage||'', data.range||'', data.attacks_per_round||'1', data.ammo||0, data.malfunction||100, data.category||'other', data.notes||'']);
  },
  async update(id, data) {
    const allowed = ['name','skill','damage','range','attacks_per_round','ammo','malfunction','category','notes'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const p = (i) => isPg ? `$${i}` : '?';
    const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
    await run(`UPDATE weapon_catalog SET ${set} WHERE id = ${p(fields.length+1)}`, [...fields.map(f => data[f]), id]);
  },
  async delete(id) { await run('DELETE FROM weapon_catalog WHERE id = ?', [id]); },
  async importBulk(userId, items) {
    for (const w of items) {
      const existing = await queryOne('SELECT id FROM weapon_catalog WHERE name = ? AND user_id = ?', [w.name, userId]);
      if (existing) {
        const allowed = ['skill','damage','range','attacks_per_round','ammo','malfunction','category','notes'];
        const fields = allowed.filter(k => w[k] !== undefined);
        if (fields.length) {
          const p = (i) => isPg ? `$${i}` : '?';
          const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
          await run(`UPDATE weapon_catalog SET ${set} WHERE id = ${p(fields.length+1)}`, [...fields.map(f => w[f]), existing.id]);
        }
      } else {
        await run('INSERT INTO weapon_catalog (user_id, name,skill,damage,range,attacks_per_round,ammo,malfunction,category,notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [userId, w.name||'', w.skill||'', w.damage||'', w.range||'', w.attacks_per_round||'1', w.ammo||0, w.malfunction||100, w.category||'other', w.notes||'']);
      }
    }
  },
};

// ─── Session Queries ──────────────────────────────────────────
const sessionQueries = {
  async listAll(userId) { return await queryAll('SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC', [userId]); },
  async getById(id) { return await queryOne('SELECT * FROM sessions WHERE id = ?', [id]); },
  async getActive(userId) { return await queryOne(isPg ? "SELECT * FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY updated_at DESC" : "SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC", [userId]); },
  async create(userId, data) {
    await run('UPDATE sessions SET is_active = ' + (isPg ? 'false' : '0') + ' WHERE user_id = ?', [userId]);
    if (isPg) {
      const res = await DB.query(
        'INSERT INTO sessions (user_id, name, role, character_id, notes, is_active) VALUES ($1, $2, $3, $4, $5, false) RETURNING id',
        [userId, data.name || 'Nova Sessao', data.role || 'player', data.character_id || null, data.notes || '']
      );
      return res.rows[0].id;
    } else {
      return await insertRow(
        'INSERT INTO sessions (user_id, name, role, character_id, notes, is_active) VALUES (?,?,?,?,?,1)',
        [userId, data.name || 'Nova Sessao', data.role || 'player', data.character_id || null, data.notes || '']
      );
    }
  },
  async update(id, data) {
    const allowed = ['name','role','character_id','notes','is_active','share_token'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const p = (i) => isPg ? `$${i}` : '?';
    const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
    await run(`UPDATE sessions SET ${set}, updated_at = ${isPg ? 'NOW()' : "datetime('now')"} WHERE id = ${p(fields.length+1)}`, [...fields.map(f => data[f]), id]);
  },
  async generateShareToken(id) {
    const token = randomUUID();
    await run(isPg ? 'UPDATE sessions SET share_token = $1 WHERE id = $2' : 'UPDATE sessions SET share_token = ? WHERE id = ?', [token, id]);
    return token;
  },
  async getByShareToken(token) {
    if (!token) return null;
    return await queryOne(isPg ? "SELECT * FROM sessions WHERE share_token = $1 AND is_active = true" : "SELECT * FROM sessions WHERE share_token = ? AND is_active = 1", [token]);
  },
  async activate(id) {
    await run('UPDATE sessions SET is_active = ' + (isPg ? 'false' : '0'));
    if (isPg) {
      await run('UPDATE sessions SET is_active = true, updated_at = NOW() WHERE id = $1', [id]);
    } else {
      await run("UPDATE sessions SET is_active = 1, updated_at = datetime('now') WHERE id = ?", [id]);
    }
  },
  async delete(id) { await run('DELETE FROM sessions WHERE id = ?', [id]); },

  // Join session: character joins as friend with session_token
  async joinAsCharacter(userId, token, charData) {
    const session = await this.getByShareToken(token);
    if (!session) throw new Error('Sessao nao encontrada ou expirada');
    const charId = await characterQueries.create({ ...charData, is_friend: true, session_token: token, user_id: userId });
    return await characterQueries.getById(charId);
  },
  async getParticipants(token) {
    if (!token) return {};
    const session = await queryOne('SELECT * FROM sessions WHERE share_token = ?', [token]);
    if (!session) return { error: 'Session not found' };
    const chars = await characterQueries.listBySessionToken(token);
    const details = await Promise.all(chars.map(c => characterQueries.getById(c.id)));
    return { session, characters: details };
  },
};

// ─── NPC Queries ──────────────────────────────────────────────
const npcQueries = {
  async listAll(userId) { return await queryAll('SELECT id, name, type, description, hp_current, hp_max, mp_current, mp_max, san_current, san_max, armor, image, created_at FROM npcs WHERE user_id = ? ORDER BY type, name', [userId]); },
  async getById(id) { return await queryOne('SELECT * FROM npcs WHERE id = ?', [id]); },
  async create(userId, data) {
    const hpMax = data.hp_max ?? Math.floor(((data.con||50) + (data.siz||50)) / 10);
    const mpMax = data.mp_max ?? Math.floor((data.pow||50) / 5);
    const sanMax = data.san_max ?? (data.type === 'monster' ? 0 : (data.pow||50) * 5);
    if (isPg) {
      const res = await DB.query(
        'INSERT INTO npcs (user_id, name,type,description,str,dex,int_val,con,pow,siz,hp_current,hp_max,mp_current,mp_max,san_current,san_max,damage_bonus,build,armor,attacks,skills_text,special_abilities,notes) VALUES ($1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id',
        [userId, data.name||'Novo NPC', data.type||'npc', data.description||'',
         data.str||50, data.dex||50, data.int_val||50, data.con||50, data.pow||50, data.siz||50,
         data.hp_current ?? hpMax, hpMax, data.mp_current ?? mpMax, mpMax,
         data.san_current ?? sanMax, sanMax, data.damage_bonus||'', data.build||'', data.armor||0,
         data.attacks||'[]', data.skills_text||'', data.special_abilities||'', data.notes||'']
      );
      return res.rows[0].id;
    } else {
      return await insertRow(
        'INSERT INTO npcs (user_id, name,type,description,str,dex,int_val,con,pow,siz,hp_current,hp_max,mp_current,mp_max,san_current,san_max,damage_bonus,build,armor,attacks,skills_text,special_abilities,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [userId, data.name||'Novo NPC', data.type||'npc', data.description||'',
         data.str||50, data.dex||50, data.int_val||50, data.con||50, data.pow||50, data.siz||50,
         data.hp_current ?? hpMax, hpMax, data.mp_current ?? mpMax, mpMax,
         data.san_current ?? sanMax, sanMax, data.damage_bonus||'', data.build||'', data.armor||0,
         data.attacks||'[]', data.skills_text||'', data.special_abilities||'', data.notes||'']
      );
    }
  },
  async update(id, data) {
    const allowed = ['name','type','description','str','dex','int_val','con','pow','siz','hp_current','hp_max','mp_current','mp_max','san_current','san_max','damage_bonus','build','armor','attacks','skills_text','special_abilities','notes','image'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const p = (i) => isPg ? `$${i}` : '?';
    const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
    await run(`UPDATE npcs SET ${set}, updated_at = ${isPg ? 'NOW()' : "datetime('now')"} WHERE id = ${p(fields.length+1)}`, [...fields.map(f => data[f]), id]);
  },
  async delete(id) { await run('DELETE FROM npcs WHERE id = ?', [id]); },
};

// ─── Session Log Queries ──────────────────────────────────────
const sessionLogQueries = {
  async list(sessionId) { return await queryAll('SELECT * FROM session_log_entries WHERE session_id = ? ORDER BY created_at DESC', [sessionId]); },
  async create(sessionId, content) {
    return await insertRow('INSERT INTO session_log_entries (session_id, content) VALUES (?,?)', [sessionId, content]);
  },
  async delete(id) { await run('DELETE FROM session_log_entries WHERE id = ?', [id]); },
};

// ─── PDF Annotation Queries ───────────────────────────────────
const annotationQueries = {
  async list(filename) { return await queryAll('SELECT * FROM pdf_annotations WHERE filename = ? ORDER BY page, created_at', [filename]); },
  async create(userId, data) {
    return await insertRow('INSERT INTO pdf_annotations (user_id, filename, page, note, color) VALUES (?,?,?,?,?)',
      [userId, data.filename, data.page||1, data.note||'', data.color||'yellow']);
  },
  async update(id, data) {
    const allowed = ['note','color','page'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const p = (i) => isPg ? `$${i}` : '?';
    const set = fields.map((f, i) => `${f} = ${p(i+1)}`).join(', ');
    await run(`UPDATE pdf_annotations SET ${set} WHERE id = ${p(fields.length+1)}`, [...fields.map(f => data[f]), id]);
  },
  async delete(id) { await run('DELETE FROM pdf_annotations WHERE id = ?', [id]); },
};

// ─── Books ─────────────────────────────────────────────────────
const bookQueries = {
  async list(userId) {
    return await queryAll('SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  },
};

module.exports = {
  initDb, getDb, isPg, getSqliteInstance,
  characterQueries, skillQueries, weaponQueries,
  possessionQueries, diceQueries, configQueries, evidenceQueries,
  npcQueries, weaponCatalogQueries, sessionQueries,
  sessionLogQueries, annotationQueries, authQueries, bookQueries,
  DEFAULT_CONFIG, DEFAULT_SKILLS,
};
