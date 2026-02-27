'use strict';

// ─── Estado Global ────────────────────────────────────────────
const state = {
  characters: [],
  current: null,
  config: {},
  saveTimeout: null,
  diceQty: 1,
  diceSides: 6,
  diceBonus: 0,
  dicePenalty: 0,
  rollTarget: null,   // { name, value } para testes de habilidade/atributo
  gmMode: false,
  gmCharacters: [],
};

// ─── API ──────────────────────────────────────────────────────
const api = {
  async get(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async put(url, body) {
    const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(url) {
    const r = await fetch(url, { method: 'DELETE' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};

// ─── Utilidades ───────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const half  = v => Math.floor(v / 2);
const fifth = v => Math.floor(v / 5);

function calcDamageBonus(str, siz) {
  const t = str + siz;
  if (t <= 64)  return { db: '-2', build: -2 };
  if (t <= 84)  return { db: '-1', build: -1 };
  if (t <= 124) return { db: 'Nenhum', build: 0 };
  if (t <= 164) return { db: '+1d4', build: 1 };
  if (t <= 204) return { db: '+1d6', build: 2 };
  if (t <= 284) return { db: '+2d6', build: 3 };
  if (t <= 364) return { db: '+3d6', build: 4 };
  return { db: '+4d6', build: 5 };
}

function showSaveIndicator() {
  const el = $('#save-indicator');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(state.saveTimeout);
  state.saveTimeout = setTimeout(() => el.classList.remove('visible'), 2000);
}

function debounceSave(fn, delay = 600) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ─── Formula Evaluator ────────────────────────────────────────
function evalFormula(formula, stats) {
  const { str = 50, dex = 50, int_val = 50, con = 50, app = 50, pow = 50, siz = 50, edu = 50, luck = 50, age = 25 } = stats;
  try {
    // new Function has access to global Math
    const fn = new Function('STR','DEX','INT','CON','APP','POW','SIZ','EDU','LUCK','AGE',
      `"use strict"; return (${formula});`);
    const result = fn(str, dex, int_val, con, app, pow, siz, edu, luck, age);
    if (typeof result !== 'number' || isNaN(result)) return null;
    return Math.max(0, Math.floor(result));
  } catch (e) {
    return null;
  }
}

// ─── CoC 7e: Nível de Sucesso ─────────────────────────────────
function cocSuccessLevel(roll, targetValue) {
  const extreme = Math.floor(targetValue / 5);
  const hard    = Math.floor(targetValue / 2);
  const fumble  = targetValue < 50 ? 96 : 100;

  if (roll === 1)            return { label: 'SUCESSO CRÍTICO!', cls: 'result-extreme' };
  if (roll <= extreme)       return { label: 'SUCESSO EXTREMO',  cls: 'result-extreme' };
  if (roll <= hard)          return { label: 'SUCESSO DIFÍCIL',  cls: 'result-hard' };
  if (roll <= targetValue)   return { label: 'SUCESSO',          cls: 'result-success' };
  if (roll >= fumble)        return { label: 'FUMBLE!',           cls: 'result-fumble' };
  return                            { label: 'FRACASSO',          cls: 'result-fail' };
}

// ─── Init ─────────────────────────────────────────────────────
async function init() {
  await Promise.all([loadCharacters(), loadConfig()]);
  setupEventListeners();
  setupDiceRoller();
  setupGmView();
  setupConfigPage();
  setupPortrait();
  setupBooks();
  setupEvidence();
}

async function loadConfig() {
  try {
    state.config = await api.get('/api/config');
    updateAutoCalcBadge();
  } catch (e) {
    console.error('Erro ao carregar config:', e);
    state.config = {};
  }
}

function updateAutoCalcBadge() {
  const badge = $('#auto-calc-badge');
  if (!badge) return;
  const on = state.config.auto_calc === 'true';
  badge.style.display = on ? '' : 'none';
}

// ─── Recalcular vitais automaticamente ───────────────────────
async function recalcVitals() {
  if (!state.current || state.config.auto_calc !== 'true') return;
  const c = state.current;
  const stats = { str: c.str, dex: c.dex, int_val: c.int_val, con: c.con, app: c.app, pow: c.pow, siz: c.siz, edu: c.edu, luck: c.luck, age: c.age || 25 };

  const newHpMax  = evalFormula(state.config.formula_hp,  stats);
  const newMpMax  = evalFormula(state.config.formula_mp,  stats);
  const newSanMax = evalFormula(state.config.formula_san, stats);

  const updates = {};
  if (newHpMax  !== null && newHpMax  !== c.hp_max)  { updates.hp_max  = newHpMax;  if (c.hp_current  > newHpMax)  updates.hp_current  = newHpMax; }
  if (newMpMax  !== null && newMpMax  !== c.mp_max)  { updates.mp_max  = newMpMax;  if (c.mp_current  > newMpMax)  updates.mp_current  = newMpMax; }
  if (newSanMax !== null && newSanMax !== c.san_max) { updates.san_max = newSanMax; if (c.san_current > newSanMax) updates.san_current = newSanMax; }

  if (Object.keys(updates).length) {
    Object.assign(c, updates);
    updateVitalDisplay('hp',  c.hp_current,  c.hp_max);
    updateVitalDisplay('mp',  c.mp_current,  c.mp_max);
    updateVitalDisplay('san', c.san_current, c.san_max);
    if (updates.hp_max  !== undefined) $('#vital-hp-max').value  = c.hp_max;
    if (updates.mp_max  !== undefined) $('#vital-mp-max').value  = c.mp_max;
    if (updates.san_max !== undefined) $('#vital-san-max').value = c.san_max;
    await api.put(`/api/characters/${c.id}`, updates);
    showSaveIndicator();
  }

  // Atualiza base da Dodge e Language Own se fórmulas configuradas
  if (state.config.formula_dodge) {
    const dodgeBase = evalFormula(state.config.formula_dodge, stats);
    if (dodgeBase !== null) {
      const dodgeSkill = c.skills?.find(s => s.name.includes('Dodge'));
      if (dodgeSkill && dodgeSkill.base_value !== dodgeBase) {
        await api.put(`/api/skills/${dodgeSkill.id}`, { value: Math.max(dodgeSkill.value, dodgeBase), is_occupation: dodgeSkill.is_occupation, is_interest: dodgeSkill.is_interest });
        dodgeSkill.base_value = dodgeBase;
      }
    }
  }

  // Auto-calc Briga (Fighting/Brawl) base
  if (state.config.formula_brawl) {
    const brawlBase = evalFormula(state.config.formula_brawl, stats);
    if (brawlBase !== null) {
      const brawlSkill = c.skills?.find(s => s.name.includes('Fighting') && s.name.includes('Brawl'));
      if (brawlSkill && brawlSkill.base_value !== brawlBase) {
        const newVal = Math.max(brawlSkill.value, brawlBase);
        await api.put(`/api/skills/${brawlSkill.id}`, { value: newVal, is_occupation: brawlSkill.is_occupation, is_interest: brawlSkill.is_interest });
        brawlSkill.base_value = brawlBase;
        if (brawlSkill.value < brawlBase) { brawlSkill.value = brawlBase; renderSkills(); }
      }
    }
  }

  // Update SAN max hint for Cthulhu Mythos
  updateSanMaxHint();
}

function updateSanMaxHint() {
  const hint = $('#san-max-hint');
  if (!hint || !state.current?.skills) return;
  const cthulhu = state.current.skills.find(s => s.name.includes('Cthulhu Mythos'));
  const mv = cthulhu?.value || 0;
  if (mv > 0) {
    hint.textContent = `Mitos de Cthulhu: ${mv}% → SAN máx. teórica: ${99 - mv}`;
  } else {
    hint.textContent = '';
  }
}

// ─── Age warning ──────────────────────────────────────────────
function updateAgeWarning(age) {
  const box = $('#age-warning');
  if (!box) return;
  if (!age || age < 40) { box.style.display = 'none'; return; }
  let msg = '';
  if (age < 50)      msg = 'Década de 40: −5 em APP e −5 pontos distribuídos entre STR, CON, DEX ou POW.';
  else if (age < 60) msg = 'Década de 50: −10 em APP e −10 pontos distribuídos (máx. −5 por atributo) entre STR, CON, DEX ou POW.';
  else if (age < 70) msg = 'Década de 60: −15 em APP e −20 pontos distribuídos entre STR, CON, DEX ou POW.';
  else if (age < 80) msg = 'Década de 70: −20 em APP e −40 pontos distribuídos entre STR, CON, DEX ou POW.';
  else               msg = 'Década de 80+: −25 em APP e −80 pontos distribuídos entre STR, CON, DEX ou POW.';
  box.textContent = '⚠ CoC 7e — Penalidade de Idade: ' + msg;
  box.style.display = '';
}

// ─── Carregamento de personagens ─────────────────────────────
async function loadCharacters() {
  try {
    state.characters = await api.get('/api/characters');
    renderCharacterList();
  } catch (e) { console.error('Erro:', e); }
}

function renderCharacterList() {
  const list = $('#character-list');
  if (!state.characters.length) {
    list.innerHTML = '<li class="char-list-empty">Nenhum investigador criado</li>';
    return;
  }
  list.innerHTML = state.characters.map(c => `
    <li class="char-list-item${state.current?.id === c.id ? ' active' : ''}" data-id="${c.id}">
      <span class="char-item-name">${c.name || 'Sem nome'}</span>
      <span class="char-item-sub">${[c.occupation, c.age ? `${c.age} anos` : ''].filter(Boolean).join(' · ') || '—'}</span>
    </li>`).join('');

  $$('.char-list-item').forEach(el =>
    el.addEventListener('click', () => selectCharacter(+el.dataset.id))
  );
}

async function selectCharacter(id) {
  try {
    state.current = await api.get(`/api/characters/${id}`);
    showSheet();
    renderCharacterList();
  } catch (e) { console.error(e); }
}

// ─── Render da ficha ──────────────────────────────────────────
function showSheet() {
  const c = state.current;
  if (!c) return;
  // Sai do modo GM se ativo
  if (state.gmMode) exitGmMode();
  $('#empty-state').style.display   = 'none';
  $('#character-sheet').style.display = 'block';
  populateSheet(c);
}

function populateSheet(c) {
  $('#field-name').value       = c.name || '';
  $('#field-player').value     = c.player || '';
  $('#field-occupation').value = c.occupation || '';
  $('#field-age').value        = c.age || '';
  $('#field-gender').value     = c.gender || '';
  $('#field-residence').value  = c.residence || '';
  $('#field-birthplace').value = c.birthplace || '';

  const stats = ['str','dex','int_val','con','app','pow','siz','edu','luck'];
  stats.forEach(s => {
    const v = c[s] || 0;
    $(`#stat-${s}`).value = v;
    $(`#stat-${s}-half`).textContent  = half(v);
    $(`#stat-${s}-fifth`).textContent = fifth(v);
  });

  updateVitalDisplay('hp',  c.hp_current,  c.hp_max);
  updateVitalDisplay('mp',  c.mp_current,  c.mp_max);
  updateVitalDisplay('san', c.san_current, c.san_max);
  $('#vital-hp-max').value  = c.hp_max  || 0;
  $('#vital-mp-max').value  = c.mp_max  || 0;
  $('#vital-san-max').value = c.san_max || 0;

  $('#flag-temp-insanity').checked = !!c.temporary_insanity;
  $('#flag-indef-insanity').checked = !!c.indefinite_insanity;
  $('#flag-major-wound').checked   = !!c.major_wound;
  $('#flag-unconscious').checked   = !!c.unconscious;

  updateDerivedStats();
  updateAgeWarning(c.age);
  updateSanMaxHint();
  displayPortrait(c.image || '');
  renderSkills(); // calls updateSkillPoints() internally
  renderWeapons();
  renderPossessions();

  // Background fields
  const bgMap = [
    ['#bg-appearance','appearance_desc'], ['#bg-ideology','ideology'],
    ['#bg-significant-people','significant_people'], ['#bg-meaningful-locations','meaningful_locations'],
    ['#bg-treasured-possessions','treasured_possessions'], ['#bg-traits','traits'],
    ['#bg-injuries','injuries_scars'], ['#bg-phobias','phobias_manias'],
    ['#bg-arcane','arcane_tomes'], ['#bg-backstory','backstory'], ['#bg-notes','notes'],
  ];
  bgMap.forEach(([sel, field]) => { const el = $(sel); if (el) el.value = c[field] || ''; });
}

function updateVitalDisplay(vital, current, max) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  $(`#vital-${vital}-current`).textContent = current ?? 0;
  const bar = $(`#bar-${vital}`);
  bar.style.width = `${pct}%`;
  if (vital === 'hp') {
    bar.style.background = pct <= 20 ? '#ff2020' : pct <= 50 ? '#c0392b' : '#8b2020';
  }
}

function updateDerivedStats() {
  const c = state.current;
  if (!c) return;
  const stats = { str: c.str, dex: c.dex, int_val: c.int_val, con: c.con, app: c.app, pow: c.pow, siz: c.siz, edu: c.edu, luck: c.luck, age: c.age || 25 };
  const { db, build } = calcDamageBonus(stats.str || 0, stats.siz || 0);

  let mov = null;
  if (state.config?.formula_mov) {
    mov = evalFormula(state.config.formula_mov, stats);
  }
  if (mov === null) {
    mov = (stats.str > stats.siz && stats.dex > stats.siz) ? 9
        : (stats.str < stats.siz && stats.dex < stats.siz) ? 7 : 8;
    const age = stats.age;
    if (age >= 80) mov -= 5; else if (age >= 70) mov -= 4;
    else if (age >= 60) mov -= 3; else if (age >= 50) mov -= 2;
    else if (age >= 40) mov -= 1;
  }

  const movEl = $('#vital-mov-value');
  if (movEl) movEl.textContent = mov ?? '?';
  const dbEl = $('#derived-db');     if (dbEl) dbEl.textContent = db;
  const buEl = $('#derived-build');  if (buEl) buEl.textContent = build;
}

// ─── Skills ───────────────────────────────────────────────────
function renderSkills() {
  const grid = $('#skills-grid');
  const skills = state.current?.skills || [];
  if (!skills.length) { grid.innerHTML = '<p style="color:var(--text-muted)">Nenhuma habilidade</p>'; return; }

  grid.innerHTML = skills.map(s => {
    const isOcc = !!s.is_occupation, isInt = !!s.is_interest;
    return `
    <div class="skill-row${isOcc ? ' has-occ' : ''}${isInt ? ' has-int' : ''}" data-skill-id="${s.id}">
      <input type="checkbox" class="skill-cb occ" ${isOcc ? 'checked' : ''} title="Ocupação" />
      <input type="checkbox" class="skill-cb int" ${isInt ? 'checked' : ''} title="Interesse" />
      <span class="skill-name" title="${s.name}">${s.name}</span>
      <input type="number" class="skill-input base" value="${s.base_value}" min="0" max="99" readonly title="Base" />
      <input type="number" class="skill-input" value="${s.value}" min="0" max="99" title="Valor" />
      <span class="skill-half-fifth" style="font-size:0.68rem;color:var(--text-muted);text-align:center">${half(s.value)}/${fifth(s.value)}</span>
      <button class="skill-roll-btn" data-skill-id="${s.id}" title="Rolar d100 contra ${s.name}">🎲</button>
    </div>`;
  }).join('');

  grid.querySelectorAll('.skill-row').forEach(row => {
    const sId = +row.dataset.skillId;
    const cbOcc = row.querySelector('.skill-cb.occ');
    const cbInt = row.querySelector('.skill-cb.int');
    const valInput = row.querySelectorAll('.skill-input')[1];
    const halfFifth = row.querySelector('.skill-half-fifth');

    const save = () => {
      const val = +valInput.value || 0;
      if (halfFifth) halfFifth.textContent = `${half(val)}/${fifth(val)}`;
      row.classList.toggle('has-occ', cbOcc.checked);
      row.classList.toggle('has-int', cbInt.checked);
      api.put(`/api/skills/${sId}`, { value: val, is_occupation: cbOcc.checked ? 1 : 0, is_interest: cbInt.checked ? 1 : 0 })
        .then(() => {
          const sk = state.current.skills.find(s => s.id === sId);
          if (sk) { sk.value = val; sk.is_occupation = cbOcc.checked ? 1 : 0; sk.is_interest = cbInt.checked ? 1 : 0; }
          // If Cthulhu Mythos changed, update SAN hint
          if (sk?.name.includes('Cthulhu Mythos')) updateSanMaxHint();
          showSaveIndicator();
        }).catch(console.error);
    };

    cbOcc.addEventListener('change', save);
    cbInt.addEventListener('change', save);
    valInput.addEventListener('change', () => { save(); setTimeout(updateSkillPoints, 50); });

    // Click to roll
    row.querySelector('.skill-roll-btn').addEventListener('click', () => {
      const sk = state.current.skills.find(s => s.id === sId);
      if (!sk) return;
      openDiceRollerWithTarget(sk.name, sk.value);
    });
  });

  updateSkillPoints();
}

// ─── Skill Points Tracker ────────────────────────────────────
function updateSkillPoints() {
  const c = state.current;
  const tracker = $('#sp-tracker');
  if (!c || !tracker) return;

  const stats = { str: c.str, dex: c.dex, int_val: c.int_val, con: c.con, app: c.app, pow: c.pow, siz: c.siz, edu: c.edu, luck: c.luck, age: c.age || 25 };
  const occTotal = evalFormula(state.config.formula_occ_points || 'EDU * 4', stats) ?? (c.edu * 4);
  const intTotal = evalFormula(state.config.formula_int_points || 'INT * 2', stats) ?? (c.int_val * 2);

  let occUsed = 0, intUsed = 0;
  (c.skills || []).forEach(s => {
    const raised = Math.max(0, (s.value || 0) - (s.base_value || 0));
    if (s.is_occupation) occUsed += raised;
    else if (s.is_interest) intUsed += raised;
  });

  const occAvail = occTotal - occUsed;
  const intAvail = intTotal - intUsed;

  $('#sp-occ-used').textContent  = occUsed;
  $('#sp-occ-total').textContent = occTotal;
  $('#sp-int-used').textContent  = intUsed;
  $('#sp-int-total').textContent = intTotal;

  const occEl = $('#sp-occ-avail');
  occEl.textContent = occAvail >= 0 ? `${occAvail} disp.` : `${Math.abs(occAvail)} excesso`;
  occEl.className   = 'sp-avail' + (occAvail < 0 ? ' sp-over' : occAvail === 0 ? ' sp-zero' : '');

  const intEl = $('#sp-int-avail');
  intEl.textContent = intAvail >= 0 ? `${intAvail} disp.` : `${Math.abs(intAvail)} excesso`;
  intEl.className   = 'sp-avail' + (intAvail < 0 ? ' sp-over' : intAvail === 0 ? ' sp-zero' : '');

  const occPct = occTotal > 0 ? Math.min(100, (occUsed / occTotal) * 100) : 0;
  const intPct = intTotal > 0 ? Math.min(100, (intUsed / intTotal) * 100) : 0;
  const occBar = $('#sp-occ-bar');
  const intBar = $('#sp-int-bar');
  if (occBar) { occBar.style.width = `${occPct}%`; occBar.classList.toggle('sp-over', occAvail < 0); }
  if (intBar) { intBar.style.width = `${intPct}%`; intBar.classList.toggle('sp-over', intAvail < 0); }

  // Update hints on Investigador tab
  const hintOcc = $('#sph-occ');
  const hintInt = $('#sph-int');
  if (hintOcc) hintOcc.textContent = `${occAvail} / ${occTotal}`;
  if (hintInt) hintInt.textContent = `${intAvail} / ${intTotal}`;
}

// ─── Weapons ─────────────────────────────────────────────────
function renderWeapons() {
  const tbody = $('#weapons-tbody');
  const weapons = state.current?.weapons || [];
  if (!weapons.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Nenhuma arma cadastrada</td></tr>'; return; }

  tbody.innerHTML = weapons.map(w => `
    <tr data-weapon-id="${w.id}">
      <td><input class="weapon-input" data-field="name" value="${w.name||''}" placeholder="Arma" /></td>
      <td><input class="weapon-input" data-field="skill" value="${w.skill||''}" placeholder="%" style="width:60px"/></td>
      <td><input class="weapon-input" data-field="damage" value="${w.damage||''}" placeholder="1d6" style="width:70px"/></td>
      <td><input class="weapon-input" data-field="range" value="${w.range||''}" placeholder="Toque" style="width:70px"/></td>
      <td><input class="weapon-input" data-field="attacks_per_round" value="${w.attacks_per_round||'1'}" style="width:50px"/></td>
      <td><input class="weapon-input" type="number" data-field="ammo" value="${w.ammo||0}" style="width:50px"/></td>
      <td><input class="weapon-input" type="number" data-field="malfunction" value="${w.malfunction||100}" style="width:50px"/></td>
      <td><button class="btn-remove btn-remove-weapon" data-id="${w.id}">✕</button></td>
    </tr>`).join('');

  tbody.querySelectorAll('tr[data-weapon-id]').forEach(row => {
    const wId = +row.dataset.weaponId;
    const save = () => {
      const data = {};
      row.querySelectorAll('[data-field]').forEach(i => { data[i.dataset.field] = i.type === 'number' ? (+i.value||0) : i.value; });
      api.put(`/api/weapons/${wId}`, data).then(() => showSaveIndicator()).catch(console.error);
    };
    row.querySelectorAll('[data-field]').forEach(i => i.addEventListener('change', save));
  });

  tbody.querySelectorAll('.btn-remove-weapon').forEach(btn =>
    btn.addEventListener('click', async () => {
      await api.delete(`/api/weapons/${+btn.dataset.id}`);
      state.current.weapons = state.current.weapons.filter(w => w.id !== +btn.dataset.id);
      renderWeapons();
    })
  );
}

// ─── Possessions ─────────────────────────────────────────────
function renderPossessions() {
  const list = $('#possessions-list');
  const posses = state.current?.possessions || [];
  if (!posses.length) { list.innerHTML = '<li class="empty-row">Nenhum item</li>'; return; }

  list.innerHTML = posses.map(p => `
    <li class="possession-item" data-poss-id="${p.id}">
      <input class="possession-input" value="${p.item||''}" placeholder="Item..." />
      <button class="btn-remove btn-remove-poss" data-id="${p.id}">✕</button>
    </li>`).join('');

  list.querySelectorAll('.possession-item').forEach(li => {
    const pId = +li.dataset.possId;
    const inp = li.querySelector('.possession-input');
    inp.addEventListener('change', () =>
      api.put(`/api/possessions/${pId}`, { item: inp.value }).then(() => showSaveIndicator()).catch(console.error)
    );
  });
  list.querySelectorAll('.btn-remove-poss').forEach(btn =>
    btn.addEventListener('click', async () => {
      await api.delete(`/api/possessions/${+btn.dataset.id}`);
      state.current.possessions = state.current.possessions.filter(p => p.id !== +btn.dataset.id);
      renderPossessions();
    })
  );
}

// ─── Scheduled save (debounced) ───────────────────────────────
const scheduleSave = debounceSave(async (fields) => {
  if (!state.current) return;
  try {
    const updated = await api.put(`/api/characters/${state.current.id}`, fields);
    Object.assign(state.current, updated);
    showSaveIndicator();
    updateDerivedStats();
  } catch (e) { console.error('Erro ao salvar:', e); }
}, 600);

// ─── Event Listeners ──────────────────────────────────────────
function setupEventListeners() {
  // Novo personagem
  const openNew = () => $('#new-char-modal').classList.add('open');
  $('#btn-new-character').addEventListener('click', openNew);
  $('#btn-new-char-empty').addEventListener('click', openNew);
  $('#new-char-modal-close').addEventListener('click', () => $('#new-char-modal').classList.remove('open'));
  $('#btn-cancel-new-char').addEventListener('click', () => $('#new-char-modal').classList.remove('open'));

  $('#btn-confirm-new-char').addEventListener('click', async () => {
    const name = $('#nc-name').value.trim();
    if (!name) { alert('Informe o nome do investigador'); return; }
    try {
      const newChar = await api.post('/api/characters', {
        name,
        player: $('#nc-player').value.trim(),
        occupation: $('#nc-occupation').value.trim(),
      });
      state.characters.unshift({ id: newChar.id, name: newChar.name, player: newChar.player, occupation: newChar.occupation, age: newChar.age });
      renderCharacterList();
      await selectCharacter(newChar.id);
      $('#new-char-modal').classList.remove('open');
      $('#nc-name').value = ''; $('#nc-player').value = ''; $('#nc-occupation').value = '';
    } catch (e) { alert('Erro: ' + e.message); }
  });

  // Excluir
  $('#btn-delete-char').addEventListener('click', async () => {
    if (!state.current || !confirm(`Excluir "${state.current.name}"?`)) return;
    await api.delete(`/api/characters/${state.current.id}`);
    state.characters = state.characters.filter(c => c.id !== state.current.id);
    state.current = null;
    renderCharacterList();
    $('#character-sheet').style.display = 'none';
    $('#empty-state').style.display = 'flex';
  });

  // Exportar
  $('#btn-export-char').addEventListener('click', async () => {
    if (!state.current) return;
    try {
      const resp = await fetch(`/api/export/${state.current.id}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(state.current.name || 'personagem').replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao exportar: ' + e.message); }
  });

  // Importar
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const charData = parsed.character || parsed; // accept both formats
      if (!charData.name) { alert('JSON inválido: campo "name" não encontrado'); return; }
      const imported = await api.post('/api/import', { character: charData });
      state.characters.unshift({ id: imported.id, name: imported.name, player: imported.player, occupation: imported.occupation, age: imported.age });
      renderCharacterList();
      await selectCharacter(imported.id);
      alert(`"${imported.name}" importado com sucesso!`);
    } catch (e) { alert('Erro ao importar: ' + e.message); }
    e.target.value = '';
  });

  // Tabs
  $$('.tab').forEach(tab =>
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    })
  );

  // ── Campos básicos ──
  const bindText = (id, field) => $(id)?.addEventListener('input', () => {
    if (!state.current) return;
    state.current[field] = $(id).value;
    scheduleSave({ [field]: $(id).value });
    if (['name','occupation'].includes(field)) {
      const item = state.characters.find(c => c.id === state.current.id);
      if (item) { item[field] = $(id).value; renderCharacterList(); }
    }
  });

  bindText('#field-name','name'); bindText('#field-player','player');
  bindText('#field-occupation','occupation'); bindText('#field-gender','gender');
  bindText('#field-residence','residence'); bindText('#field-birthplace','birthplace');

  $('#field-age').addEventListener('change', () => {
    if (!state.current) return;
    const v = +$('#field-age').value || 0;
    state.current.age = v;
    scheduleSave({ age: v });
    updateDerivedStats();
    updateAgeWarning(v);
    recalcVitals();
    const item = state.characters.find(c => c.id === state.current.id);
    if (item) { item.age = v; renderCharacterList(); }
  });

  // ── Características ──
  const stats = ['str','dex','int_val','con','app','pow','siz','edu','luck'];
  stats.forEach(stat => {
    $(`#stat-${stat}`)?.addEventListener('input', () => {
      if (!state.current) return;
      const v = +$(`#stat-${stat}`).value || 0;
      $(`#stat-${stat}-half`).textContent  = half(v);
      $(`#stat-${stat}-fifth`).textContent = fifth(v);
      state.current[stat] = v;
      scheduleSave({ [stat]: v });
      updateDerivedStats();
      recalcVitals();
      if (stat === 'edu' || stat === 'int_val') updateSkillPoints();
    });

    // Roll button por característica
    document.querySelector(`.char-roll-btn[data-stat="${stat}"]`)?.addEventListener('click', () => {
      if (!state.current) return;
      const v = +$(`#stat-${stat}`).value || 0;
      const labels = { str:'FOR', dex:'DES', int_val:'INT', con:'CON', app:'APA', pow:'POD', siz:'TAM', edu:'EDU', luck:'SORTE' };
      openDiceRollerWithTarget(labels[stat] || stat.toUpperCase(), v);
    });
  });

  // ── Vitais +/- ──
  $$('.vital-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (!state.current) return;
    const vital = btn.dataset.vital;
    const dir = +btn.dataset.dir;
    const maxVal = state.current[`${vital}_max`] || 1;
    let cur = (state.current[`${vital}_current`] || 0) + dir;
    cur = Math.max(0, Math.min(maxVal, cur));
    state.current[`${vital}_current`] = cur;
    updateVitalDisplay(vital, cur, maxVal);
    await api.put(`/api/characters/${state.current.id}`, { [`${vital}_current`]: cur });
    showSaveIndicator();
  }));

  ['hp','mp','san'].forEach(vital =>
    $(`#vital-${vital}-max`)?.addEventListener('change', async () => {
      if (!state.current) return;
      const v = +$(`#vital-${vital}-max`).value || 0;
      state.current[`${vital}_max`] = v;
      if ((state.current[`${vital}_current`]||0) > v) state.current[`${vital}_current`] = v;
      updateVitalDisplay(vital, state.current[`${vital}_current`], v);
      await api.put(`/api/characters/${state.current.id}`, { [`${vital}_max`]: v, [`${vital}_current`]: state.current[`${vital}_current`] });
      showSaveIndicator();
    })
  );

  // ── Flags de estado ──
  [['#flag-temp-insanity','temporary_insanity'], ['#flag-indef-insanity','indefinite_insanity'],
   ['#flag-major-wound','major_wound'], ['#flag-unconscious','unconscious']].forEach(([sel, field]) => {
    $(sel)?.addEventListener('change', () => {
      if (!state.current) return;
      state.current[field] = $(sel).checked ? 1 : 0;
      scheduleSave({ [field]: state.current[field] });
    });
  });

  // Combate
  $('#btn-add-weapon').addEventListener('click', async () => {
    if (!state.current) return;
    const res = await api.post(`/api/characters/${state.current.id}/weapons`, {});
    state.current.weapons.push({ id: res.id, name:'', skill:'', damage:'', range:'', attacks_per_round:'1', ammo:0, malfunction:100 });
    renderWeapons();
  });

  $('#btn-add-possession').addEventListener('click', async () => {
    if (!state.current) return;
    const res = await api.post(`/api/characters/${state.current.id}/possessions`, { item:'' });
    state.current.possessions.push({ id: res.id, item:'' });
    renderPossessions();
  });

  // Background
  [['#bg-appearance','appearance_desc'], ['#bg-ideology','ideology'],
   ['#bg-significant-people','significant_people'], ['#bg-meaningful-locations','meaningful_locations'],
   ['#bg-treasured-possessions','treasured_possessions'], ['#bg-traits','traits'],
   ['#bg-injuries','injuries_scars'], ['#bg-phobias','phobias_manias'],
   ['#bg-arcane','arcane_tomes'], ['#bg-backstory','backstory'], ['#bg-notes','notes'],
  ].forEach(([sel, field]) =>
    $(sel)?.addEventListener('input', () => {
      if (state.current) scheduleSave({ [field]: $(sel).value });
    })
  );

  // Fechar modais ao clicar fora
  $$('.modal-overlay').forEach(o => o.addEventListener('click', e => {
    if (e.target === o) o.classList.remove('open');
  }));
}

// ─── GM View ──────────────────────────────────────────────────
function setupGmView() {
  $('#btn-gm-view').addEventListener('click', enterGmMode);
  $('#btn-gm-close').addEventListener('click', exitGmMode);
  $('#btn-gm-reload').addEventListener('click', loadGmView);
  $('#btn-gm-dice').addEventListener('click', () => $('#dice-modal').classList.add('open'));
}

async function enterGmMode() {
  state.gmMode = true;
  $('#character-sheet').style.display = 'none';
  $('#empty-state').style.display     = 'none';
  $('#gm-view').style.display         = 'block';
  await loadGmView();
}

function exitGmMode() {
  state.gmMode = false;
  $('#gm-view').style.display = 'none';
  if (state.current) {
    $('#character-sheet').style.display = 'block';
  } else {
    $('#empty-state').style.display = 'flex';
  }
}

async function loadGmView() {
  const grid = $('#gm-grid');
  grid.innerHTML = '<div class="gm-loading">Carregando investigadores...</div>';
  try {
    state.gmCharacters = await api.get('/api/gm');
    renderGmView();
  } catch (e) {
    grid.innerHTML = '<div class="gm-loading">Erro ao carregar personagens.</div>';
  }
}

function renderGmView() {
  const grid = $('#gm-grid');
  if (!state.gmCharacters.length) {
    grid.innerHTML = '<div class="gm-loading">Nenhum investigador criado ainda.</div>';
    return;
  }

  grid.innerHTML = state.gmCharacters.map(c => {
    const hpPct  = c.hp_max  ? Math.round((c.hp_current  / c.hp_max)  * 100) : 0;
    const mpPct  = c.mp_max  ? Math.round((c.mp_current  / c.mp_max)  * 100) : 0;
    const sanPct = c.san_max ? Math.round((c.san_current / c.san_max) * 100) : 0;
    const flags = [
      c.temporary_insanity  ? `<span class="gm-flag gm-flag-temp-insane">Insanidade Temp.</span>` : '',
      c.indefinite_insanity ? `<span class="gm-flag gm-flag-indef-insane">Insanidade Indef.</span>` : '',
      c.major_wound         ? `<span class="gm-flag gm-flag-wound">Ferimento Grave</span>` : '',
      c.unconscious         ? `<span class="gm-flag gm-flag-unconscious">Inconsciente</span>` : '',
    ].filter(Boolean).join('');

    return `
    <div class="gm-card" data-char-id="${c.id}">
      <div class="gm-card-header">
        <div>
          <span class="gm-char-name">${c.name || 'Sem nome'}</span>
          <span class="gm-char-occ">${c.occupation || '—'}${c.age ? ` · ${c.age} anos` : ''}</span>
        </div>
        <button class="btn btn-sm btn-ghost gm-open-btn" data-open-id="${c.id}">Ver Ficha</button>
      </div>
      <div class="gm-vitals">
        <div class="gm-vital-row">
          <span class="gm-vital-label">HP</span>
          <div class="gm-vital-bar"><div class="gm-vital-bar-fill gm-hp-bar" style="width:${hpPct}%"></div></div>
          <div class="gm-vital-controls">
            <button class="gm-btn" data-gm-vital="hp" data-gm-id="${c.id}" data-dir="-1">−</button>
            <span class="gm-vital-val" id="gm-hp-${c.id}">${c.hp_current}/${c.hp_max}</span>
            <button class="gm-btn" data-gm-vital="hp" data-gm-id="${c.id}" data-dir="1">+</button>
          </div>
        </div>
        <div class="gm-vital-row">
          <span class="gm-vital-label">MP</span>
          <div class="gm-vital-bar"><div class="gm-vital-bar-fill gm-mp-bar" style="width:${mpPct}%"></div></div>
          <div class="gm-vital-controls">
            <button class="gm-btn" data-gm-vital="mp" data-gm-id="${c.id}" data-dir="-1">−</button>
            <span class="gm-vital-val" id="gm-mp-${c.id}">${c.mp_current}/${c.mp_max}</span>
            <button class="gm-btn" data-gm-vital="mp" data-gm-id="${c.id}" data-dir="1">+</button>
          </div>
        </div>
        <div class="gm-vital-row">
          <span class="gm-vital-label">SAN</span>
          <div class="gm-vital-bar"><div class="gm-vital-bar-fill gm-san-bar" style="width:${sanPct}%"></div></div>
          <div class="gm-vital-controls">
            <button class="gm-btn" data-gm-vital="san" data-gm-id="${c.id}" data-dir="-1">−</button>
            <span class="gm-vital-val" id="gm-san-${c.id}">${c.san_current}/${c.san_max}</span>
            <button class="gm-btn" data-gm-vital="san" data-gm-id="${c.id}" data-dir="1">+</button>
          </div>
        </div>
      </div>
      ${flags ? `<div class="gm-status-flags">${flags}</div>` : ''}
      <div class="gm-notes">
        <textarea class="gm-notes-input" placeholder="Notas do mestre sobre este personagem..." data-notes-id="${c.id}">${c.notes || ''}</textarea>
      </div>
    </div>`;
  }).join('');

  // GM vital buttons
  grid.querySelectorAll('.gm-btn[data-gm-vital]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cId   = +btn.dataset.gmId;
      const vital = btn.dataset.gmVital;
      const dir   = +btn.dataset.dir;
      const c = state.gmCharacters.find(x => x.id === cId);
      if (!c) return;
      const maxVal = c[`${vital}_max`] || 1;
      let cur = (c[`${vital}_current`] || 0) + dir;
      cur = Math.max(0, Math.min(maxVal, cur));
      c[`${vital}_current`] = cur;
      // Update display
      const span = $(`#gm-${vital}-${cId}`);
      if (span) span.textContent = `${cur}/${maxVal}`;
      // Update bar
      const card = grid.querySelector(`.gm-card[data-char-id="${cId}"]`);
      const bars = { hp: 'gm-hp-bar', mp: 'gm-mp-bar', san: 'gm-san-bar' };
      const barEl = card?.querySelector(`.${bars[vital]}`);
      if (barEl) barEl.style.width = `${Math.round((cur / maxVal) * 100)}%`;
      // Save
      await api.put(`/api/characters/${cId}`, { [`${vital}_current`]: cur });
      // Also update state.current if it's this char
      if (state.current?.id === cId) {
        state.current[`${vital}_current`] = cur;
        updateVitalDisplay(vital, cur, maxVal);
      }
    });
  });

  // GM open full sheet
  grid.querySelectorAll('.gm-open-btn[data-open-id]').forEach(btn =>
    btn.addEventListener('click', async () => {
      await selectCharacter(+btn.dataset.openId);
      exitGmMode();
    })
  );

  // GM notes autosave
  grid.querySelectorAll('.gm-notes-input').forEach(textarea => {
    const cId = +textarea.dataset.notesId;
    textarea.addEventListener('change', () => {
      api.put(`/api/characters/${cId}`, { notes: textarea.value }).catch(console.error);
    });
  });
}

// ─── Config Page ──────────────────────────────────────────────
function setupConfigPage() {
  $('#btn-config').addEventListener('click', openConfigModal);
  $('#config-modal-close').addEventListener('click', () => $('#config-modal').classList.remove('open'));

  $('#cfg-save').addEventListener('click', saveConfig);
  $('#cfg-reset').addEventListener('click', async () => {
    if (!confirm('Resetar todas as fórmulas para os valores padrão da 7ª edição?')) return;
    const defaults = await api.post('/api/config/reset', {});
    state.config = defaults;
    populateConfigForm();
    updateAutoCalcBadge();
    alert('Fórmulas resetadas para os padrões do CoC 7e!');
  });

  $('#cfg-test').addEventListener('click', () => {
    if (!state.current) { alert('Selecione um personagem primeiro.'); return; }
    testFormulas();
  });
}

function openConfigModal() {
  populateConfigForm();
  $('#config-modal').classList.add('open');
}

function populateConfigForm() {
  const c = state.config;
  $('#cfg-auto-calc').checked          = c.auto_calc === 'true';
  $('#cfg-formula-hp').value           = c.formula_hp || '';
  $('#cfg-formula-mp').value           = c.formula_mp || '';
  $('#cfg-formula-san').value          = c.formula_san || '';
  $('#cfg-formula-dodge').value        = c.formula_dodge || '';
  $('#cfg-formula-lang-own').value     = c.formula_lang_own || '';
  $('#cfg-formula-mov').value          = c.formula_mov || '';
  $('#cfg-formula-occ-points').value   = c.formula_occ_points || '';
  $('#cfg-formula-int-points').value   = c.formula_int_points || '';
  $('#cfg-formula-brawl').value        = c.formula_brawl || '';
  // Clear previews
  ['hp','mp','san','dodge','lang','mov','occ-points','int-points','brawl'].forEach(k => {
    const el = $(`#prev-${k}`);
    if (el) { el.textContent = ''; el.className = 'formula-preview'; }
  });
}

function testFormulas() {
  const c = state.current;
  const stats = { str: c.str, dex: c.dex, int_val: c.int_val, con: c.con, app: c.app, pow: c.pow, siz: c.siz, edu: c.edu, luck: c.luck, age: c.age || 25 };

  const tests = [
    ['hp',         $('#cfg-formula-hp').value,           $('#prev-hp')],
    ['mp',         $('#cfg-formula-mp').value,           $('#prev-mp')],
    ['san',        $('#cfg-formula-san').value,          $('#prev-san')],
    ['dodge',      $('#cfg-formula-dodge').value,        $('#prev-dodge')],
    ['lang',       $('#cfg-formula-lang-own').value,     $('#prev-lang')],
    ['mov',        $('#cfg-formula-mov').value,          $('#prev-mov')],
    ['occ-points', $('#cfg-formula-occ-points').value,   $('#prev-occ-points')],
    ['int-points', $('#cfg-formula-int-points').value,   $('#prev-int-points')],
    ['brawl',      $('#cfg-formula-brawl').value,        $('#prev-brawl')],
  ];

  tests.forEach(([, formula, previewEl]) => {
    if (!previewEl || !formula) return;
    const result = evalFormula(formula, stats);
    if (result === null) {
      previewEl.textContent = 'ERRO';
      previewEl.className = 'formula-preview error';
    } else {
      previewEl.textContent = result;
      previewEl.className = 'formula-preview';
    }
  });
}

async function saveConfig() {
  const newConfig = {
    auto_calc:          $('#cfg-auto-calc').checked ? 'true' : 'false',
    formula_hp:         $('#cfg-formula-hp').value.trim(),
    formula_mp:         $('#cfg-formula-mp').value.trim(),
    formula_san:        $('#cfg-formula-san').value.trim(),
    formula_dodge:      $('#cfg-formula-dodge').value.trim(),
    formula_lang_own:   $('#cfg-formula-lang-own').value.trim(),
    formula_mov:        $('#cfg-formula-mov').value.trim(),
    formula_occ_points: $('#cfg-formula-occ-points').value.trim(),
    formula_int_points: $('#cfg-formula-int-points').value.trim(),
    formula_brawl:      $('#cfg-formula-brawl').value.trim(),
  };
  try {
    state.config = await api.put('/api/config', newConfig);
    updateAutoCalcBadge();
    // Re-apply auto-calc if character is loaded
    if (state.current) { updateDerivedStats(); await recalcVitals(); }
    $('#config-modal').classList.remove('open');
  } catch (e) { alert('Erro ao salvar configurações: ' + e.message); }
}

// ─── Dice Roller ──────────────────────────────────────────────
function openDiceRollerWithTarget(name, value) {
  state.rollTarget = { name, value };
  // Select d100 automatically
  $$('.die-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('.die-btn[data-sides="100"]')?.classList.add('selected');
  state.diceSides = 100;
  state.diceQty   = 1;
  $('#qty-display').textContent = 1;
  $('#dice-modifier').value = 0;
  state.diceBonus   = 0;
  state.dicePenalty = 0;
  updateBpDisplay();
  updateDiceExpression();
  // Show bonus/penalty area for d100
  $('#bonus-penalty-area').classList.add('visible');
  // Show target banner
  const banner = $('#roll-target-display');
  banner.textContent = `Teste de: ${name} (alvo: ${value} / difícil: ${Math.floor(value/2)} / extremo: ${Math.floor(value/5)})`;
  banner.style.display = '';
  $('#dice-modal').classList.add('open');
}

function setupDiceRoller() {
  $('#btn-dice-roller').addEventListener('click', () => {
    state.rollTarget = null;
    const banner = $('#roll-target-display');
    if (banner) banner.style.display = 'none';
    $('#dice-modal').classList.add('open');
    loadDiceHistory();
  });
  $('#dice-modal-close').addEventListener('click', () => {
    $('#dice-modal').classList.remove('open');
    state.rollTarget = null;
    const banner = $('#roll-target-display');
    if (banner) banner.style.display = 'none';
  });

  $$('.die-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.die-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.diceSides = +btn.dataset.sides;
    updateDiceExpression();
    $('#bonus-penalty-area').classList.toggle('visible', state.diceSides === 100);
  }));

  $('#qty-minus').addEventListener('click', () => {
    if (state.diceQty > 1) { state.diceQty--; $('#qty-display').textContent = state.diceQty; updateDiceExpression(); }
  });
  $('#qty-plus').addEventListener('click', () => {
    if (state.diceQty < 20) { state.diceQty++; $('#qty-display').textContent = state.diceQty; updateDiceExpression(); }
  });
  $('#dice-modifier').addEventListener('input', updateDiceExpression);

  let bonusCount = 0, penaltyCount = 0;
  $('#bp-bonus').addEventListener('click', () => {
    penaltyCount = 0; bonusCount = Math.min(bonusCount + 1, 3);
    state.diceBonus = bonusCount; state.dicePenalty = 0;
    updateBpDisplay();
  });
  $('#bp-penalty').addEventListener('click', () => {
    bonusCount = 0; penaltyCount = Math.min(penaltyCount + 1, 3);
    state.dicePenalty = penaltyCount; state.diceBonus = 0;
    updateBpDisplay();
  });
  $('#bp-reset').addEventListener('click', () => {
    bonusCount = 0; penaltyCount = 0;
    state.diceBonus = 0; state.dicePenalty = 0;
    updateBpDisplay();
  });

  $('#btn-roll').addEventListener('click', rollDice);
  $('#dice-expression').addEventListener('keydown', e => { if (e.key === 'Enter') rollDice(); });
}

let _bpBonusCount = 0, _bpPenaltyCount = 0;
function updateBpDisplay() {
  const bpEl = $('#bp-display');
  if (state.diceBonus > 0) {
    bpEl.textContent = `${state.diceBonus} Bônus`;
    $('#bp-bonus').className = 'bp-btn active-bonus';
    $('#bp-penalty').className = 'bp-btn';
  } else if (state.dicePenalty > 0) {
    bpEl.textContent = `${state.dicePenalty} Penalidade`;
    $('#bp-penalty').className = 'bp-btn active-penalty';
    $('#bp-bonus').className = 'bp-btn';
  } else {
    bpEl.textContent = 'Nenhum';
    $('#bp-bonus').className = 'bp-btn';
    $('#bp-penalty').className = 'bp-btn';
  }
}

function updateDiceExpression() {
  const mod = +$('#dice-modifier').value || 0;
  const modStr = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : '';
  $('#dice-expression').value = `${state.diceQty}d${state.diceSides}${modStr}`;
}

async function rollDice() {
  const expr = $('#dice-expression').value.trim();
  if (!expr) return;
  try {
    const result = await api.post('/api/dice/roll', {
      expression: expr,
      characterId: state.current?.id,
      bonus: state.diceBonus,
      penalty: state.dicePenalty,
    });
    displayDiceResult(result);
    prependHistoryItem(result);
  } catch (e) { alert(`Erro: ${e.message}`); }
}

function displayDiceResult(result) {
  const container = $('#dice-result');
  let cls = 'result-normal', label = '', checkHtml = '';

  if (result.isCriticalSuccess) { cls = 'result-critical'; label = '✨ SUCESSO CRÍTICO! ✨'; }
  else if (result.isCriticalFail) { cls = 'result-fumble'; label = '💀 FUMBLE! 💀'; }

  // CoC skill check analysis
  if (state.rollTarget && result.total && state.diceSides === 100) {
    const { label: lvl, cls: lvlCls } = cocSuccessLevel(result.total, state.rollTarget.value);
    checkHtml = `<div class="coc-check-result ${lvlCls}">${lvl}</div>`;
    cls = lvlCls;
    label = '';
  }

  const rolls = result.rolls.join(', ');
  const bp = result.bonusPenaltyRolls.length ? ` | BP: ${result.bonusPenaltyRolls.join(', ')}` : '';
  const mod = result.modifier !== 0 ? ` + mod(${result.modifier})` : '';

  container.innerHTML = `
    <div class="result-number ${cls}">${result.total}</div>
    ${label ? `<div class="result-label ${cls}">${label}</div>` : ''}
    ${checkHtml}
    <div class="result-details">${result.expression} → [${rolls}]${bp}${mod}</div>`;
}

function prependHistoryItem(result) {
  const list = $('#dice-history');
  list.querySelector('.empty-row')?.remove();

  const li = document.createElement('li');
  li.className = 'dice-history-item';
  let resCls = result.isCriticalSuccess ? 'h-critical' : result.isCriticalFail ? 'h-fumble' : '';
  let extra = '';
  if (state.rollTarget) {
    const { label } = cocSuccessLevel(result.total, state.rollTarget.value);
    extra = ` <small style="color:var(--text-muted)">(${state.rollTarget.name})</small>`;
    resCls = cocSuccessLevel(result.total, state.rollTarget.value).cls.replace('result-', 'h-');
  }
  li.innerHTML = `<span class="h-expr">${result.expression}${extra}</span><span class="h-result ${resCls}">${result.total}</span>`;
  list.insertBefore(li, list.firstChild);
  while (list.children.length > 20) list.removeChild(list.lastChild);
}

async function loadDiceHistory() {
  try {
    const history = await api.get(`/api/dice/history${state.current ? `?characterId=${state.current.id}` : ''}`);
    const list = $('#dice-history');
    if (!history.length) { list.innerHTML = '<li class="empty-row">Nenhuma rolagem ainda</li>'; return; }
    list.innerHTML = history.map(h => `
      <li class="dice-history-item">
        <span class="h-expr">${h.expression}</span>
        <span class="h-result">${h.result}</span>
      </li>`).join('');
  } catch (e) { console.error(e); }
}

// ─── Books / PDFs ─────────────────────────────────────────────
function setupBooks() {
  $('#btn-books').addEventListener('click', () => {
    loadBooks();
    $('#books-modal').classList.add('open');
  });
  $('#books-modal-close').addEventListener('click', () => {
    $('#books-modal').classList.remove('open');
  });
  $('#book-viewer-close').addEventListener('click', () => {
    $('#book-viewer-modal').classList.remove('open');
    $('#book-viewer-iframe').src = '';
  });

  $('#book-upload-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = $('#book-upload-status');
    statusEl.textContent = 'Enviando...';
    try {
      const form = new FormData();
      form.append('pdf', file);
      const r = await fetch('/api/books/upload', { method: 'POST', body: form });
      if (!r.ok) throw new Error(await r.text());
      statusEl.textContent = '✓ Enviado com sucesso';
      setTimeout(() => statusEl.textContent = '', 3000);
      loadBooks();
    } catch (err) {
      statusEl.textContent = '✗ Erro: ' + err.message;
    }
    e.target.value = '';
  });
}

async function loadBooks() {
  const list = $('#books-list');
  if (!list) return;
  try {
    const books = await api.get('/api/books');
    if (!books.length) {
      list.innerHTML = '<div class="books-empty">Nenhum PDF enviado ainda.</div>';
      return;
    }
    list.innerHTML = books.map(b => `
      <div class="book-item" data-name="${b.name}">
        <span class="book-icon">📄</span>
        <div class="book-info">
          <div class="book-name" title="${b.name}">${b.name}</div>
          <div class="book-meta">${(b.size / 1024 / 1024).toFixed(1)} MB</div>
        </div>
        <div class="book-actions">
          <button class="btn btn-sm btn-secondary book-read-btn" data-name="${b.name}">📖 Ler</button>
          <button class="btn btn-sm btn-danger book-del-btn" data-name="${b.name}">✕</button>
        </div>
      </div>`).join('');

    list.querySelectorAll('.book-read-btn').forEach(btn =>
      btn.addEventListener('click', () => openBookViewer(btn.dataset.name))
    );
    list.querySelectorAll('.book-del-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm(`Excluir "${btn.dataset.name}"?`)) return;
        await api.delete(`/api/books/${encodeURIComponent(btn.dataset.name)}`);
        loadBooks();
      })
    );
  } catch (e) { list.innerHTML = `<div class="books-empty">Erro: ${e.message}</div>`; }
}

function openBookViewer(filename) {
  $('#book-viewer-title').textContent = `📖 ${filename}`;
  $('#book-viewer-iframe').src = `/books/${encodeURIComponent(filename)}`;
  $('#books-modal').classList.remove('open');
  $('#book-viewer-modal').classList.add('open');
}

// ─── Evidências ───────────────────────────────────────────────
const evidenceState = { items: [] };

function setupEvidence() {
  $('#btn-evidence').addEventListener('click', () => {
    loadEvidence();
    $('#evidence-modal').classList.add('open');
  });
  $('#evidence-modal-close').addEventListener('click', () => $('#evidence-modal').classList.remove('open'));
  $('#btn-add-evidence').addEventListener('click', async () => {
    const item = await api.post('/api/evidence', { title: 'Nova Evidência', description: '' });
    evidenceState.items.unshift(item);
    renderEvidence();
  });
}

async function loadEvidence() {
  try {
    evidenceState.items = await api.get('/api/evidence');
    renderEvidence();
  } catch (e) { console.error(e); }
}

function renderEvidence() {
  const grid = $('#evidence-grid');
  if (!grid) return;
  const count = evidenceState.items.length;
  const countEl = $('#evidence-count');
  if (countEl) countEl.textContent = count ? `${count} evidência${count !== 1 ? 's' : ''}` : '';

  if (!count) {
    grid.innerHTML = '<div class="evidence-empty">Nenhuma evidência registrada ainda.</div>';
    return;
  }

  grid.innerHTML = evidenceState.items.map(ev => `
    <div class="evidence-card" data-ev-id="${ev.id}">
      ${ev.image
        ? `<img class="evidence-card-img" src="${ev.image}" alt="Evidência" />`
        : `<div class="evidence-card-img-placeholder ev-img-upload" data-ev-id="${ev.id}">📎 Clique para adicionar imagem</div>`}
      <input class="evidence-title-input" value="${(ev.title || '').replace(/"/g, '&quot;')}" placeholder="Título da evidência" data-ev-id="${ev.id}" data-field="title" />
      <input class="evidence-tag-input" value="${(ev.session_tag || '').replace(/"/g, '&quot;')}" placeholder="Sessão / Tag" data-ev-id="${ev.id}" data-field="session_tag" />
      <textarea class="evidence-desc-input" placeholder="Descrição, notas, contexto..." data-ev-id="${ev.id}" data-field="description">${ev.description || ''}</textarea>
      <div class="evidence-card-footer">
        <button class="btn btn-sm btn-danger ev-del-btn" data-ev-id="${ev.id}">Excluir</button>
      </div>
    </div>`).join('');

  const debounced = {};
  grid.querySelectorAll('[data-ev-id][data-field]').forEach(el => {
    el.addEventListener('input', () => {
      const id = +el.dataset.evId;
      const field = el.dataset.field;
      clearTimeout(debounced[`${id}-${field}`]);
      debounced[`${id}-${field}`] = setTimeout(() => {
        api.put(`/api/evidence/${id}`, { [field]: el.value }).catch(console.error);
        const item = evidenceState.items.find(e => e.id === id);
        if (item) item[field] = el.value;
      }, 700);
    });
  });

  grid.querySelectorAll('.ev-del-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = +btn.dataset.evId;
      if (!confirm('Excluir esta evidência?')) return;
      await api.delete(`/api/evidence/${id}`);
      evidenceState.items = evidenceState.items.filter(e => e.id !== id);
      renderEvidence();
    })
  );

  grid.querySelectorAll('.ev-img-upload').forEach(placeholder => {
    placeholder.addEventListener('click', () => {
      const evId = +placeholder.dataset.evId;
      const fileInput = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await compressPortrait(file, 400, 300);
        await api.put(`/api/evidence/${evId}`, { image: base64 });
        const item = evidenceState.items.find(ev => ev.id === evId);
        if (item) item.image = base64;
        renderEvidence();
      });
      fileInput.click();
    });
  });

  // Click image to enlarge
  grid.querySelectorAll('.evidence-card-img').forEach(img => {
    img.addEventListener('click', () => {
      const overlay = Object.assign(document.createElement('div'), {
        style: 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out',
      });
      const bigImg = Object.assign(document.createElement('img'), {
        src: img.src,
        style: 'max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,0.8)',
      });
      overlay.appendChild(bigImg);
      overlay.addEventListener('click', () => overlay.remove());
      document.body.appendChild(overlay);
    });
  });
}

// ─── Portrait Image ───────────────────────────────────────────
function setupPortrait() {
  const area      = $('#portrait-area');
  const fileInput = $('#portrait-file');
  if (!area || !fileInput) return;

  area.addEventListener('click', () => { if (state.current) fileInput.click(); });
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !state.current) return;
    try {
      const base64 = await compressPortrait(file, 220, 220);
      state.current.image = base64;
      displayPortrait(base64);
      await api.put(`/api/characters/${state.current.id}`, { image: base64 });
      showSaveIndicator();
    } catch (err) { console.error('Erro ao processar imagem:', err); }
    e.target.value = '';
  });
}

function displayPortrait(base64) {
  const img         = $('#portrait-img');
  const placeholder = $('#portrait-placeholder');
  if (!img || !placeholder) return;
  if (base64) {
    img.src             = base64;
    img.style.display   = 'block';
    placeholder.style.display = 'none';
  } else {
    img.src             = '';
    img.style.display   = 'none';
    placeholder.style.display = 'flex';
  }
}

function compressPortrait(file, maxW, maxH) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const imgEl = new Image();
      imgEl.onerror = reject;
      imgEl.onload = () => {
        const canvas = document.createElement('canvas');
        // Square-crop from center
        const size = Math.min(imgEl.width, imgEl.height);
        const sx   = (imgEl.width  - size) / 2;
        const sy   = (imgEl.height - size) / 2;
        canvas.width  = maxW;
        canvas.height = maxH;
        canvas.getContext('2d').drawImage(imgEl, sx, sy, size, size, 0, 0, maxW, maxH);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      imgEl.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
