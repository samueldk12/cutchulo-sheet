const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'cthulhu.db');
let db = null;

async function initDb() {
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  initSchema();
  saveDb();
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getDb() { return db; }

// ─── Query Helpers ───────────────────────────────────────────
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  return query(sql, params)[0] ?? null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function lastInsertId() {
  return db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] ?? null;
}

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

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Novo Investigador',
      player TEXT DEFAULT '',
      occupation TEXT DEFAULT '',
      age INTEGER DEFAULT 25,
      gender TEXT DEFAULT '',
      residence TEXT DEFAULT '',
      birthplace TEXT DEFAULT '',
      str INTEGER DEFAULT 50,
      dex INTEGER DEFAULT 50,
      int_val INTEGER DEFAULT 50,
      con INTEGER DEFAULT 50,
      app INTEGER DEFAULT 50,
      pow INTEGER DEFAULT 50,
      siz INTEGER DEFAULT 50,
      edu INTEGER DEFAULT 50,
      luck INTEGER DEFAULT 50,
      hp_current INTEGER DEFAULT 10,
      hp_max INTEGER DEFAULT 10,
      mp_current INTEGER DEFAULT 10,
      mp_max INTEGER DEFAULT 10,
      san_current INTEGER DEFAULT 50,
      san_max INTEGER DEFAULT 50,
      temporary_insanity INTEGER DEFAULT 0,
      indefinite_insanity INTEGER DEFAULT 0,
      appearance_desc TEXT DEFAULT '',
      ideology TEXT DEFAULT '',
      significant_people TEXT DEFAULT '',
      meaningful_locations TEXT DEFAULT '',
      treasured_possessions TEXT DEFAULT '',
      traits TEXT DEFAULT '',
      injuries_scars TEXT DEFAULT '',
      phobias_manias TEXT DEFAULT '',
      arcane_tomes TEXT DEFAULT '',
      backstory TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      base_value INTEGER DEFAULT 0,
      value INTEGER DEFAULT 0,
      is_occupation INTEGER DEFAULT 0,
      is_interest INTEGER DEFAULT 0,
      FOREIGN KEY(character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS weapons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      name TEXT DEFAULT '',
      skill TEXT DEFAULT '',
      damage TEXT DEFAULT '',
      range TEXT DEFAULT '',
      attacks_per_round TEXT DEFAULT '1',
      ammo INTEGER DEFAULT 0,
      malfunction INTEGER DEFAULT 100,
      FOREIGN KEY(character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS possessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      item TEXT DEFAULT '',
      FOREIGN KEY(character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS dice_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER,
      expression TEXT NOT NULL,
      result INTEGER NOT NULL,
      details TEXT DEFAULT '',
      rolled_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'Nova Evidência',
      description TEXT DEFAULT '',
      session_tag TEXT DEFAULT '',
      image TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrate: add image column if missing
  try { db.run("ALTER TABLE characters ADD COLUMN image TEXT DEFAULT ''"); } catch(e) {}

  // Insert default config if not present
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    if (!queryOne('SELECT key FROM config WHERE key = ?', [key])) {
      db.run('INSERT INTO config (key, value) VALUES (?, ?)', [key, value]);
    }
  }
}

// ─── Default Skills (CoC 7e) ─────────────────────────────────
const DEFAULT_SKILLS = [
  { name: 'Accounting (Contabilidade)', base: 5 },
  { name: 'Anthropology (Antropologia)', base: 1 },
  { name: 'Appraise (Avaliar)', base: 5 },
  { name: 'Archaeology (Arqueologia)', base: 1 },
  { name: 'Art/Craft (Arte/Artesanato)', base: 5 },
  { name: 'Charm (Charme)', base: 15 },
  { name: 'Climb (Escalar)', base: 20 },
  { name: 'Computer Use (Computador)', base: 5 },
  { name: 'Credit Rating (Crédito)', base: 0 },
  { name: 'Cthulhu Mythos (Mitos de Cthulhu)', base: 0 },
  { name: 'Demolitions (Demolições)', base: 1 },
  { name: 'Disguise (Disfarce)', base: 5 },
  { name: 'Diving (Mergulho)', base: 1 },
  { name: 'Dodge (Esquivar)', base: 0 },
  { name: 'Drive Auto (Dirigir)', base: 20 },
  { name: 'Elec. Repair (Rep. Elétrica)', base: 10 },
  { name: 'Electronics (Eletrônica)', base: 1 },
  { name: 'Fast Talk (Conversa Fiada)', base: 5 },
  { name: 'Fighting (Brawl) (Luta)', base: 25 },
  { name: 'Firearms (Handgun) (Pistola)', base: 20 },
  { name: 'Firearms (Rifle/Shotgun) (Rifle)', base: 25 },
  { name: 'Firearms (Submachine Gun) (Submetralhadora)', base: 15 },
  { name: 'First Aid (Primeiros Socorros)', base: 30 },
  { name: 'History (História)', base: 5 },
  { name: 'Intimidate (Intimidar)', base: 15 },
  { name: 'Jump (Saltar)', base: 20 },
  { name: 'Language (Other) (Idioma - Outro)', base: 1 },
  { name: 'Language (Own) (Idioma - Próprio)', base: 0 },
  { name: 'Law (Direito)', base: 5 },
  { name: 'Library Use (Pesquisa em Biblioteca)', base: 20 },
  { name: 'Listen (Ouvir)', base: 20 },
  { name: 'Locksmith (Ladrão de Cofres)', base: 1 },
  { name: 'Mech. Repair (Rep. Mecânica)', base: 10 },
  { name: 'Medicine (Medicina)', base: 1 },
  { name: 'Natural World (Mundo Natural)', base: 10 },
  { name: 'Navigate (Navegação)', base: 10 },
  { name: 'Occult (Ocultismo)', base: 5 },
  { name: 'Op. Heavy Machinery (Op. Máq. Pesada)', base: 1 },
  { name: 'Persuade (Persuadir)', base: 10 },
  { name: 'Photography (Fotografia)', base: 1 },
  { name: 'Pilot (Pilotagem)', base: 1 },
  { name: 'Psychology (Psicologia)', base: 10 },
  { name: 'Psychoanalysis (Psicanálise)', base: 1 },
  { name: 'Read Lips (Leitura Labial)', base: 1 },
  { name: 'Ride (Equitação)', base: 5 },
  { name: 'Science (Ciência)', base: 1 },
  { name: 'Sleight of Hand (Prestidigitação)', base: 10 },
  { name: 'Spot Hidden (Detectar)', base: 25 },
  { name: 'Stealth (Furtividade)', base: 20 },
  { name: 'Survival (Sobrevivência)', base: 10 },
  { name: 'Swim (Nadar)', base: 20 },
  { name: 'Throw (Arremesso)', base: 20 },
  { name: 'Track (Rastrear)', base: 10 },
];

function createDefaultSkills(characterId, dex, edu) {
  for (const skill of DEFAULT_SKILLS) {
    let base = skill.base;
    if (skill.name.includes('Dodge')) base = Math.floor(dex / 2);
    if (skill.name.includes('Language (Own)')) base = edu;
    // Credit Rating is always an occupation skill in CoC 7e
    const isOcc = skill.name.includes('Credit Rating') ? 1 : 0;
    db.run(
      'INSERT INTO skills (character_id, name, base_value, value, is_occupation) VALUES (?, ?, ?, ?, ?)',
      [characterId, skill.name, base, base, isOcc]
    );
  }
  saveDb();
}

// ─── Character Queries ───────────────────────────────────────
const characterQueries = {
  listAll() {
    return query('SELECT id, name, player, occupation, age FROM characters ORDER BY updated_at DESC');
  },

  getById(id) {
    const c = queryOne('SELECT * FROM characters WHERE id = ?', [id]);
    if (!c) return null;
    c.skills      = query('SELECT * FROM skills WHERE character_id = ? ORDER BY name', [id]);
    c.weapons     = query('SELECT * FROM weapons WHERE character_id = ?', [id]);
    c.possessions = query('SELECT * FROM possessions WHERE character_id = ?', [id]);
    return c;
  },

  create(data) {
    const hpMax  = data.hp_max  ?? Math.floor(((data.con || 50) + (data.siz || 50)) / 10);
    const mpMax  = data.mp_max  ?? Math.floor((data.pow || 50) / 5);
    const sanVal = data.san_max ?? (data.pow || 50) * 5;
    db.run(`
      INSERT INTO characters
        (name, player, occupation, age, gender, residence, birthplace,
         str, dex, int_val, con, app, pow, siz, edu, luck,
         hp_current, hp_max, mp_current, mp_max, san_current, san_max)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.name || 'Novo Investigador',
        data.player || '', data.occupation || '',
        data.age || 25, data.gender || '', data.residence || '', data.birthplace || '',
        data.str || 50, data.dex || 50, data.int_val || 50,
        data.con || 50, data.app || 50, data.pow || 50,
        data.siz || 50, data.edu || 50, data.luck || 50,
        data.hp_current ?? hpMax, hpMax,
        data.mp_current ?? mpMax, mpMax,
        data.san_current ?? sanVal, sanVal,
      ]
    );
    const id = lastInsertId();
    saveDb();
    createDefaultSkills(id, data.dex || 50, data.edu || 50);
    return id;
  },

  // Internal: insert row only, no skills
  _createRaw(data) {
    const hpMax  = data.hp_max  ?? Math.floor(((data.con || 50) + (data.siz || 50)) / 10);
    const mpMax  = data.mp_max  ?? Math.floor((data.pow || 50) / 5);
    const sanVal = data.san_max ?? (data.pow || 50) * 5;
    db.run(`
      INSERT INTO characters
        (name, player, occupation, age, gender, residence, birthplace,
         str, dex, int_val, con, app, pow, siz, edu, luck,
         hp_current, hp_max, mp_current, mp_max, san_current, san_max)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.name || 'Importado', data.player || '', data.occupation || '',
        data.age || 25, data.gender || '', data.residence || '', data.birthplace || '',
        data.str || 50, data.dex || 50, data.int_val || 50,
        data.con || 50, data.app || 50, data.pow || 50,
        data.siz || 50, data.edu || 50, data.luck || 50,
        data.hp_current ?? hpMax, hpMax,
        data.mp_current ?? mpMax, mpMax,
        data.san_current ?? sanVal, sanVal,
      ]
    );
    const id = lastInsertId();
    // Copy remaining text fields
    const textFields = ['appearance_desc','ideology','significant_people','meaningful_locations',
      'treasured_possessions','traits','injuries_scars','phobias_manias','arcane_tomes','backstory','notes','image'];
    const updates = {};
    textFields.forEach(f => { if (data[f]) updates[f] = data[f]; });
    if (Object.keys(updates).length) {
      const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
      db.run(`UPDATE characters SET ${setClause} WHERE id = ?`, [...Object.values(updates), id]);
    }
    saveDb();
    return id;
  },

  // Import: creates character + restores skills/weapons/possessions from JSON
  import(data) {
    const id = this._createRaw(data);

    if (data.skills?.length) {
      for (const s of data.skills) {
        db.run(
          'INSERT INTO skills (character_id, name, base_value, value, is_occupation, is_interest) VALUES (?,?,?,?,?,?)',
          [id, s.name, s.base_value || 0, s.value || 0, s.is_occupation || 0, s.is_interest || 0]
        );
      }
      saveDb();
    } else {
      createDefaultSkills(id, data.dex || 50, data.edu || 50);
    }

    for (const w of (data.weapons || [])) {
      db.run(
        'INSERT INTO weapons (character_id, name, skill, damage, range, attacks_per_round, ammo, malfunction) VALUES (?,?,?,?,?,?,?,?)',
        [id, w.name || '', w.skill || '', w.damage || '', w.range || '', w.attacks_per_round || '1', w.ammo || 0, w.malfunction || 100]
      );
    }
    for (const p of (data.possessions || [])) {
      db.run('INSERT INTO possessions (character_id, item) VALUES (?,?)', [id, p.item || '']);
    }
    saveDb();
    return id;
  },

  update(id, data) {
    const allowed = [
      'name','player','occupation','age','gender','residence','birthplace',
      'str','dex','int_val','con','app','pow','siz','edu','luck',
      'hp_current','hp_max','mp_current','mp_max','san_current','san_max',
      'temporary_insanity','indefinite_insanity',
      'appearance_desc','ideology','significant_people','meaningful_locations',
      'treasured_possessions','traits','injuries_scars','phobias_manias',
      'arcane_tomes','backstory','notes','image',
    ];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    db.run(
      `UPDATE characters SET ${setClause}, updated_at = datetime('now') WHERE id = ?`,
      [...fields.map(f => data[f]), id]
    );
    saveDb();
  },

  delete(id) {
    ['skills','weapons','possessions','dice_history'].forEach(t =>
      db.run(`DELETE FROM ${t} WHERE character_id = ?`, [id])
    );
    db.run('DELETE FROM characters WHERE id = ?', [id]);
    saveDb();
  },
};

// ─── Skill Queries ───────────────────────────────────────────
const skillQueries = {
  update(id, data) {
    db.run(
      'UPDATE skills SET value=?, is_occupation=?, is_interest=? WHERE id=?',
      [data.value, data.is_occupation ? 1 : 0, data.is_interest ? 1 : 0, id]
    );
    saveDb();
  },
  updateByName(characterId, nameLike, base) {
    db.run(
      "UPDATE skills SET base_value=? WHERE character_id=? AND name LIKE ?",
      [base, characterId, `%${nameLike}%`]
    );
    saveDb();
  },
};

// ─── Weapon Queries ──────────────────────────────────────────
const weaponQueries = {
  create(characterId) {
    db.run('INSERT INTO weapons (character_id) VALUES (?)', [characterId]);
    const id = lastInsertId(); saveDb(); return id;
  },
  update(id, data) {
    db.run(
      'UPDATE weapons SET name=?,skill=?,damage=?,range=?,attacks_per_round=?,ammo=?,malfunction=? WHERE id=?',
      [data.name,data.skill,data.damage,data.range,data.attacks_per_round,data.ammo,data.malfunction,id]
    );
    saveDb();
  },
  delete(id) { db.run('DELETE FROM weapons WHERE id=?', [id]); saveDb(); },
};

// ─── Possession Queries ──────────────────────────────────────
const possessionQueries = {
  create(characterId, item) {
    db.run('INSERT INTO possessions (character_id, item) VALUES (?,?)', [characterId, item]);
    const id = lastInsertId(); saveDb(); return id;
  },
  update(id, item) { db.run('UPDATE possessions SET item=? WHERE id=?', [item, id]); saveDb(); },
  delete(id) { db.run('DELETE FROM possessions WHERE id=?', [id]); saveDb(); },
};

// ─── Dice Queries ────────────────────────────────────────────
const diceQueries = {
  addHistory(characterId, expression, result, details) {
    db.run(
      'INSERT INTO dice_history (character_id, expression, result, details) VALUES (?,?,?,?)',
      [characterId || null, expression, result, details]
    );
    saveDb();
  },
  getHistory(characterId, limit = 20) {
    return characterId
      ? query('SELECT * FROM dice_history WHERE character_id=? ORDER BY rolled_at DESC LIMIT ?', [characterId, limit])
      : query('SELECT * FROM dice_history ORDER BY rolled_at DESC LIMIT ?', [limit]);
  },
};

// ─── Config Queries ──────────────────────────────────────────
const configQueries = {
  getAll() {
    const rows = query('SELECT key, value FROM config');
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    return obj;
  },
  set(key, value) {
    if (queryOne('SELECT key FROM config WHERE key=?', [key])) {
      db.run('UPDATE config SET value=? WHERE key=?', [value, key]);
    } else {
      db.run('INSERT INTO config (key, value) VALUES (?,?)', [key, value]);
    }
    saveDb();
  },
  resetToDefaults() {
    for (const [k, v] of Object.entries(DEFAULT_CONFIG)) {
      db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?,?)', [k, v]);
    }
    saveDb();
    return DEFAULT_CONFIG;
  },
};

// ─── Evidence Queries ────────────────────────────────────────
const evidenceQueries = {
  listAll() {
    return query('SELECT * FROM evidence ORDER BY created_at DESC');
  },
  getById(id) {
    return queryOne('SELECT * FROM evidence WHERE id = ?', [id]);
  },
  create(data) {
    db.run(
      'INSERT INTO evidence (title, description, session_tag, image) VALUES (?, ?, ?, ?)',
      [data.title || 'Nova Evidência', data.description || '', data.session_tag || '', data.image || '']
    );
    const id = lastInsertId();
    saveDb();
    return id;
  },
  update(id, data) {
    const allowed = ['title', 'description', 'session_tag', 'image'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    db.run(`UPDATE evidence SET ${setClause} WHERE id = ?`, [...fields.map(f => data[f]), id]);
    saveDb();
  },
  delete(id) {
    db.run('DELETE FROM evidence WHERE id = ?', [id]);
    saveDb();
  },
};

module.exports = {
  initDb, getDb,
  characterQueries, skillQueries, weaponQueries,
  possessionQueries, diceQueries, configQueries, evidenceQueries,
  DEFAULT_CONFIG,
};
