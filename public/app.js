'use strict';

// ─── Descrições de Habilidades (tooltips) ────────────────────
const SKILL_DESCRIPTIONS = {
  'Accounting': 'Contabilidade: finanças, registros, detecção de fraudes.',
  'Anthropology': 'Antropologia: culturas, costumes e comportamento humano.',
  'Appraise': 'Avaliar: estimar valor de objetos e antiguidades.',
  'Archaeology': 'Arqueologia: escavações, artefatos e civilizações antigas.',
  'Art/Craft': 'Arte/Artesanato: criação de obras de arte ou artesanato.',
  'Charm': 'Charme: sedução, lisonja e persuasão através do apelo pessoal.',
  'Climb': 'Escalar: subir superfícies verticais com segurança.',
  'Computer Use': 'Computador: programação, pesquisa e hacking de sistemas.',
  'Credit Rating': 'Crédito: nível de riqueza e respeitabilidade social (0=miserável, 99=milionário).',
  'Cthulhu Mythos': 'Mitos de Cthulhu: conhecimento dos horrores cósmicos. Reduz SAN máxima!',
  'Demolitions': 'Demolições: uso de explosivos para destruição controlada.',
  'Disguise': 'Disfarce: alterar aparência para enganar outros.',
  'Diving': 'Mergulho: técnicas de mergulho e sobrevivência subaquática.',
  'Dodge': 'Esquivar: evitar ataques e perigos físicos.',
  'Drive Auto': 'Dirigir: operar automóveis e veículos motorizados.',
  'Elec. Repair': 'Reparo Elétrico: consertar e instalar equipamentos elétricos.',
  'Electronics': 'Eletrônica: construir, reparar e analisar dispositivos eletrônicos.',
  'Fast Talk': 'Conversa Fiada: convencer rapidamente com argumentos falaciosos.',
  'Fighting (Brawl)': 'Luta: combate corpo a corpo desarmado e com armas improvisadas.',
  'Firearms (Handgun)': 'Pistola: uso de revólveres e pistolas.',
  'Firearms (Rifle/Shotgun)': 'Rifle/Escopeta: uso de armas longas.',
  'Firearms (Submachine Gun)': 'Submetralhadora: uso de SMGs e armas automáticas.',
  'First Aid': 'Primeiros Socorros: tratamento emergencial de ferimentos.',
  'History': 'História: conhecimento de eventos e personagens históricos.',
  'Intimidate': 'Intimidar: coagir através de ameaças ou presença física.',
  'Jump': 'Saltar: saltos horizontais e verticais.',
  'Language (Other)': 'Idioma Estrangeiro: falar, ler e escrever em outro idioma.',
  'Language (Own)': 'Idioma Próprio: fluência no idioma nativo do personagem.',
  'Law': 'Direito: leis, procedimentos legais e jurisprudência.',
  'Library Use': 'Pesquisa: buscar informações em bibliotecas e arquivos.',
  'Listen': 'Ouvir: detectar sons e conversas próximas.',
  'Locksmith': 'Ladrão de Cofres: abrir fechaduras e cofres sem a chave.',
  'Mech. Repair': 'Reparo Mecânico: consertar motores e equipamentos mecânicos.',
  'Medicine': 'Medicina: diagnóstico e tratamento médico completo.',
  'Natural World': 'Mundo Natural: flora, fauna e fenômenos naturais.',
  'Navigate': 'Navegação: usar mapas, bússola e estrelas para se orientar.',
  'Occult': 'Ocultismo: conhecimento de rituais, simbolismo e tradições místicas.',
  'Op. Heavy Machinery': 'Máquinas Pesadas: operar guindastes, escavadeiras e equipamentos industriais.',
  'Persuade': 'Persuadir: convencer com argumentos racionais e emocionais.',
  'Photography': 'Fotografia: tirar fotos de qualidade e revelar películas.',
  'Pilot': 'Pilotagem: voar aeronaves ou pilotar embarcações.',
  'Psychology': 'Psicologia: entender motivações e distúrbios mentais.',
  'Psychoanalysis': 'Psicanálise: tratar distúrbios mentais e recuperar SAN.',
  'Read Lips': 'Leitura Labial: entender o que alguém diz sem ouvi-lo.',
  'Ride': 'Equitação: montar e controlar cavalos e animais.',
  'Science (Biology)': 'Biologia: estudo dos seres vivos e processos vitais.',
  'Science (Botany)': 'Botânica: estudo das plantas e fungos.',
  'Science (Chemistry)': 'Química: reações químicas, substâncias e compostos.',
  'Science (Cryptography)': 'Criptografia: cifras, códigos e mensagens secretas.',
  'Science (Engineering)': 'Engenharia: projetos e construção de estruturas e máquinas.',
  'Science (Forensics)': 'Forense: análise de cenas de crime e evidências físicas.',
  'Science (Geology)': 'Geologia: rochas, minerais e formações terrestres.',
  'Science (Mathematics)': 'Matemática: cálculos avançados e teorias matemáticas.',
  'Science (Meteorology)': 'Meteorologia: tempo, clima e fenômenos atmosféricos.',
  'Science (Pharmacy)': 'Farmácia: medicamentos, venenos e antídotos.',
  'Science (Physics)': 'Física: leis da natureza, eletromagnetismo e termodinâmica.',
  'Science (Zoology)': 'Zoologia: estudo dos animais e seu comportamento.',
  'Sleight of Hand': 'Prestidigitação: pequenos truques, roubo de objetos e ilusionismo.',
  'Spot Hidden': 'Detectar: notar detalhes ocultos, pistas e armadilhas.',
  'Stealth': 'Furtividade: mover-se e agir sem ser percebido.',
  'Survival': 'Sobrevivência: encontrar comida, abrigo e navegar em áreas selvagens.',
  'Swim': 'Nadar: manter-se à tona e nadar em condições adversas.',
  'Throw': 'Arremesso: atirar objetos com precisão.',
  'Track': 'Rastrear: seguir rastros de pessoas e animais.',
};

function getSkillDescription(skillName) {
  for (const [key, desc] of Object.entries(SKILL_DESCRIPTIONS)) {
    if (skillName.includes(key)) return desc;
  }
  return skillName;
}

// ─── Preset de Armas CoC 7e ────────────────────────────────
const WEAPON_PRESETS = [
  // ── Combate Corpo a Corpo ──
  { name: 'Soco (Fist/Punch)', skill: 'Fighting (Brawl) (Luta)', damage: '1d3+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100, notes: 'Ataque desarmado básico' },
  { name: 'Pontapé (Kick)', skill: 'Fighting (Brawl) (Luta)', damage: '1d4+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Cabeçada (Headbutt)', skill: 'Fighting (Brawl) (Luta)', damage: '1d4+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Estrangulamento/Garrote', skill: 'Fighting (Brawl) (Luta)', damage: '1d6', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100, notes: 'Mantém presa; vítima sufoca' },
  { name: 'Faca (Knife)', skill: 'Fighting (Brawl) (Luta)', damage: '1d4+2+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Faca Bowie', skill: 'Fighting (Brawl) (Luta)', damage: '1d8+2+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Baioneta', skill: 'Fighting (Brawl) (Luta)', damage: '1d4+2+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Porrete/Cassetete', skill: 'Fighting (Brawl) (Luta)', damage: '1d6+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Taco de Beisebol', skill: 'Fighting (Brawl) (Luta)', damage: '1d8+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Haste de Ferro/Pé-de-Cabra', skill: 'Fighting (Brawl) (Luta)', damage: '1d8+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Marreta (Sledgehammer)', skill: 'Fighting (Brawl) (Luta)', damage: '1d10+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100, notes: 'Pesada; –10% para acertar' },
  { name: 'Machado (Axe)', skill: 'Fighting (Brawl) (Luta)', damage: '1d8+2+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Machete', skill: 'Fighting (Brawl) (Luta)', damage: '1d8+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Espada (Sword)', skill: 'Fighting (Sword) (Espada)', damage: '1d8+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Sabre/Florete', skill: 'Fighting (Sword) (Espada)', damage: '1d6+db', range: 'Toque', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Lança (Spear)', skill: 'Fighting (Spear) (Lança)', damage: '1d8+1+db', range: 'Toque/3m', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Chicote (Whip)', skill: 'Fighting (Whip) (Chicote)', damage: '1d3+db', range: '3m', attacks_per_round: '1', ammo: 0, malfunction: 100, notes: 'Pode enredar; alcance 3m' },
  { name: 'Arco e Flecha', skill: 'Throw (Arremesso)', damage: '1d6+db', range: '50m', attacks_per_round: '1', ammo: 0, malfunction: 100 },
  { name: 'Besta (Crossbow)', skill: 'Throw (Arremesso)', damage: '1d8+2', range: '40m', attacks_per_round: '½', ammo: 1, malfunction: 100 },
  // ── Pistolas / Revólveres ──
  { name: 'Derringer .41', skill: 'Firearms (Handgun) (Pistola)', damage: '1d8', range: '5m', attacks_per_round: '1/2', ammo: 2, malfunction: 100, notes: 'Pequena; fácil de esconder' },
  { name: 'Revólver .32', skill: 'Firearms (Handgun) (Pistola)', damage: '1d8', range: '15m', attacks_per_round: '1/2', ammo: 5, malfunction: 100 },
  { name: 'Pistola .22', skill: 'Firearms (Handgun) (Pistola)', damage: '1d6', range: '15m', attacks_per_round: '1/3', ammo: 9, malfunction: 99 },
  { name: 'Revólver .38', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10', range: '15m', attacks_per_round: '1/2', ammo: 6, malfunction: 100 },
  { name: 'Colt .45 Auto (M1911)', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10+2', range: '15m', attacks_per_round: '1/3', ammo: 7, malfunction: 100 },
  { name: 'Revólver .45', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10+2', range: '15m', attacks_per_round: '1/2', ammo: 6, malfunction: 100 },
  { name: 'Luger P08', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10', range: '20m', attacks_per_round: '1/3', ammo: 8, malfunction: 100 },
  { name: 'Walther PPK .32', skill: 'Firearms (Handgun) (Pistola)', damage: '1d8', range: '15m', attacks_per_round: '1/3', ammo: 7, malfunction: 100, notes: 'Compacta; popular em detetives' },
  { name: 'Mauser C96', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10', range: '20m', attacks_per_round: '1/3', ammo: 10, malfunction: 100 },
  { name: 'Webley Mk VI .455', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10+2', range: '15m', attacks_per_round: '1/2', ammo: 6, malfunction: 100, notes: 'Revólver britânico da WWI' },
  { name: 'Smith & Wesson .44', skill: 'Firearms (Handgun) (Pistola)', damage: '2d6+1', range: '15m', attacks_per_round: '1/2', ammo: 6, malfunction: 100 },
  { name: 'Browning Hi-Power 9mm', skill: 'Firearms (Handgun) (Pistola)', damage: '1d10', range: '20m', attacks_per_round: '1/3', ammo: 13, malfunction: 100 },
  // ── Rifles e Espingardas ──
  { name: 'Escopeta 12 Gauge (2 canos)', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '4d6/2d6/1d6', range: '10m/20m/50m', attacks_per_round: '1/2', ammo: 2, malfunction: 100 },
  { name: 'Winchester 1897 (pump)', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '4d6/2d6/1d6', range: '10m/20m/50m', attacks_per_round: '1', ammo: 5, malfunction: 100 },
  { name: 'Escopeta Cano Curto (sawed-off)', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '4d6/2d6', range: '5m/10m', attacks_per_round: '1/2', ammo: 2, malfunction: 100, notes: 'Ilegal; fácil de esconder' },
  { name: 'Winchester .30-06', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '2d6+4', range: '110m', attacks_per_round: '1', ammo: 5, malfunction: 100 },
  { name: 'Springfield M1903', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '2d6+4', range: '110m', attacks_per_round: '1', ammo: 5, malfunction: 100 },
  { name: 'Lee-Enfield .303', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '2d6+4', range: '110m', attacks_per_round: '1', ammo: 10, malfunction: 100, notes: 'Rifle britânico padrão; ação de ferrolho rápida' },
  { name: 'Mauser Gewehr 98', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '2d6+4', range: '110m', attacks_per_round: '1', ammo: 5, malfunction: 100, notes: 'Rifle alemão da WWI' },
  { name: 'Carabina .30 M1', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '2d6+1', range: '50m', attacks_per_round: '1', ammo: 15, malfunction: 100 },
  { name: 'Browning BAR', skill: 'Firearms (Rifle/Shotgun) (Rifle)', damage: '2d6+4', range: '110m', attacks_per_round: '1/completo', ammo: 20, malfunction: 100, notes: 'Rifle automático; disparo em rajada possível' },
  // ── Submetralhadoras ──
  { name: 'Thompson M1928 (SMG)', skill: 'Firearms (Submachine Gun) (Submetralhadora)', damage: '1d10+2', range: '20m', attacks_per_round: '½/2/completo', ammo: 30, malfunction: 96 },
  { name: 'MP18', skill: 'Firearms (Submachine Gun) (Submetralhadora)', damage: '1d10', range: '15m', attacks_per_round: '½/2/completo', ammo: 32, malfunction: 96, notes: 'Primeira SMG de guerra; alemã' },
  { name: 'Sten Mk II', skill: 'Firearms (Submachine Gun) (Submetralhadora)', damage: '1d10', range: '30m', attacks_per_round: '½/2/completo', ammo: 32, malfunction: 95, notes: 'Britânica; barata e produzida em massa' },
  { name: 'MP40', skill: 'Firearms (Submachine Gun) (Submetralhadora)', damage: '1d10', range: '30m', attacks_per_round: '½/2/completo', ammo: 32, malfunction: 96, notes: 'SMG alemã da WWII' },
  // ── Metralhadoras / Pesadas ──
  { name: 'Lewis Gun (metralhadora)', skill: 'Firearms (Heavy) (Pesada)', damage: '2d6+4', range: '100m', attacks_per_round: '½/2/completo', ammo: 47, malfunction: 96, notes: 'Metralhadora leve; bipé' },
  { name: 'Browning M1917 (metralhadora)', skill: 'Firearms (Heavy) (Pesada)', damage: '2d8+4', range: '200m', attacks_per_round: 'completo', ammo: 250, malfunction: 97, notes: 'Metralhadora pesada; tripé; refrigerada a água' },
  // ── Explosivos e Especiais ──
  { name: 'Dinamite (1 bastão)', skill: 'Demolitions (Demolições)', damage: '4d10', range: 'Arremesso', attacks_per_round: '1', ammo: 1, malfunction: 100, notes: 'Raio de explosão 3m' },
  { name: 'Granada de mão (Mk II)', skill: 'Throw (Arremesso)', damage: '4d6+2', range: '10m', attacks_per_round: '1', ammo: 1, malfunction: 100, notes: 'Timer ~5s; raio 10m' },
  { name: 'Coquetel Molotov', skill: 'Throw (Arremesso)', damage: '2d6 fogo', range: '10m', attacks_per_round: '1', ammo: 1, malfunction: 100, notes: 'Incendeia área; +1d3/rodada enquanto arder' },
  { name: 'Lança-chamas', skill: 'Firearms (Heavy) (Pesada)', damage: '2d6 fogo', range: '10m', attacks_per_round: '1', ammo: 10, malfunction: 97, notes: 'Ignora armadura; incendeia área; requer testes de SAN' },
];

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
// (overridden at bottom of file with extended version)

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

  // Gold/wealth fields
  const cashEl = $('#field-cash'); if (cashEl) cashEl.value = c.cash || '';
  const spendEl = $('#field-spending-level'); if (spendEl) spendEl.value = c.spending_level || '';
  const assetsEl = $('#field-assets'); if (assetsEl) assetsEl.value = c.assets || '';

  // Show/hide export-friend button
  const exportFriendBtn = $('#btn-export-friend');
  if (exportFriendBtn) exportFriendBtn.style.display = 'inline-flex';

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
    const occ  = s.occ_points  || 0;
    const int_ = s.int_points  || 0;
    const game = s.game_points || 0;
    const total = (s.base_value || 0) + occ + int_ + game;
    const rowCls = occ > 0 ? ' has-occ' : int_ > 0 ? ' has-int' : game > 0 ? ' has-game' : '';
    const tooltip = getSkillDescription(s.name);
    return `
    <div class="skill-row${rowCls}" data-skill-id="${s.id}">
      <span class="skill-name" title="${tooltip}">${s.name}</span>
      <input type="number" class="skill-input base" value="${s.base_value}" min="0" max="99" readonly title="Valor base" />
      <input type="number" class="skill-input occ" value="${occ}" min="0" max="99" title="Pts. Ocupação" />
      <input type="number" class="skill-input int_" value="${int_}" min="0" max="99" title="Pts. Interesse" />
      <input type="number" class="skill-input game" value="${game}" min="0" max="99" title="Pts. durante o Jogo" />
      <input type="number" class="skill-input total" value="${total}" min="0" max="99" readonly title="Total" />
      <span class="skill-half-fifth">${half(total)}/${fifth(total)}</span>
      <button class="skill-roll-btn" data-skill-id="${s.id}" title="Rolar d100 contra ${s.name}">🎲</button>
    </div>`;
  }).join('');

  grid.querySelectorAll('.skill-row').forEach(row => {
    const sId = +row.dataset.skillId;
    const occInp  = row.querySelector('.skill-input.occ');
    const intInp  = row.querySelector('.skill-input.int_');
    const gameInp = row.querySelector('.skill-input.game');
    const totalInp = row.querySelector('.skill-input.total');
    const halfFifth = row.querySelector('.skill-half-fifth');

    const save = () => {
      const occV  = Math.max(0, +occInp.value  || 0);
      const intV  = Math.max(0, +intInp.value  || 0);
      const gameV = Math.max(0, +gameInp.value || 0);
      const sk = state.current.skills.find(s => s.id === sId);
      const base = sk?.base_value || 0;
      const total = base + occV + intV + gameV;

      if (totalInp) totalInp.value = total;
      if (halfFifth) halfFifth.textContent = `${half(total)}/${fifth(total)}`;

      row.classList.toggle('has-occ',  occV  > 0);
      row.classList.toggle('has-int',  intV  > 0);
      row.classList.toggle('has-game', gameV > 0);

      if (sk) {
        sk.occ_points = occV; sk.int_points = intV; sk.game_points = gameV;
        sk.value = total; sk.is_occupation = occV > 0 ? 1 : 0; sk.is_interest = intV > 0 ? 1 : 0;
      }

      api.put(`/api/skills/${sId}`, { occ_points: occV, int_points: intV, game_points: gameV })
        .then(() => {
          if (sk?.name.includes('Cthulhu Mythos')) updateSanMaxHint();
          showSaveIndicator();
          updateSkillPoints();
        }).catch(console.error);
    };

    occInp.addEventListener('change', save);
    intInp.addEventListener('change', save);
    gameInp.addEventListener('change', save);

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
    occUsed  += (s.occ_points  || 0);
    intUsed  += (s.int_points  || 0);
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
function resolveWeaponSkillValue(skillText) {
  // If numeric, use directly
  const num = parseInt(skillText, 10);
  if (!isNaN(num)) return { name: `Arma (${num}%)`, value: num };
  // Search character skills
  const sk = state.current?.skills?.find(s => s.name.toLowerCase().includes(skillText.toLowerCase().split('(')[0].trim()));
  if (sk) return { name: sk.name, value: sk.value };
  return null;
}

function renderWeapons() {
  const tbody = $('#weapons-tbody');
  const weapons = state.current?.weapons || [];
  if (!weapons.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Nenhuma arma cadastrada</td></tr>'; return; }

  tbody.innerHTML = weapons.map(w => `
    <tr data-weapon-id="${w.id}">
      <td><input class="weapon-input" data-field="name" list="weapon-presets" value="${(w.name||'').replace(/"/g,'&quot;')}" placeholder="Arma" /></td>
      <td><input class="weapon-input" data-field="skill" value="${(w.skill||'').replace(/"/g,'&quot;')}" placeholder="Habilidade ou %" style="width:80px"/></td>
      <td><input class="weapon-input" data-field="damage" value="${(w.damage||'').replace(/"/g,'&quot;')}" placeholder="1d6" style="width:70px"/></td>
      <td><input class="weapon-input" data-field="range" value="${(w.range||'').replace(/"/g,'&quot;')}" placeholder="Toque" style="width:70px"/></td>
      <td><input class="weapon-input" data-field="attacks_per_round" value="${(w.attacks_per_round||'1').replace(/"/g,'&quot;')}" style="width:50px"/></td>
      <td><input class="weapon-input" type="number" data-field="ammo" value="${w.ammo||0}" style="width:50px"/></td>
      <td><input class="weapon-input" type="number" data-field="malfunction" value="${w.malfunction||100}" style="width:50px"/></td>
      <td><button class="btn-weapon-roll" data-wid="${w.id}" title="Rolar com ${(w.name||'arma').replace(/"/g,'&quot;')}">🎲 Rolar</button></td>
      <td><button class="btn-remove btn-remove-weapon" data-id="${w.id}">✕</button></td>
    </tr>`).join('');

  tbody.querySelectorAll('tr[data-weapon-id]').forEach(row => {
    const wId = +row.dataset.weaponId;
    const nameInput = row.querySelector('[data-field="name"]');

    const save = () => {
      const data = {};
      row.querySelectorAll('[data-field]').forEach(i => { data[i.dataset.field] = i.type === 'number' ? (+i.value||0) : i.value; });
      const w = state.current.weapons.find(x => x.id === wId);
      if (w) Object.assign(w, data);
      api.put(`/api/weapons/${wId}`, data).then(() => showSaveIndicator()).catch(console.error);
    };

    // Autocomplete: when name matches a preset or catalog weapon, auto-fill fields
    nameInput.addEventListener('change', () => {
      const preset = getCatalogWeaponPreset(nameInput.value);
      if (preset) {
        row.querySelector('[data-field="skill"]').value             = preset.skill;
        row.querySelector('[data-field="damage"]').value            = preset.damage;
        row.querySelector('[data-field="range"]').value             = preset.range;
        row.querySelector('[data-field="attacks_per_round"]').value = preset.attacks_per_round;
        row.querySelector('[data-field="ammo"]').value              = preset.ammo;
        row.querySelector('[data-field="malfunction"]').value       = preset.malfunction;
      }
      save();
    });

    row.querySelectorAll('[data-field]:not([data-field="name"])').forEach(i => i.addEventListener('change', save));

    // Roll button
    row.querySelector('.btn-weapon-roll').addEventListener('click', () => {
      const w = state.current.weapons.find(x => x.id === wId);
      if (!w) return;
      const resolved = resolveWeaponSkillValue(w.skill || '');
      if (resolved) {
        openDiceRollerWithTarget(`${w.name || 'Arma'} (${resolved.name})`, resolved.value);
      } else {
        alert(`Habilidade "${w.skill}" não encontrada. Preencha o campo Habilidade com um nome ou valor numérico.`);
      }
    });
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

  // Exportar completo
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

  // Exportar versão amigo (sem lore)
  $('#btn-export-friend').addEventListener('click', async () => {
    if (!state.current) return;
    try {
      const resp = await fetch(`/api/export-friend/${state.current.id}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(state.current.name || 'personagem').replace(/[^a-z0-9]/gi, '_')}_amigo.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao exportar versão amigo: ' + e.message); }
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
      const existingIdx = state.characters.findIndex(c => c.id === imported.id);
      const entry = { id: imported.id, name: imported.name, player: imported.player, occupation: imported.occupation, age: imported.age };
      if (existingIdx >= 0) {
        state.characters[existingIdx] = entry;
      } else {
        state.characters.unshift(entry);
      }
      renderCharacterList();
      await selectCharacter(imported.id);
      alert(`"${imported.name}" ${imported.wasUpdated ? 'atualizado' : 'importado'} com sucesso!`);
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
  bindText('#field-cash','cash'); bindText('#field-spending-level','spending_level');
  bindText('#field-assets','assets');

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

  // Export evidence as JSON
  $('#btn-evidence-export')?.addEventListener('click', () => {
    const data = { version: 1, exportedAt: new Date().toISOString(), evidence: evidenceState.items };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `evidencias-${new Date().toISOString().slice(0,10)}.json`
    });
    a.click(); URL.revokeObjectURL(a.href);
  });

  // Import evidence from JSON file
  $('#evidence-import-file')?.addEventListener('change', async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = parsed.evidence || (Array.isArray(parsed) ? parsed : []);
      if (!items.length) { alert('Nenhuma evidência encontrada no arquivo.'); return; }
      const result = await api.post('/api/evidence/import', { evidence: items });
      evidenceState.items = await api.get('/api/evidence');
      renderEvidence();
      alert(`${result.count} evidência(s) importada(s)!`);
    } catch (err) { alert('Erro ao importar evidências: ' + err.message); }
    e.target.value = '';
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
function showImageFullscreen(src) {
  const overlay = Object.assign(document.createElement('div'), {
    style: 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out',
  });
  const bigImg = Object.assign(document.createElement('img'), {
    src,
    style: 'max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 0 60px rgba(0,0,0,0.9)',
  });
  overlay.appendChild(bigImg);
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

function setupPortrait() {
  const area      = $('#portrait-area');
  const fileInput = $('#portrait-file');
  const hint      = $('#portrait-fullscreen-hint');
  if (!area || !fileInput) return;

  area.addEventListener('click', (e) => {
    const img = $('#portrait-img');
    // If image is visible and click is not on a child input, show fullscreen
    if (img && img.style.display === 'block' && e.target !== fileInput) {
      showImageFullscreen(img.src);
      return;
    }
    if (state.current) fileInput.click();
  });

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
  const hint        = $('#portrait-fullscreen-hint');
  if (!img || !placeholder) return;
  if (base64) {
    img.src             = base64;
    img.style.display   = 'block';
    placeholder.style.display = 'none';
    if (hint) { hint.style.display = 'block'; hint.textContent = '🔍 Ampliar'; }
  } else {
    img.src             = '';
    img.style.display   = 'none';
    placeholder.style.display = 'flex';
    if (hint) hint.style.display = 'none';
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

// ═══════════════════════════════════════════════════════
// NPCs / INIMIGOS / MONSTROS
// ═══════════════════════════════════════════════════════

const npcState = {
  list: [],
  current: null,
  filter: 'all',
};

const NPC_TYPE_LABELS = {
  npc:     { icon: '👤', label: 'NPC',     cls: 'npc-type-npc'     },
  enemy:   { icon: '⚔️', label: 'Inimigo', cls: 'npc-type-enemy'   },
  monster: { icon: '👹', label: 'Monstro', cls: 'npc-type-monster' },
};

function setupNpcs() {
  const btn = $('#btn-npcs');
  if (!btn) return;

  btn.addEventListener('click', () => {
    loadNpcs();
    $('#npcs-modal').classList.add('open');
  });
  $('#npcs-modal-close').addEventListener('click', closeNpcModal);

  // Criar NPC/Inimigo/Monstro
  ['btn-add-npc','btn-add-enemy','btn-add-monster'].forEach(id => {
    $(`#${id}`)?.addEventListener('click', async () => {
      const type = $(`#${id}`).dataset.type;
      const n = await api.post('/api/npcs', { type });
      npcState.list.unshift(n);
      renderNpcList();
      selectNpc(n.id);
    });
  });

  // Filtros
  $$('.npc-filter-btn').forEach(b =>
    b.addEventListener('click', () => {
      $$('.npc-filter-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      npcState.filter = b.dataset.filter;
      renderNpcList();
    })
  );

  // Excluir NPC atual
  $('#btn-delete-npc').addEventListener('click', async () => {
    if (!npcState.current) return;
    if (!confirm(`Excluir "${npcState.current.name}"?`)) return;
    await api.delete(`/api/npcs/${npcState.current.id}`);
    npcState.list = npcState.list.filter(n => n.id !== npcState.current.id);
    npcState.current = null;
    renderNpcList();
    $('#npc-editor').style.display = 'none';
  });

  // Botão adicionar ataque
  $('#btn-add-attack').addEventListener('click', () => {
    if (!npcState.current) return;
    let attacks = [];
    try { attacks = JSON.parse(npcState.current.attacks || '[]'); } catch(e) {}
    attacks.push({ name: 'Novo Ataque', skill_pct: 25, damage: '1d6', notes: '' });
    npcState.current.attacks = JSON.stringify(attacks);
    renderNpcAttacks(attacks);
    saveCurrentNpc({ attacks: npcState.current.attacks });
  });

  // Foto do NPC
  const portraitArea = $('#npc-portrait-area');
  const portraitFile = $('#npc-portrait-file');
  if (portraitArea && portraitFile) {
    portraitArea.addEventListener('click', () => {
      const img = $('#npc-portrait-img');
      if (img && img.style.display === 'block') { showImageFullscreen(img.src); return; }
      if (npcState.current) portraitFile.click();
    });
    portraitFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !npcState.current) return;
      const base64 = await compressPortrait(file, 160, 160);
      npcState.current.image = base64;
      displayNpcPortrait(base64);
      const item = npcState.list.find(n => n.id === npcState.current.id);
      if (item) item.image = base64;
      saveCurrentNpc({ image: base64 });
      e.target.value = '';
    });
  }

  // Vitais ± no editor
  $$('#npc-editor .npc-vital-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!npcState.current) return;
      const vital = btn.dataset.vital;
      const dir   = +btn.dataset.dir;
      const max   = +$(`#npc-${vital}-max`).value || 0;
      let cur = (npcState.current[`${vital}_current`] || 0) + dir;
      cur = Math.max(0, Math.min(max, cur));
      npcState.current[`${vital}_current`] = cur;
      $(`#npc-${vital}-cur`).textContent = cur;
      const item = npcState.list.find(n => n.id === npcState.current.id);
      if (item) item[`${vital}_current`] = cur;
      saveCurrentNpc({ [`${vital}_current`]: cur });
    });
  });

  // Campos auto-save (debounced)
  const saveFields = [
    ['#npc-name','name'], ['#npc-type','type'], ['#npc-description','description'],
    ['#npc-str','str'], ['#npc-dex','dex'], ['#npc-int','int_val'],
    ['#npc-con','con'], ['#npc-pow','pow'], ['#npc-siz','siz'],
    ['#npc-armor','armor'], ['#npc-damage-bonus','damage_bonus'],
    ['#npc-skills-text','skills_text'],
    ['#npc-special','special_abilities'], ['#npc-notes','notes'],
  ];
  const npcDebounceTimers = {};
  saveFields.forEach(([sel, field]) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener('input', () => {
      if (!npcState.current) return;
      npcState.current[field] = el.type === 'number' ? (+el.value || 0) : el.value;
      clearTimeout(npcDebounceTimers[field]);
      npcDebounceTimers[field] = setTimeout(() => {
        saveCurrentNpc({ [field]: npcState.current[field] });
        if (['str','dex','con','pow','siz'].includes(field)) autoCalcNpcVitals();
        if (field === 'name' || field === 'type') {
          const item = npcState.list.find(n => n.id === npcState.current.id);
          if (item) { item.name = npcState.current.name; item.type = npcState.current.type; }
          renderNpcList();
          updateNpcEditorTitle();
          // Ocultar SAN para monstros
          const sanBlock = $('#npc-san-block');
          if (sanBlock) sanBlock.style.display = npcState.current.type === 'monster' ? 'none' : '';
        }
      }, 600);
    });
  });

  // Max HP/MP/SAN: atualizar current se necessário
  ['hp','mp','san'].forEach(vital => {
    $(`#npc-${vital}-max`)?.addEventListener('change', () => {
      if (!npcState.current) return;
      const max = +$(`#npc-${vital}-max`).value || 0;
      npcState.current[`${vital}_max`] = max;
      if ((npcState.current[`${vital}_current`] || 0) > max) {
        npcState.current[`${vital}_current`] = max;
        $(`#npc-${vital}-cur`).textContent = max;
      }
      const item = npcState.list.find(n => n.id === npcState.current.id);
      if (item) { item[`${vital}_max`] = max; item[`${vital}_current`] = npcState.current[`${vital}_current`]; }
      saveCurrentNpc({ [`${vital}_max`]: max, [`${vital}_current`]: npcState.current[`${vital}_current`] });
    });
  });
}

function autoCalcNpcVitals() {
  if (!npcState.current) return;
  const c = npcState.current;
  const hpMax  = Math.max(1, Math.floor(((c.con || 50) + (c.siz || 50)) / 10));
  const mpMax  = Math.max(1, Math.floor((c.pow || 50) / 5));
  const sanMax = c.type === 'monster' ? 0 : (c.pow || 50) * 5;
  const { db } = calcDamageBonus(c.str || 50, c.siz || 50);

  $('#npc-hp-max').value       = hpMax;
  $('#npc-mp-max').value       = mpMax;
  $('#npc-san-max').value      = sanMax;
  $('#npc-damage-bonus').value = db;

  const updates = { hp_max: hpMax, mp_max: mpMax, san_max: sanMax, damage_bonus: db };
  if ((c.hp_current || 0) > hpMax) {
    updates.hp_current = hpMax;
    $('#npc-hp-cur').textContent = hpMax;
  }
  Object.assign(c, updates);
  saveCurrentNpc(updates);
}

function closeNpcModal() {
  $('#npcs-modal').classList.remove('open');
  $('#npc-editor').style.display = 'none';
  npcState.current = null;
}

async function loadNpcs() {
  try {
    npcState.list = await api.get('/api/npcs');
    renderNpcList();
  } catch (e) { console.error(e); }
}

function renderNpcList() {
  const container = $('#npcs-list');
  if (!container) return;
  const filtered = npcState.filter === 'all'
    ? npcState.list
    : npcState.list.filter(n => n.type === npcState.filter);

  if (!filtered.length) {
    container.innerHTML = '<div class="npcs-empty">Nenhum NPC neste filtro. Crie um com os botões acima.</div>';
    return;
  }

  container.innerHTML = filtered.map(n => {
    const t = NPC_TYPE_LABELS[n.type] || NPC_TYPE_LABELS.npc;
    const hpPct = n.hp_max ? Math.round((n.hp_current / n.hp_max) * 100) : 0;
    const isSelected = npcState.current?.id === n.id;
    return `
    <div class="npc-card ${t.cls}${isSelected ? ' npc-card-selected' : ''}" data-npc-id="${n.id}">
      <div class="npc-card-avatar">
        ${n.image
          ? `<img src="${n.image}" alt="${n.name}" class="npc-card-img" />`
          : `<span class="npc-card-icon">${t.icon}</span>`}
      </div>
      <div class="npc-card-info">
        <div class="npc-card-name">${n.name || '—'}</div>
        <div class="npc-card-type ${t.cls}">${t.label}</div>
        ${n.description ? `<div class="npc-card-desc">${n.description}</div>` : ''}
        <div class="npc-card-hp">
          HP <span>${n.hp_current}/${n.hp_max}</span>
          <div class="npc-hp-bar"><div class="npc-hp-fill" style="width:${hpPct}%"></div></div>
        </div>
      </div>
      <button class="btn btn-sm btn-ghost npc-edit-btn" data-npc-id="${n.id}">✏️</button>
    </div>`;
  }).join('');

  container.querySelectorAll('[data-npc-id]').forEach(el =>
    el.addEventListener('click', (e) => {
      const id = +e.currentTarget.dataset.npcId;
      if (id) selectNpc(id);
    })
  );
}

async function selectNpc(id) {
  try {
    npcState.current = await api.get(`/api/npcs/${id}`);
    populateNpcEditor(npcState.current);
    renderNpcList();
  } catch (e) { console.error(e); }
}

function populateNpcEditor(n) {
  const editor = $('#npc-editor');
  if (!editor) return;
  editor.style.display = 'flex';
  updateNpcEditorTitle();

  $('#npc-name').value          = n.name || '';
  $('#npc-type').value          = n.type || 'npc';
  $('#npc-description').value   = n.description || '';
  $('#npc-str').value           = n.str || 50;
  $('#npc-dex').value           = n.dex || 50;
  $('#npc-int').value           = n.int_val || 50;
  $('#npc-con').value           = n.con || 50;
  $('#npc-pow').value           = n.pow || 50;
  $('#npc-siz').value           = n.siz || 50;
  $('#npc-armor').value         = n.armor || 0;
  $('#npc-damage-bonus').value  = n.damage_bonus || '';
  $('#npc-hp-max').value        = n.hp_max || 10;
  $('#npc-mp-max').value        = n.mp_max || 10;
  $('#npc-san-max').value       = n.san_max || 0;
  $('#npc-hp-cur').textContent  = n.hp_current ?? n.hp_max ?? 0;
  $('#npc-mp-cur').textContent  = n.mp_current ?? n.mp_max ?? 0;
  $('#npc-san-cur').textContent = n.san_current ?? n.san_max ?? 0;
  $('#npc-skills-text').value   = n.skills_text || '';
  $('#npc-special').value       = n.special_abilities || '';
  $('#npc-notes').value         = n.notes || '';

  // Ocultar SAN para monstros
  const sanBlock = $('#npc-san-block');
  if (sanBlock) sanBlock.style.display = n.type === 'monster' ? 'none' : '';

  displayNpcPortrait(n.image || '');

  let attacks = [];
  try { attacks = JSON.parse(n.attacks || '[]'); } catch(e) {}
  renderNpcAttacks(attacks);
}

function updateNpcEditorTitle() {
  const n = npcState.current;
  if (!n) return;
  const t = NPC_TYPE_LABELS[n.type] || NPC_TYPE_LABELS.npc;
  const el = $('#npc-editor-title');
  if (el) el.textContent = `${t.icon} ${n.name || 'Sem nome'}`;
}

function displayNpcPortrait(base64) {
  const img = $('#npc-portrait-img');
  const ph  = $('#npc-portrait-placeholder');
  if (!img || !ph) return;
  if (base64) { img.src = base64; img.style.display = 'block'; ph.style.display = 'none'; }
  else        { img.src = '';     img.style.display = 'none';  ph.style.display = 'flex'; }
}

function renderNpcAttacks(attacks) {
  const container = $('#npc-attacks-list');
  if (!container) return;
  if (!attacks.length) {
    container.innerHTML = '<div class="npc-attacks-empty">Nenhum ataque. Clique em "+ Ataque".</div>';
    return;
  }

  container.innerHTML = attacks.map((a, i) => `
    <div class="npc-attack-row" data-idx="${i}">
      <input class="npc-atk-field" data-field="name" value="${(a.name||'').replace(/"/g,'&quot;')}" placeholder="Nome do Ataque" />
      <input class="npc-atk-field npc-atk-pct" type="number" data-field="skill_pct" value="${a.skill_pct||25}" min="1" max="400" title="Chance (%)" />%
      <input class="npc-atk-field npc-atk-dmg" data-field="damage" value="${(a.damage||'').replace(/"/g,'&quot;')}" placeholder="ex: 1d6+db" />
      <input class="npc-atk-field npc-atk-notes" data-field="notes" value="${(a.notes||'').replace(/"/g,'&quot;')}" placeholder="Notas" />
      <button class="btn btn-sm btn-ghost npc-roll-atk" data-idx="${i}" title="Rolar ataque">🎲</button>
      <button class="btn-remove npc-del-atk" data-idx="${i}">✕</button>
    </div>`).join('');

  const syncAttacks = () => {
    const updated = [...container.querySelectorAll('.npc-attack-row')].map(row => {
      const obj = {};
      row.querySelectorAll('[data-field]').forEach(inp => {
        obj[inp.dataset.field] = inp.type === 'number' ? (+inp.value || 0) : inp.value;
      });
      return obj;
    });
    if (npcState.current) {
      npcState.current.attacks = JSON.stringify(updated);
      saveCurrentNpc({ attacks: npcState.current.attacks });
      // Sync local array reference
      attacks.splice(0, attacks.length, ...updated);
    }
  };

  container.querySelectorAll('[data-field]').forEach(inp => inp.addEventListener('change', syncAttacks));

  container.querySelectorAll('.npc-del-atk').forEach(btn =>
    btn.addEventListener('click', () => {
      attacks.splice(+btn.dataset.idx, 1);
      if (npcState.current) {
        npcState.current.attacks = JSON.stringify(attacks);
        saveCurrentNpc({ attacks: npcState.current.attacks });
      }
      renderNpcAttacks(attacks);
    })
  );

  container.querySelectorAll('.npc-roll-atk').forEach(btn =>
    btn.addEventListener('click', () => {
      const atk = attacks[+btn.dataset.idx];
      if (!atk) return;
      openDiceRollerWithTarget(`${atk.name} (${npcState.current?.name || 'NPC'})`, atk.skill_pct || 25);
    })
  );
}

let _npcSaveTimer = null;
function saveCurrentNpc(fields) {
  if (!npcState.current) return;
  clearTimeout(_npcSaveTimer);
  _npcSaveTimer = setTimeout(async () => {
    try { await api.put(`/api/npcs/${npcState.current.id}`, fields); }
    catch (e) { console.error('Erro ao salvar NPC:', e); }
  }, 400);
}

// Chamar setupNpcs() no init()
// ─── Amigos / Friend Characters ──────────────────────────────
function setupFriends() {
  const btn = $('#btn-friends');
  if (!btn) return;
  btn.addEventListener('click', () => {
    loadFriendCharacters();
    $('#friends-modal').classList.add('open');
  });
  $('#friends-modal-close').addEventListener('click', () => $('#friends-modal').classList.remove('open'));

  $('#friend-import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const charData = parsed.character || parsed;
      if (!charData.name) { alert('JSON inválido: campo "name" não encontrado'); return; }
      // Always treat file imports from friends section as friend exports
      const imported = await api.post('/api/import', { character: charData, isFriendExport: true });
      loadFriendCharacters();
      alert(`"${imported.name}" adicionado como amigo!`);
    } catch (err) { alert('Erro ao importar amigo: ' + err.message); }
    e.target.value = '';
  });
}

async function loadFriendCharacters() {
  try {
    const chars = await api.get('/api/gm');
    renderFriendCharacters(chars);
  } catch (e) { console.error(e); }
}

// renderFriendCharacters is defined later with enhanced version

// ─── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

// ══════════════════════════════════════════════════════════════
// SESSÕES
// ══════════════════════════════════════════════════════════════

const sessionState = { list: [], active: null };

function setupSessions() {
  const btn = $('#btn-sessions');
  if (btn) btn.addEventListener('click', openSessionsModal);
  $('#sessions-modal-close')?.addEventListener('click', () => $('#sessions-modal').classList.remove('open'));
  $('#btn-create-session')?.addEventListener('click', () => {
    $('#session-create-form').style.display = 'block';
    populateSessionCharSelect();
  });
  $('#btn-cancel-session')?.addEventListener('click', () => {
    $('#session-create-form').style.display = 'none';
  });
  $('#btn-confirm-session')?.addEventListener('click', createAndEnterSession);

  // Show/hide character select based on role
  $$('input[name="sess-role"]').forEach(r => r.addEventListener('change', () => {
    const charGroup = $('#sess-char-group');
    if (charGroup) charGroup.style.display = r.value === 'player' ? '' : 'none';
  }));

  // Check URL for ?share= param on load
  checkShareParam();
}

async function openSessionsModal() {
  try {
    sessionState.list = await api.get('/api/sessions');
    sessionState.active = await api.get('/api/sessions/active');
    renderSessionsList();
    $('#session-create-form').style.display = 'none';
    $('#sessions-modal').classList.add('open');
  } catch (e) { console.error(e); }
}

function populateSessionCharSelect() {
  const sel = $('#sess-character');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Escolher depois —</option>' +
    state.characters.map(c => `<option value="${c.id}">${c.name}${c.occupation ? ` (${c.occupation})` : ''}</option>`).join('');
}

async function createAndEnterSession() {
  const name = $('#sess-name').value.trim() || 'Nova Sessão';
  const role = document.querySelector('input[name="sess-role"]:checked')?.value || 'player';
  const characterId = role === 'player' ? (+$('#sess-character').value || null) : null;
  try {
    const sess = await api.post('/api/sessions', { name, role, character_id: characterId });
    sessionState.active = sess;
    sessionState.list = await api.get('/api/sessions');
    renderSessionsList();
    $('#session-create-form').style.display = 'none';
    enterSession(sess);
    $('#sessions-modal').classList.remove('open');
  } catch (e) { alert('Erro ao criar sessão: ' + e.message); }
}

function enterSession(sess) {
  sessionState.active = sess;
  updateSidebarSessionBadge(sess);
  if (sess.role === 'master') {
    enterGmMode();
  } else if (sess.role === 'player' && sess.character_id) {
    selectCharacter(sess.character_id);
  }
}

function updateSidebarSessionBadge(sess) {
  const btn = $('#btn-sessions');
  if (!btn) return;
  if (sess) {
    btn.textContent = `🎮 ${sess.name}`;
    btn.title = `Sessão ativa: ${sess.name} (${sess.role === 'master' ? 'Mestre' : 'Jogador'})`;
    btn.classList.add('session-active');
  } else {
    btn.textContent = '🎮 Sessões';
    btn.removeAttribute('title');
    btn.classList.remove('session-active');
  }
  // Show session name in GM view
  const gmName = $('#gm-session-name');
  if (gmName) gmName.textContent = sess?.name || '';
}

function renderSessionsList() {
  const container = $('#sessions-list');
  if (!container) return;
  if (!sessionState.list.length) {
    container.innerHTML = '<div class="sessions-empty">Nenhuma sessão criada ainda.</div>';
    return;
  }
  container.innerHTML = sessionState.list.map(s => `
    <div class="session-card${s.is_active ? ' session-card-active' : ''}" data-sess-id="${s.id}">
      <div class="session-card-info">
        <span class="session-card-icon">${s.role === 'master' ? '🎭' : '🕵️'}</span>
        <div>
          <div class="session-card-name">${s.name}</div>
          <div class="session-card-meta">${s.role === 'master' ? 'Mestre' : 'Jogador'}${s.is_active ? ' · Ativa' : ''}</div>
        </div>
      </div>
      <div class="session-card-actions">
        <button class="btn btn-sm btn-primary sess-enter-btn" data-sid="${s.id}">Entrar</button>
        <button class="btn btn-sm btn-danger sess-del-btn" data-sid="${s.id}">✕</button>
      </div>
    </div>`).join('');

  container.querySelectorAll('.sess-enter-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      const sid = +btn.dataset.sid;
      await api.put(`/api/sessions/${sid}/activate`, {});
      const sess = sessionState.list.find(s => s.id === sid);
      if (sess) { sess.is_active = 1; enterSession(sess); }
      $('#sessions-modal').classList.remove('open');
    })
  );
  container.querySelectorAll('.sess-del-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      const sid = +btn.dataset.sid;
      if (!confirm('Excluir esta sessão?')) return;
      await api.delete(`/api/sessions/${sid}`);
      sessionState.list = sessionState.list.filter(s => s.id !== sid);
      if (sessionState.active?.id === sid) {
        sessionState.active = null;
        updateSidebarSessionBadge(null);
      }
      renderSessionsList();
    })
  );
}

// ══════════════════════════════════════════════════════════════
// CATÁLOGO DE ARMAS
// ══════════════════════════════════════════════════════════════

const catalogState = { list: [], editingId: null, filter: 'all', search: '' };

function setupWeaponCatalog() {
  const btn = $('#btn-weapon-catalog');
  if (btn) btn.addEventListener('click', openCatalogModal);
  $('#weapon-catalog-modal-close')?.addEventListener('click', () => $('#weapon-catalog-modal').classList.remove('open'));

  $('#btn-catalog-add')?.addEventListener('click', () => openCatalogForm(null));
  $('#btn-catalog-cancel')?.addEventListener('click', closeCatalogForm);
  $('#btn-catalog-save')?.addEventListener('click', saveCatalogWeapon);

  $('#btn-catalog-export')?.addEventListener('click', async () => {
    const resp = await fetch('/api/weapon-catalog/export');
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'weapon_catalog.json'; a.click();
    URL.revokeObjectURL(url);
  });

  $('#catalog-import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const weapons = data.weapons || data;
      await api.post('/api/weapon-catalog/import', { weapons });
      catalogState.list = await api.get('/api/weapon-catalog');
      renderCatalogTable();
      alert(`${weapons.length} armas importadas/atualizadas!`);
    } catch (err) { alert('Erro ao importar: ' + err.message); }
    e.target.value = '';
  });

  $('#catalog-filter-cat')?.addEventListener('change', e => { catalogState.filter = e.target.value; renderCatalogTable(); });
  $('#catalog-search')?.addEventListener('input', e => { catalogState.search = e.target.value.toLowerCase(); renderCatalogTable(); });
}

async function openCatalogModal() {
  try {
    catalogState.list = await api.get('/api/weapon-catalog');
    closeCatalogForm();
    renderCatalogTable();
    $('#weapon-catalog-modal').classList.add('open');
  } catch (e) { alert('Erro: ' + e.message); }
}

function openCatalogForm(weapon) {
  catalogState.editingId = weapon?.id || null;
  const form = $('#catalog-form');
  if (!form) return;
  form.style.display = 'block';
  $('#cat-name').value        = weapon?.name || '';
  $('#cat-category').value    = weapon?.category || 'other';
  $('#cat-skill').value       = weapon?.skill || '';
  $('#cat-damage').value      = weapon?.damage || '';
  $('#cat-range').value       = weapon?.range || '';
  $('#cat-apr').value         = weapon?.attacks_per_round || '1';
  $('#cat-ammo').value        = weapon?.ammo ?? 0;
  $('#cat-malfunction').value = weapon?.malfunction ?? 100;
  $('#cat-notes').value       = weapon?.notes || '';
  $('#cat-name').focus();
}

function closeCatalogForm() {
  const form = $('#catalog-form');
  if (form) form.style.display = 'none';
  catalogState.editingId = null;
}

async function saveCatalogWeapon() {
  const name = $('#cat-name').value.trim();
  if (!name) { alert('Informe o nome da arma'); return; }
  const data = {
    name, category: $('#cat-category').value,
    skill: $('#cat-skill').value, damage: $('#cat-damage').value,
    range: $('#cat-range').value, attacks_per_round: $('#cat-apr').value,
    ammo: +$('#cat-ammo').value || 0, malfunction: +$('#cat-malfunction').value || 100,
    notes: $('#cat-notes').value,
  };
  try {
    if (catalogState.editingId) {
      await api.put(`/api/weapon-catalog/${catalogState.editingId}`, data);
      const idx = catalogState.list.findIndex(w => w.id === catalogState.editingId);
      if (idx >= 0) catalogState.list[idx] = { ...catalogState.list[idx], ...data };
    } else {
      const created = await api.post('/api/weapon-catalog', data);
      catalogState.list.unshift(created);
    }
    closeCatalogForm();
    renderCatalogTable();
    // Also update the weapon-presets datalist
    rebuildWeaponDatalist();
  } catch (e) { alert('Erro ao salvar: ' + e.message); }
}

// Map WEAPON_PRESET skill to catalog category
function _presetCategory(skill) {
  if (!skill) return 'other';
  if (skill.includes('Brawl') || skill.includes('Fighting')) return 'melee';
  if (skill.includes('Handgun') || skill.includes('Pistola')) return 'handgun';
  if (skill.includes('Rifle') || skill.includes('Shotgun')) return 'rifle';
  if (skill.includes('Submachine') || skill.includes('SMG') || skill.includes('Submetralhadora')) return 'smg';
  if (skill.includes('Demolitions') || skill.includes('Throw') || skill.includes('Arremesso')) return 'explosive';
  return 'other';
}

function renderCatalogTable() {
  const tbody = $('#catalog-tbody');
  if (!tbody) return;
  const countEl = $('#catalog-count');

  // Built-in presets (shown as read-only), skip ones already overridden in catalog
  const catalogNames = new Set(catalogState.list.map(w => w.name));
  const builtins = WEAPON_PRESETS
    .filter(p => !catalogNames.has(p.name))
    .map(p => ({ ...p, _builtin: true, category: _presetCategory(p.skill) }));

  // Merge: user catalog first, then built-ins
  const allWeapons = [...catalogState.list, ...builtins];
  const search = catalogState.search;
  const filter = catalogState.filter;

  let filtered = allWeapons;
  if (filter !== 'all') filtered = filtered.filter(w => w.category === filter);
  if (search) filtered = filtered.filter(w =>
    w.name.toLowerCase().includes(search) || (w.skill||'').toLowerCase().includes(search)
  );

  const customCount = catalogState.list.length;
  if (countEl) countEl.textContent = `${customCount} personalizada${customCount !== 1 ? 's' : ''} · ${WEAPON_PRESETS.length} padrão`;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:16px">Nenhuma arma encontrada.</td></tr>';
    return;
  }

  const CAT_LABELS = { melee:'C.C.', handgun:'Pistola', rifle:'Rifle', smg:'SMG', heavy:'Pesada', explosive:'Explos.', other:'Outro' };
  tbody.innerHTML = filtered.map(w => `
    <tr class="${w._builtin ? 'catalog-builtin-row' : ''}">
      <td title="${w.notes||''}">${w.name}${w._builtin ? ' <span class="catalog-builtin-badge">padrão</span>' : ''}</td>
      <td>${CAT_LABELS[w.category]||w.category}</td>
      <td style="font-size:12px">${w.skill||'—'}</td>
      <td>${w.damage||'—'}</td>
      <td>${w.range||'—'}</td>
      <td>${w.attacks_per_round||'—'}</td>
      <td>${w.ammo||0}</td>
      <td>${w.malfunction||100}</td>
      <td class="catalog-actions">
        ${w._builtin ? '<span style="font-size:11px;color:var(--text-muted)">somente leitura</span>' : `
          <button class="btn btn-sm btn-ghost cat-edit-btn" data-wid="${w.id}">✏️</button>
          <button class="btn btn-sm btn-danger cat-del-btn" data-wid="${w.id}">✕</button>
        `}
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('.cat-edit-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const w = catalogState.list.find(x => x.id === +btn.dataset.wid);
      if (w) openCatalogForm(w);
    })
  );
  tbody.querySelectorAll('.cat-del-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      const wid = +btn.dataset.wid;
      const w = catalogState.list.find(x => x.id === wid);
      if (!confirm(`Excluir "${w?.name}"?`)) return;
      await api.delete(`/api/weapon-catalog/${wid}`);
      catalogState.list = catalogState.list.filter(x => x.id !== wid);
      renderCatalogTable();
      rebuildWeaponDatalist();
    })
  );
}

function rebuildWeaponDatalist() {
  const dl = $('#weapon-presets');
  if (!dl) return;
  dl.innerHTML = '';
  // Built-in presets first
  WEAPON_PRESETS.forEach(w => { const o = document.createElement('option'); o.value = w.name; dl.appendChild(o); });
  // Then catalog weapons
  catalogState.list.forEach(w => {
    if (!WEAPON_PRESETS.find(p => p.name === w.name)) {
      const o = document.createElement('option'); o.value = w.name; dl.appendChild(o);
    }
  });
}

function getCatalogWeaponPreset(name) {
  // Check catalog first, then built-in
  const catWeapon = catalogState.list.find(w => w.name === name);
  if (catWeapon) return {
    name: catWeapon.name, skill: catWeapon.skill, damage: catWeapon.damage,
    range: catWeapon.range, attacks_per_round: catWeapon.attacks_per_round,
    ammo: catWeapon.ammo, malfunction: catWeapon.malfunction,
  };
  return WEAPON_PRESETS.find(p => p.name === name) || null;
}

// ══════════════════════════════════════════════════════════════
// COMPARTILHAR VIA LINK (base64)
// ══════════════════════════════════════════════════════════════

function setupShareLink() {
  $('#btn-share-link')?.addEventListener('click', openShareModal);
  $('#share-modal-close')?.addEventListener('click', () => $('#share-modal').classList.remove('open'));
  $('#btn-copy-share-link')?.addEventListener('click', copyShareLink);
  $$('input[name="share-type"]').forEach(r => r.addEventListener('change', updateShareLink));
}

function openShareModal() {
  if (!state.current) return;
  updateShareLink();
  $('#share-modal').classList.add('open');
}

function updateShareLink() {
  if (!state.current) return;
  const type = document.querySelector('input[name="share-type"]:checked')?.value || 'full';
  const c = { ...state.current };
  if (type === 'friend') {
    ['appearance_desc','ideology','significant_people','meaningful_locations',
     'treasured_possessions','traits','injuries_scars','phobias_manias',
     'arcane_tomes','backstory','notes'].forEach(f => delete c[f]);
  }
  const payload = { version: 4, exportedAt: new Date().toISOString(), character: c, isFriendExport: type === 'friend' };
  // Include evidence in full export
  if (type === 'full' && evidenceState.items.length > 0) {
    payload.evidence = evidenceState.items.map(({ id, ...ev }) => ev);
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${location.origin}${location.pathname}?share=${encoded}`;
    const input = $('#share-link-input');
    if (input) input.value = url;
    $('#share-copied').style.display = 'none';
    // Update share desc with evidence count
    const descEl = $('.share-desc');
    if (descEl && type === 'full' && evidenceState.items.length > 0) {
      descEl.innerHTML = `Copie o link abaixo para compartilhar. Quem receber pode clicar em <strong>🔗 Importar via Link</strong> na barra lateral para importar de forma rápida. <em>(inclui ${evidenceState.items.length} evidência(s))</em>`;
    }
  } catch (e) { console.error('Erro ao gerar link:', e); }
}

async function copyShareLink() {
  const input = $('#share-link-input');
  if (!input) return;
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select(); document.execCommand('copy');
  }
  const copied = $('#share-copied');
  if (copied) { copied.style.display = 'block'; setTimeout(() => copied.style.display = 'none', 3000); }
}

async function checkShareParam() {
  const params = new URLSearchParams(location.search);
  const shareData = params.get('share');
  if (!shareData) return;
  history.replaceState({}, '', location.pathname);
  try {
    const parsed = _decodeShareData(shareData);
    if (!parsed) return;
    const charData = parsed.character || parsed;
    if (!charData.name) return;
    const evidenceItems = parsed.evidence || [];
    const isFriend = !!parsed.isFriendExport;
    let msg = isFriend
      ? `Deseja importar o personagem amigo "${charData.name}"? (aparecerá apenas na vista de Amigos)`
      : `Deseja importar o personagem "${charData.name}" via link compartilhado?`;
    if (evidenceItems.length > 0) msg += `\n(inclui ${evidenceItems.length} evidência(s))`;
    if (!confirm(msg)) return;
    const imported = await api.post('/api/import', { character: charData, isFriendExport: isFriend });
    if (isFriend) {
      // Friend: only refresh friends grid, don't add to sidebar
      loadFriendCharacters();
      alert(`"${imported.name}" adicionado como amigo!`);
    } else {
      const existingIdx = state.characters.findIndex(c => c.id === imported.id);
      const entry = { id: imported.id, name: imported.name, player: imported.player, occupation: imported.occupation, age: imported.age };
      if (existingIdx >= 0) state.characters[existingIdx] = entry; else state.characters.unshift(entry);
      renderCharacterList();
      selectCharacter(imported.id);
    }
    if (evidenceItems.length > 0) {
      await api.post('/api/evidence/import', { evidence: evidenceItems });
      evidenceState.items = await api.get('/api/evidence');
    }
  } catch (e) { console.error('Erro ao processar link compartilhado:', e); }
}

// Helper: decode base64 share data from URL or raw string
function _decodeShareData(raw) {
  try {
    // Try extracting from URL if looks like a URL
    if (raw.startsWith('http') || raw.includes('?share=')) {
      try {
        const url = new URL(raw.startsWith('http') ? raw : 'https://x?' + raw.split('?')[1]);
        raw = url.searchParams.get('share') || raw;
      } catch { /* use as-is */ }
    }
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch { return null; }
}

function setupImportLinkModal() {
  const modal = $('#import-link-modal');
  if (!modal) return;
  const closeModal = () => {
    modal.classList.remove('open');
    $('#import-link-input').value = '';
    $('#import-link-result').style.display = 'none';
  };
  $('#btn-import-link')?.addEventListener('click', () => modal.classList.add('open'));
  $('#import-link-modal-close')?.addEventListener('click', closeModal);
  $('#btn-import-link-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  $('#btn-import-link-confirm')?.addEventListener('click', async () => {
    const raw = $('#import-link-input').value.trim();
    if (!raw) return;
    const resultEl = $('#import-link-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span style="color:var(--text-muted)">Importando...</span>';
    try {
      const parsed = _decodeShareData(raw);
      if (!parsed) throw new Error('Link ou código inválido');
      const charData = parsed.character || parsed;
      if (!charData.name) throw new Error('Personagem sem nome no link');
      const isFriend = !!parsed.isFriendExport;
      const imported = await api.post('/api/import', { character: charData, isFriendExport: isFriend });
      let lines = [];
      if (isFriend) {
        loadFriendCharacters();
        lines.push(`✓ Amigo <strong>"${imported.name}"</strong> importado! (vista de Amigos)`);
      } else {
        const existingIdx = state.characters.findIndex(c => c.id === imported.id);
        const entry = { id: imported.id, name: imported.name, player: imported.player, occupation: imported.occupation, age: imported.age };
        if (existingIdx >= 0) state.characters[existingIdx] = entry; else state.characters.unshift(entry);
        renderCharacterList();
        await selectCharacter(imported.id);
        lines.push(`✓ Personagem <strong>"${imported.name}"</strong> ${imported.wasUpdated ? 'atualizado' : 'importado'}!`);
      }
      const evidenceItems = parsed.evidence || [];
      if (evidenceItems.length > 0) {
        await api.post('/api/evidence/import', { evidence: evidenceItems });
        evidenceState.items = await api.get('/api/evidence');
        lines.push(`✓ ${evidenceItems.length} evidência(s) importada(s)!`);
      }
      resultEl.innerHTML = `<span style="color:#4caf50">${lines.join('<br>')}</span>`;
      setTimeout(closeModal, 2500);
    } catch (e) {
      resultEl.innerHTML = `<span style="color:var(--danger)">Erro: ${e.message}</span>`;
    }
  });
}

// ══════════════════════════════════════════════════════════════
// CREDIT RATING → CÁLCULO DE BENS E RIQUEZA
// ══════════════════════════════════════════════════════════════

// CoC 7e — Status labels por faixa de Credit Rating
const CR_STATUS = [
  { min: 0,  max: 0,  status: 'Pauper (Indigente)' },
  { min: 1,  max: 9,  status: 'Pobre' },
  { min: 10, max: 29, status: 'Médio' },
  { min: 30, max: 49, status: 'Confortável' },
  { min: 50, max: 69, status: 'Próspero' },
  { min: 70, max: 89, status: 'Rico' },
  { min: 90, max: 98, status: 'Muito Rico' },
  { min: 99, max: 99, status: 'Super Rico' },
];

// CoC 7e exact formulas (dólares de 1920):
//   Dinheiro em Mãos = CR × 2
//   Patrimônio       = CR × 25
//   Gasto Diário     = CR / 5  (mínimo $0,50)
function _crExact(cr) {
  const fmt = n => n >= 1000
    ? '$' + n.toLocaleString('pt-BR')
    : n === 0 ? '$0'
    : n < 1 ? '$0,50'
    : '$' + n.toFixed(0);
  if (cr === 99) return { spending: 'Sem limite', cash: '$250.000+', assets: '$5.000.000+' };
  return {
    spending: fmt(Math.max(0.5, cr / 5)) + '/dia',
    cash:     fmt(cr * 2),
    assets:   fmt(cr * 25),
  };
}

function setupCreditRating() {
  $('#btn-calc-cr')?.addEventListener('click', calcCreditRating);
}

function calcCreditRating() {
  if (!state.current) { alert('Selecione um personagem primeiro.'); return; }
  const crSkill = state.current.skills?.find(s => s.name.includes('Credit Rating'));
  if (!crSkill) { alert('Habilidade "Credit Rating" não encontrada.'); return; }
  const crVal = crSkill.value || crSkill.base_value || 0;
  const statusRow = CR_STATUS.find(r => crVal >= r.min && crVal <= r.max) || CR_STATUS[0];
  const { spending, cash, assets } = _crExact(crVal);

  const resultEl = $('#cr-result');
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="cr-result-inner">
        <div class="cr-result-status"><strong>Credit Rating: ${crVal}%</strong> — ${statusRow.status}</div>
        <div class="cr-result-row">
          <span class="cr-label">Gasto Diário:</span><span class="cr-val">${spending}</span>
          <button class="btn btn-xs btn-ghost cr-apply-btn" data-field="spending_level" data-val="${spending}">Aplicar</button>
        </div>
        <div class="cr-result-row">
          <span class="cr-label">Dinheiro em Mãos:</span><span class="cr-val">${cash}</span>
          <button class="btn btn-xs btn-ghost cr-apply-btn" data-field="cash" data-val="${cash}">Aplicar</button>
        </div>
        <div class="cr-result-row">
          <span class="cr-label">Patrimônio:</span><span class="cr-val">${assets}</span>
          <button class="btn btn-xs btn-ghost cr-apply-btn" data-field="assets" data-val="${assets}">Aplicar</button>
        </div>
      </div>`;

    resultEl.querySelectorAll('.cr-apply-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const field = btn.dataset.field;
        const val = btn.dataset.val;
        const inputMap = { cash: '#field-cash', spending_level: '#field-spending-level', assets: '#field-assets' };
        const el = $(inputMap[field]);
        if (el) { el.value = val; state.current[field] = val; }
        await api.put(`/api/characters/${state.current.id}`, { [field]: val });
        showSaveIndicator();
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = 'Aplicar', 2000);
      })
    );
  }
}

// ══════════════════════════════════════════════════════════════
// RETRATO — Change/Remove Photo
// ══════════════════════════════════════════════════════════════

function setupPortraitActions() {
  const area = $('#portrait-area');
  const actions = $('#portrait-actions');

  area?.addEventListener('mouseenter', () => {
    if (state.current && actions) actions.style.display = 'flex';
  });
  area?.addEventListener('mouseleave', () => {
    if (actions) actions.style.display = 'none';
  });

  $('#btn-change-portrait')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.current) $('#portrait-file').click();
  });

  $('#btn-remove-portrait')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!state.current) return;
    if (!confirm('Remover a foto do personagem?')) return;
    state.current.image = '';
    displayPortrait('');
    await api.put(`/api/characters/${state.current.id}`, { image: '' });
    showSaveIndicator();
    if (actions) actions.style.display = 'none';
  });
}

// ══════════════════════════════════════════════════════════════
// NPC EXPORT / IMPORT
// ══════════════════════════════════════════════════════════════

function setupNpcExportImport() {
  $('#btn-npcs-export-all')?.addEventListener('click', async () => {
    const resp = await fetch('/api/npcs/export');
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'npcs_export.json'; a.click();
    URL.revokeObjectURL(url);
  });

  $('#btn-export-npc')?.addEventListener('click', async () => {
    if (!npcState.current) return;
    const resp = await fetch(`/api/npcs/export/${npcState.current.id}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const safeName = (npcState.current.name || 'npc').replace(/[^a-z0-9]/gi, '_');
    const a = document.createElement('a'); a.href = url; a.download = `${safeName}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  $('#npcs-import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const npcs = data.npcs || (data.npc ? [data.npc] : null);
      if (!npcs) throw new Error('Formato inválido');
      const result = await api.post('/api/npcs/import', { npcs });
      npcState.list = await api.get('/api/npcs');
      renderNpcList();
      alert(`${result.count} NPCs importados com sucesso!`);
    } catch (err) { alert('Erro ao importar: ' + err.message); }
    e.target.value = '';
  });
}

// ══════════════════════════════════════════════════════════════
// GM VIEW — Enhancements
// ══════════════════════════════════════════════════════════════

function setupGmEnhancements() {
  // Quick access buttons
  $('#btn-gm-npcs')?.addEventListener('click', () => {
    loadNpcs(); $('#npcs-modal').classList.add('open');
  });
  $('#btn-gm-evidence')?.addEventListener('click', () => {
    loadEvidence(); $('#evidence-modal').classList.add('open');
  });

  // Bulk damage
  $('#btn-gm-bulk-san')?.addEventListener('click', () => {
    const panel = $('#gm-bulk-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  $('#btn-gm-bulk-close')?.addEventListener('click', () => {
    const panel = $('#gm-bulk-panel'); if (panel) panel.style.display = 'none';
  });
  $('#btn-gm-bulk-apply')?.addEventListener('click', async () => {
    const vital = $('#gm-bulk-vital').value;
    const dir = +$('#gm-bulk-dir').value;
    const amount = +$('#gm-bulk-amount').value || 1;
    if (!confirm(`Aplicar ${dir > 0 ? '+' : ''}${dir * amount} em ${vital.toUpperCase()} de todos os personagens?`)) return;
    for (const c of state.gmCharacters) {
      const max = c[`${vital}_max`] || 1;
      let cur = Math.max(0, Math.min(max, (c[`${vital}_current`] || 0) + dir * amount));
      c[`${vital}_current`] = cur;
      await api.put(`/api/characters/${c.id}`, { [`${vital}_current`]: cur });
    }
    renderGmView();
  });

  // Group rolls
  $('#btn-gm-roll-perception')?.addEventListener('click', () => gmGroupRoll('Spot Hidden', 'Detectar'));
  $('#btn-gm-roll-san')?.addEventListener('click', () => gmGroupRoll(null, 'SAN', true));
  $('#btn-gm-reset-vitals')?.addEventListener('click', async () => {
    if (!confirm('Restaurar HP e MP ao máximo para todos os personagens?')) return;
    for (const c of state.gmCharacters) {
      await api.put(`/api/characters/${c.id}`, { hp_current: c.hp_max, mp_current: c.mp_max });
      c.hp_current = c.hp_max; c.mp_current = c.mp_max;
    }
    renderGmView();
  });

  // Session notes autosave
  $('#gm-session-notes')?.addEventListener('input', debounce(async () => {
    if (!sessionState.active) return;
    await api.put(`/api/sessions/${sessionState.active.id}`, { notes: $('#gm-session-notes').value });
  }, 800));
}

function debounce(fn, delay) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function gmGroupRoll(skillName, label, isSan = false) {
  const results = state.gmCharacters.map(c => {
    let target = 0;
    if (isSan) {
      target = c.san_current || 0;
    } else if (skillName) {
      const sk = c.skills?.find(s => s.name.includes(skillName));
      target = sk?.value || 0;
    }
    const roll = Math.floor(Math.random() * 100) + 1;
    const { label: lvl } = cocSuccessLevel(roll, target);
    return { name: c.name, roll, target, lvl };
  });

  const resultHtml = results.map(r =>
    `<div><strong>${r.name}</strong>: ${r.roll} vs ${r.target} → ${r.lvl}</div>`
  ).join('');
  const div = Object.assign(document.createElement('div'), {
    style: 'position:fixed;top:80px;right:20px;background:var(--bg-card);border:1px solid var(--accent);padding:16px;border-radius:8px;z-index:999;max-width:300px',
    innerHTML: `<strong>🎲 ${label} (grupo)</strong><div style="margin-top:8px;font-size:14px">${resultHtml}</div>
    <button style="margin-top:8px;background:var(--accent);border:none;color:white;padding:4px 12px;border-radius:4px;cursor:pointer">Fechar</button>`,
  });
  div.querySelector('button').addEventListener('click', () => div.remove());
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 15000);
}

// ══════════════════════════════════════════════════════════════
// FRIENDS VIEW — Enhanced (like GM view)
// ══════════════════════════════════════════════════════════════

function renderFriendCharacters(chars) {
  const grid = $('#friends-grid');
  if (!grid) return;
  if (!chars.length) {
    grid.innerHTML = '<div class="friends-empty">Nenhum personagem importado ainda.<br><small>Use "Exportar Amigo" ou "Compartilhar" na ficha de um personagem.</small></div>';
    return;
  }
  grid.innerHTML = chars.map(c => {
    const hpPct  = c.hp_max  ? Math.round((c.hp_current  / c.hp_max)  * 100) : 0;
    const sanPct = c.san_max ? Math.round((c.san_current / c.san_max) * 100) : 0;
    const mpPct  = c.mp_max  ? Math.round((c.mp_current  / c.mp_max)  * 100) : 0;
    const topSkills = (c.skills || [])
      .filter(s => s.value > s.base_value)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const weapons = (c.weapons || []).filter(w => w.name);
    const flags = [
      c.temporary_insanity  ? `<span class="gm-flag gm-flag-temp-insane">Insanidade Temp.</span>` : '',
      c.indefinite_insanity ? `<span class="gm-flag gm-flag-indef-insane">Insanidade Indef.</span>` : '',
      c.major_wound         ? `<span class="gm-flag gm-flag-wound">Ferimento Grave</span>` : '',
      c.unconscious         ? `<span class="gm-flag gm-flag-unconscious">Inconsciente</span>` : '',
    ].filter(Boolean).join('');
    return `
    <div class="friend-gm-card" data-friend-id="${c.id}">
      <div class="friend-gm-header">
        <div class="friend-gm-portrait">
          ${c.image
            ? `<img src="${c.image}" alt="${c.name}" class="friend-gm-img" onclick="showImageFullscreen('${c.image}')" />`
            : '<div class="friend-gm-placeholder">👤</div>'}
        </div>
        <div class="friend-gm-info">
          <div class="friend-gm-name">${c.name || '—'}</div>
          <div class="friend-gm-sub">${[c.occupation, c.age ? c.age + ' anos' : ''].filter(Boolean).join(' · ') || '—'}</div>
        </div>
        <button class="btn btn-sm btn-ghost friend-open-btn" data-fid="${c.id}">Ver Ficha</button>
      </div>
      <div class="friend-gm-vitals">
        <div class="friend-vital-row">
          <span class="friend-vital-label">HP</span>
          <div class="friend-vital-bar"><div class="friend-vital-fill friend-hp-fill" style="width:${hpPct}%"></div></div>
          <div class="friend-vital-controls">
            <button class="fv-ctrl-btn" data-fv-vital="hp" data-fid="${c.id}" data-dir="-1">−</button>
            <span class="friend-vital-val" id="fv-hp-${c.id}">${c.hp_current}/${c.hp_max}</span>
            <button class="fv-ctrl-btn" data-fv-vital="hp" data-fid="${c.id}" data-dir="1">+</button>
          </div>
        </div>
        <div class="friend-vital-row">
          <span class="friend-vital-label">SAN</span>
          <div class="friend-vital-bar"><div class="friend-vital-fill friend-san-fill" style="width:${sanPct}%"></div></div>
          <div class="friend-vital-controls">
            <button class="fv-ctrl-btn" data-fv-vital="san" data-fid="${c.id}" data-dir="-1">−</button>
            <span class="friend-vital-val" id="fv-san-${c.id}">${c.san_current}/${c.san_max}</span>
            <button class="fv-ctrl-btn" data-fv-vital="san" data-fid="${c.id}" data-dir="1">+</button>
          </div>
        </div>
        <div class="friend-vital-row">
          <span class="friend-vital-label">MP</span>
          <div class="friend-vital-bar"><div class="friend-vital-fill friend-mp-fill" style="width:${mpPct}%"></div></div>
          <div class="friend-vital-controls">
            <button class="fv-ctrl-btn" data-fv-vital="mp" data-fid="${c.id}" data-dir="-1">−</button>
            <span class="friend-vital-val" id="fv-mp-${c.id}">${c.mp_current}/${c.mp_max}</span>
            <button class="fv-ctrl-btn" data-fv-vital="mp" data-fid="${c.id}" data-dir="1">+</button>
          </div>
        </div>
      </div>
      ${flags ? `<div class="friend-flags">${flags}</div>` : ''}
      ${topSkills.length ? `<div class="friend-gm-skills">🎯 ${topSkills.map(s => `<span title="${s.name}">${s.name.split('(')[0].trim()}: <b>${s.value}%</b></span>`).join('')}</div>` : ''}
      ${weapons.length ? `<div class="friend-gm-weapons">🗡️ ${weapons.map(w => w.name).join(' · ')}</div>` : ''}
    </div>`;
  }).join('');

  // Vital controls for friends
  grid.querySelectorAll('.fv-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const fid = +btn.dataset.fid;
      const vital = btn.dataset.fvVital;
      const dir = +btn.dataset.dir;
      const c = chars.find(x => x.id === fid);
      if (!c) return;
      const max = c[`${vital}_max`] || 1;
      let cur = Math.max(0, Math.min(max, (c[`${vital}_current`] || 0) + dir));
      c[`${vital}_current`] = cur;
      const span = $(`#fv-${vital}-${fid}`);
      if (span) span.textContent = `${cur}/${max}`;
      // Update bar
      const card = grid.querySelector(`[data-friend-id="${fid}"]`);
      const barMap = { hp: 'friend-hp-fill', san: 'friend-san-fill', mp: 'friend-mp-fill' };
      const fill = card?.querySelector(`.${barMap[vital]}`);
      if (fill) fill.style.width = `${Math.round((cur / max) * 100)}%`;
      await api.put(`/api/characters/${fid}`, { [`${vital}_current`]: cur });
      // Sync with state.current if it's this char
      if (state.current?.id === fid) {
        state.current[`${vital}_current`] = cur;
        updateVitalDisplay(vital, cur, max);
      }
    });
  });

  // Open character sheet button
  grid.querySelectorAll('.friend-open-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      await selectCharacter(+btn.dataset.fid);
      $('#friends-modal').classList.remove('open');
    })
  );
}


// ══════════════════════════════════════════════════════════════
// MAIN init() — full version
// ══════════════════════════════════════════════════════════════

async function init() {
  await Promise.all([loadCharacters(), loadConfig()]);
  setupEventListeners();
  setupDiceRoller();
  setupGmView();
  setupConfigPage();
  setupPortrait();
  setupPortraitActions();
  setupBooks();
  setupEvidence();
  setupFriends();
  setupNpcs();
  setupSessions();
  setupWeaponCatalog();
  setupShareLink();
  setupCreditRating();
  setupNpcExportImport();
  setupGmEnhancements();
  setupImportLinkModal();
  setupPdfSearch();
  // Load catalog for weapon autocomplete
  try {
    catalogState.list = await api.get('/api/weapon-catalog');
    rebuildWeaponDatalist();
  } catch (e) {}
  // Restore active session
  try {
    const active = await api.get('/api/sessions/active');
    if (active) { sessionState.active = active; updateSidebarSessionBadge(active); }
  } catch (e) {}
  // Populate weapon presets datalist (built-in)
  const dl = $('#weapon-presets');
  if (dl) WEAPON_PRESETS.forEach(w => { const o = document.createElement('option'); o.value = w.name; dl.appendChild(o); });
}

// ══════════════════════════════════════════════════════════════
// BUSCA EM PDFs — Ctrl+K
// ══════════════════════════════════════════════════════════════

function _highlightMatch(text, q) {
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(esc, 'gi'), m => `<mark>${m}</mark>`);
}

function setupPdfSearch() {
  const overlay = $('#pdf-search-overlay');
  const input   = $('#pdf-search-input');
  const results = $('#pdf-search-results');
  if (!overlay) return;

  const open  = () => { overlay.classList.add('open'); setTimeout(() => input?.focus(), 50); };
  const close = () => { overlay.classList.remove('open'); };

  // Ctrl+K global shortcut (also triggered from sidebar btn-books if we add one)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? close() : open();
    }
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  let debounce;
  input?.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = '<div class="pdf-search-hint">Digite pelo menos 2 caracteres para buscar...</div>';
      return;
    }
    results.innerHTML = '<div class="pdf-searching">🔄 Buscando...</div>';
    debounce = setTimeout(async () => {
      try {
        const data = await api.get(`/api/books/search?q=${encodeURIComponent(q)}`);
        if (!data.length) {
          results.innerHTML = '<div class="pdf-no-results">Nenhum resultado encontrado.</div>';
          return;
        }
        results.innerHTML = data.map(r => `
          <div class="pdf-result-book">
            <div class="pdf-result-book-name">📄 ${r.book} <span style="font-size:11px;color:var(--text-muted)">(${r.matches.length} trecho${r.matches.length > 1 ? 's' : ''})</span></div>
            ${r.matches.map(m => `
              <div class="pdf-result-match" data-book="${encodeURIComponent(r.book)}">...${_highlightMatch(m.context, q)}...</div>
            `).join('')}
          </div>`).join('');
        results.querySelectorAll('.pdf-result-match').forEach(el =>
          el.addEventListener('click', () => {
            openBookViewer(decodeURIComponent(el.dataset.book));
            close();
          })
        );
      } catch (err) {
        results.innerHTML = `<div class="pdf-no-results">Erro: ${err.message}</div>`;
      }
    }, 400);
  });
}

// Patch the friends reload button
document.addEventListener('DOMContentLoaded', () => {
  $('#btn-friends-reload')?.addEventListener('click', loadFriendCharacters);
  $('#btn-friend-share-import')?.addEventListener('click', () => {
    const url = prompt('Cole o link de compartilhamento:');
    if (!url) return;
    try {
      const params = new URLSearchParams(new URL(url).search);
      const shareData = params.get('share');
      if (!shareData) throw new Error('Link inválido');
      const json = decodeURIComponent(escape(atob(shareData)));
      const parsed = JSON.parse(json);
      const charData = parsed.character || parsed;
      if (!charData.name) throw new Error('Personagem inválido');
      api.post('/api/import', { character: charData, isFriendExport: true }).then(imported => {
        loadFriendCharacters();
        alert(`"${imported.name}" adicionado como amigo!`);
      });
    } catch (e) { alert('Erro: ' + e.message); }
  });

  // Update GM session notes when active session changes
  $('#gm-session-notes')?.addEventListener('focus', () => {
    if (sessionState.active?.notes) {
      $('#gm-session-notes').value = sessionState.active.notes || '';
    }
  });
});
