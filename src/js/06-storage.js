/* ================= storage =================
   One run is one save. Most of the run lives in S, but four things do not and
   have to be captured alongside it: the id counters, the gameplay RNG position,
   the lead scientists (LEADS holds their pulls, quit flag and walking actor) and
   the loose world objects C (the escaped specimen) and shuttle.

   Every one of those id counters has to be here: a counter left behind resets to
   zero on load and the next thing minted collides with something that already
   exists, which silently rebinds crews, lab heads and relationships. Adding a
   new `let xSeq` means adding it here, and the save test checks for exactly this.

   Encoding is generic on purpose. S grows every time the game does, so a
   field-by-field writer would rot; instead everything reachable is walked, Sets
   are tagged, and anything unserializable throws with its path so a bad field
   fails loudly in the smoke tests rather than silently writing a broken save. */
const SAVE_VERSION = 2;
const SAVE_KEY = 'rs7.save.';
const SAVE_SLOTS = ['auto', '1', '2', '3'];
/* Never saved: S.dirty is a render flag, and any key starting with _ is a
   drawing cache hung off a state object (planet sprites, for one). Caches are
   rebuilt lazily from the data that produced them, so leaving them out keeps
   DOM nodes out of the save and makes the payload smaller. */
const SKIP_KEYS = new Set(['dirty']);
const skipKey = k => SKIP_KEYS.has(k) || k.charCodeAt(0) === 95;

function encode(v, path){
  if(v === null) return null;
  const t = typeof v;
  if(t === 'number'){ if(!isFinite(v)) throw new Error(`cannot save ${v} at ${path}`); return v; }
  if(t === 'string' || t === 'boolean') return v;
  if(t === 'function') throw new Error(`cannot save a function at ${path}`);
  if(t !== 'object') throw new Error(`cannot save a ${t} at ${path}`);
  if(v instanceof Set) return {$set:[...v].map((x, i) => encode(x, `${path}<set ${i}>`))};
  if(Array.isArray(v)) return v.map((x, i) => encode(x, `${path}[${i}]`));
  if(v.nodeType || v === window || v instanceof Date) throw new Error(`cannot save a host object at ${path}`);
  const o = {};
  for(const k in v){
    if(skipKey(k) || v[k] === undefined) continue;
    o[k] = encode(v[k], `${path}.${k}`);
  }
  return o;
}
function decode(v){
  if(v === null || typeof v !== 'object') return v;
  if(Array.isArray(v)) return v.map(decode);
  if(v.$set) return new Set(v.$set.map(decode));
  const o = {};
  for(const k in v) o[k] = decode(v[k]);
  return o;
}

/* A pending dialog choice is a decision in flight, and its branches are
   closures, so the only honest thing is to wait for the player to answer. */
function saveBlocked(){
  if(!S) return 'No run in progress.';
  if(S.over) return 'The run is over.';
  if(cur || Q.length) return 'Someone is waiting on an answer. Clear the dialog first.';
  return '';
}
function leadState(){
  const o = {};
  for(const k in LEADS) o[k] = {pulls:LEADS[k].pulls, quit:LEADS[k].quit, actor:LEADS[k].actor};
  return o;
}
function captureRun(){
  return {
    v:SAVE_VERSION, stamp:Date.now(),
    day:dayOf(S.t) + 1, hour:hourOf(S.t), seed:S.seed, funds:Math.round(S.funds),
    specs:S.specs.filter(s => s.alive).length, papers:S.specs.filter(s => s.paperV > 0).length,
    rng:rngSnapshot(), seq:{spec:specSeq, item:itemSeq, cmp:cmpSeq, mat:matSeq, staff:staffSeq},
    G:encode(G, 'G'), S:encode(S, 'S'), leads:encode(leadState(), 'leads'),
    creature:{u:C.u, v:C.v},
    shuttle:encode({active:shuttle.active, p:shuttle.p, leg:shuttle.leg, job:shuttle.job, queue:shuttle.queue}, 'shuttle'),
    cam:{zoom:cam.zoom, px:cam.px, py:cam.py}
  };
}
function restoreRun(d){
  if(!d || typeof d !== 'object') return 'That save could not be read.';
  if(d.v !== SAVE_VERSION) return `That save is from another version of the game (${d.v} not ${SAVE_VERSION}).`;
  S = decode(d.S);
  G = decode(d.G) || {g:0, runs:0};
  specSeq = d.seq.spec; itemSeq = d.seq.item; cmpSeq = d.seq.cmp; matSeq = d.seq.mat; staffSeq = d.seq.staff || 0;
  seedRng(d.rng);
  for(const k in LEADS){
    const L = LEADS[k], s = d.leads[k];
    if(!s) continue;
    L.pulls = s.pulls; L.quit = s.quit; L.actor = decode(s.actor);
  }
  C.u = d.creature.u; C.v = d.creature.v;
  Object.assign(shuttle, decode(d.shuttle));
  Object.assign(cam, d.cam);
  /* Everything below is presentation, rebuilt from the restored run. */
  Q.length = 0; cur = null; clearInterval(typer); typer = null;
  clearTimeout(toastTimer); toastTimer = null;
  parts.length = 0;
  ['#dlg', '#toast', '#end', '#pub', '#breach', '#study', '#report'].forEach(id => { $(id).hidden = true; });
  autoPending = false;
  S.dirty = true;
  camFit(); renderAll(); updateLive();
  return '';
}

function slotKey(slot){ return SAVE_KEY + slot; }
function readSlot(slot){
  try { const raw = localStorage.getItem(slotKey(slot)); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}
function slotInfo(slot){
  const d = readSlot(slot);
  if(!d || d.v !== SAVE_VERSION) return null;
  return {slot, stamp:d.stamp, day:d.day, hour:d.hour, seed:d.seed, funds:d.funds, specs:d.specs, papers:d.papers};
}
function writeSlot(slot){
  const why = saveBlocked();
  if(why) return why;
  let data;
  try { data = captureRun(); }
  catch(e){ console.error(e); return 'This run could not be packed up: ' + e.message; }
  try { localStorage.setItem(slotKey(slot), JSON.stringify(data)); }
  catch(e){ return 'There is no room left to save. Delete a save and try again.'; }
  return '';
}
function loadSlot(slot){
  const d = readSlot(slot);
  if(!d) return 'That slot is empty.';
  return restoreRun(d);
}
function deleteSlot(slot){ try { localStorage.removeItem(slotKey(slot)); } catch(e){} }
function hasAnySave(){ return SAVE_SLOTS.some(s => !!slotInfo(s)); }

/* Autosave is requested at the day's seams and written as soon as nobody is
   mid-sentence, so it never interrupts a decision. */
let autoPending = false;
const requestAutosave = () => { autoPending = true; };
function flushAutosave(){
  if(!autoPending || saveBlocked()) return;
  autoPending = false;
  const why = writeSlot('auto');
  if(why) console.warn('autosave failed:', why);
}
function saveG(){}
let G = {g:0, runs:0};
