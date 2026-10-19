/* ================= leads, staff & techs ================= */
const LEADS = {
  vasko:  {id:'vasko', speed:1.5, risk:1.8, skip:0.45, pace:'Fast', protocol:'Loose', temper:'Maverick',
           blurb:'Brilliant, famous, and in a hurry. Spots patterns nobody else sees. Two of his landmark papers have never been replicated.'},
  okafor: {id:'okafor', speed:0.75, risk:0.7, skip:0, pace:'Slow', protocol:'Strict', temper:'Meticulous',
           blurb:'Careful to the point of exasperating. Catches confounds before they spread. Keeps her own copy of the notebook.'}
};

/* Four disciplines, scored 0 to 4. Work modes map onto the first three
   (handle, bench, observe); nerve is what holds when the work goes wrong. */
const STATS = {
  handling:{label:'Handling', blurb:'Hands-on work with live specimens. Steadier hands mean fewer incidents and fewer breaches.'},
  bench:{label:'Bench', blurb:'Precision work at the bench. Quicker, and less likely to hand you data you cannot trust.'},
  observe:{label:'Observation', blurb:'Patience at the glass. Quicker observation work, and catches confounds the lead would miss.'},
  nerve:{label:'Nerve', blurb:'Composure when containment fails. Nerve is what decides who walks out of the cell.'}
};
const STAT_KEYS = ['handling', 'bench', 'observe', 'nerve'];
const STAT_MAX = 4;
const MODE_STAT = {handle:'handling', bench:'bench', observe:'observe'};
/* Hours of relevant work behind each pip. Potential (cap) decides where a
   person stops improving, so a bad hire stays a bad hire and hiring matters. */
const XP_STEPS = [0, 8, 24, 52, 96];

/* Every trait gives something and costs something. Several also decide who a
   person can stand working under, which is what makes the lead choice bite. */
const TRAITS = {
  fasthands:{label:'Fast hands', good:'Works 15% faster', bad:'Causes incidents more often', work:0.85, risk:1.22, likes:'vasko'},
  bythebook:{label:'By the book', good:'Never skips decontamination', bad:'Works 12% slower', work:1.12, noskip:true, likes:'okafor', clashes:'vasko'},
  squeamish:{label:'Squeamish', good:'Unshakeable at the bench', bad:'Will not take hands-on work with live specimens', bench:1, refuse:'handle'},
  thorough:{label:'Thorough', good:'Rarely produces unreliable data', bad:'Works 10% slower', work:1.1, quality:0.4, likes:'okafor'},
  gloryhound:{label:'Glory hound', good:'Pushes work through fast under a lead who lets them', bad:'Cuts corners and clashes with careful supervision', work:0.9, risk:1.3, skip:1.6, likes:'vasko', clashes:'okafor'},
  steady:{label:'Steady', good:'Keeps their head when containment fails', bad:'Slow to pick up new disciplines', nerve:1, xp:0.6},
  green:{label:'Green', good:'Learns fast', bad:'Unreliable until they have the hours in', xp:1.8, quality:1.6, risk:1.15},
  veteran:{label:'Veteran', good:'Seen it before, and it shows under pressure', bad:'Will not be told how to do the job by a new lead', nerve:1, quality:0.7, clashes:'vasko'},
  careless:{label:'Careless', good:'Never slowed down by procedure', bad:'Skips decontamination and gets people hurt', work:0.92, skip:2.2, risk:1.25},
  insomniac:{label:'Insomniac', good:'No drop-off on overtime hours', bad:'Sluggish on the first hours of a shift', ot:true},
  quiet:{label:'Quiet', good:'Gets on with anyone', bad:'Never reports a near miss', mute:true},
  ambitious:{label:'Ambitious', good:'Improves quickly in every discipline', bad:'Morale falls fast when passed over for the risky work', xp:1.5, proud:true, likes:'vasko'}
};
const TRAIT_KEYS = Object.keys(TRAITS);

const TECH_NAMES = ['J. Alvarez', 'P. Nakamura', 'D. Osei', 'R. Kowalczyk', 'M. Haddad', 'L. Brennan', 'T. Iwu', 'S. Varga', 'K. Lindgren', 'A. Reyes', 'N. Petrov', 'F. Achebe', 'E. Moreau', 'H. Sato', 'O. Quist', 'B. Mensah', 'C. Oyelaran', 'V. Dubois', 'W. Ferreira', 'Y. Tanaka', 'Z. Abadi', 'G. Lindqvist', 'I. Duarte', 'Q. Mbeki'];
const TECH_LOOKS = [
  {skin:'#e8b896', hair:'#3a2a20'}, {skin:'#8a5a3a', hair:'#151012'}, {skin:'#c8956c', hair:'#2a2228'},
  {skin:'#f0caa8', hair:'#d8b25a'}, {skin:'#6e4430', hair:'#1a1416'}, {skin:'#d9a882', hair:'#7a3a22'}
];
const HUB_SPOTS = [[1.7, 3.2], [2.9, 1.3], [0.9, 1.3], [2.3, 3.5], [1.6, 1.2], [0.75, 2.75]];
const STRIDE = 8, LAB_CU = 9;
const LAB_SPOTS = [[7.15, 0.2], [10.85, 2.2], [7.6, 3.9], [10.85, 0.25]];
const BENCH_SPOTS = [[2.65, 3.05], [3.35, 2.5], [2.6, 3.6]];
const LANDING = [0.8, 2.0];
const BREACH_POS = [null, [7.6, 3.8], [5.0, 2.0], [2.5, 2.6], [0.8, 2.0]];
const BREACH_WHERE = ['', 'loose in the lab', 'in the spoke corridor', 'in the hub', 'at the shuttle bay, one transfer from the vessel'];

/* ---- roster helpers: pure reads over a staff record ---- */
const traitsOf = a => (a.traits || []).map(k => TRAITS[k]).filter(Boolean);
const traitMult = (a, key, dflt) => traitsOf(a).reduce((m, t) => m * (t[key] === undefined ? 1 : t[key]), dflt === undefined ? 1 : dflt);
const traitFlag = (a, key) => traitsOf(a).some(t => t[key]);
const refuses = (a, mode) => traitsOf(a).some(t => t.refuse === mode);
/* -1 under a lead they clash with, +1 under one they respect. */
function affinity(a, lead){
  const id = lead === undefined ? S.lead : lead;
  if(!id) return 0;
  let n = 0;
  for(const t of traitsOf(a)){ if(t.clashes === id) n--; if(t.likes === id) n++; }
  return clamp(n, -1, 1);
}
const moraleStep = a => a.morale >= 75 ? 1 : a.morale < 30 ? -1 : 0;
/* What a person is actually worth on today's shift, not on paper. */
function statOf(a, key){
  let v = (a.stats && a.stats[key]) || 0;
  v += traitsOf(a).reduce((n, t) => n + (t[key] || 0), 0);
  if(key !== 'nerve') v += affinity(a) + moraleStep(a);
  return clamp(v, 0, STAT_MAX);
}
const pips = n => '★'.repeat(n) + '☆'.repeat(STAT_MAX - n);
const staffName = a => a.name;
const roleLabel = a => a.role === 'tech' ? 'Lab tech' : (ROLES[a.role] ? ROLES[a.role].label : 'Staff');
const byId = id => S.techs.find(a => a.id === id) || null;

/* One discipline they are already good at, one they will never be. A specialist's
   strong discipline is the one their post is for, with a floor under it: nobody
   gets hired as a zoologist who cannot read an animal through the glass. */
function rollStats(role){
  const strong = ROLES[role] && ROLES[role].strong;
  const stats = {}, cap = {};
  const keys = STAT_KEYS.slice().sort(() => rnd() - .5);
  if(strong){ keys.splice(keys.indexOf(strong), 1); keys.unshift(strong); }
  keys.forEach((k, i) => {
    const ceiling = i === 0 ? 3 + Math.floor(rnd() * 2) : i === keys.length - 1 ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 2);
    cap[k] = clamp(ceiling, 1, STAT_MAX);
    const floor = k === strong ? 2 : 0;
    stats[k] = clamp(floor + Math.floor(rnd() * (cap[k] + 1 - floor)), 0, cap[k]);
  });
  return {stats, cap};
}
/* Studies run with hands on a live specimen. A role whose whole point is this
   work must never roll a trait that refuses it: a zoologist who will not handle
   animals is not a character quirk, it is a broken hire. */
const HANDS_ON_WORK = ['sample', 'clearance', 'stimulus', 'challenge'];
function traitAllowed(k, role){
  const t = TRAITS[k];
  if(!t.refuse) return true;
  const covers = (ROLES[role] && ROLES[role].covers) || [];
  if(t.refuse === 'handle' && covers.some(id => HANDS_ON_WORK.includes(id))) return false;
  return true;
}
function rollTraits(role){
  const pool = TRAIT_KEYS.filter(k => traitAllowed(k, role)).sort(() => rnd() - .5);
  const out = [pool[0]];
  if(rnd() < .55) for(const k of pool.slice(1)){
    /* Never pair two traits that pull the same lever in opposite directions. */
    const t = TRAITS[k], first = TRAITS[out[0]];
    if(t.refuse && first.refuse) continue;
    if(t.likes && first.clashes === t.likes) continue;
    if(t.clashes && first.likes === t.clashes) continue;
    out.push(k); break;
  }
  return out;
}
