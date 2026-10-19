/* ================= specimens ================= */
const FORMS = {
  fauna:{garden:['dome', 'strider', 'serpent'], hostile:['crab', 'dome'], botanical:['strider'], ice:['blind'], cryo:['lithovore'], cloud:['strider'], barren:['lithovore']},
  floater:{any:['gasbag']}, flora:{garden:['frond'], botanical:['frond', 'trap', 'fungus'], hostile:['ironplant'], cryo:['crystal'], ice:['frond'], cloud:['frond'], barren:['fungus']},
  microbe:{any:['culture']}, fossil:{any:['fossil']}
};
const NAMES = {
  dome:[['Hush', 'Quill', 'Bristle', 'Thorn'], ['back', 'crown', 'hide', 'shell']], strider:[['Stilt', 'Reed', 'Long', 'Wade'], ['walker', 'stride', 'shank', 'leg']],
  serpent:[['Ribbon', 'Coil', 'Lash', 'Silk'], ['eel', 'tail', 'wyrm', 'worm']], crab:[['Iron', 'Slag', 'Rust', 'Kiln'], ['shell', 'claw', 'plate', 'crab']],
  blind:[['Pale', 'Lantern', 'Glim', 'Ghost'], ['drifter', 'fin', 'eye', 'tongue']], lithovore:[['Grind', 'Pebble', 'Chalk', 'Flint'], ['mouth', 'grazer', 'tooth', 'mole']],
  gasbag:[['Sky', 'Bloat', 'Drift', 'Cloud'], ['bladder', 'whale', 'kite', 'bell']], frond:[['Glass', 'Veil', 'Sun', 'Fan'], ['frond', 'leaf', 'fern', 'reed']],
  trap:[['Snap', 'Maw', 'Clasp', 'Sundew'], ['trap', 'jaw', 'cup', 'lily']], fungus:[['Soot', 'Ember', 'Ink', 'Cinder'], ['cap', 'bloom', 'shelf', 'mold']],
  ironplant:[['Rust', 'Iron', 'Scale', 'Kettle'], ['vine', 'stalk', 'thorn', 'reed']], crystal:[['Frost', 'Prism', 'Rime', 'Lattice'], ['bloom', 'spire', 'growth', 'crown']],
  culture:[['Murk', 'Glow', 'Silt', 'Bloom'], ['strain', 'mat', 'colony', 'film']], fossil:[['Old', 'Stone', 'Deep', 'Ash'], ['bones', 'spine', 'skull', 'shell']]
};
const FAUNA_COLORS = [['#4b3a6b', '#6f5a9a', '#2b2140'], ['#3b5a4a', '#5e8a6e', '#22382c'], ['#6a3a3a', '#9a5a50', '#3e2020'], ['#3a4a6a', '#5a72a0', '#202b40'], ['#5a4a2a', '#8a744a', '#3a2e18'], ['#2f3a3f', '#55666e', '#1a2226']];
const EYES = ['#ffb13b', '#62d6e3', '#ff5d63', '#b6ff6a', '#f5e6ff'];
const TEMPERS = {ambush:{agg:.86}, swarm:{agg:.72}, wary:{agg:.5}, grazer:{agg:.22}, drifter:{agg:.18}, sessile:{agg:0}};
let specSeq = 0;
function codeFor(p){ return p.sys.slice(0, 2).toUpperCase(); }
function genSpecimen(p, kindOverride, opts = {}){
  const A = ARCH[p.arch];
  let kind = kindOverride || pick(A.pool);
  let sapience = 0;
  if(p.sapient && !S.specs.some(s => s.planet === p.i && s.truth.sapience === 3) && (kind === 'fauna' || kind === 'floater') && rnd() < .5) sapience = 3;
  const fl = FORMS[kind]; const form = opts.form || pick(fl[p.arch] || fl.any || fl.garden);
  let temperament = 'sessile';
  if(kind === 'fauna') temperament = sapience === 3 ? 'wary' : form === 'crab' || p.arch === 'hostile' ? pick(['ambush', 'swarm', 'ambush']) : form === 'lithovore' ? 'grazer' : pick(['ambush', 'grazer', 'swarm', 'wary', 'grazer']);
  if(kind === 'floater') temperament = 'drifter';
  if(opts.tutorial && kind === 'fauna') temperament = pick(['wary', 'grazer']);
  const agg = temperament === 'sessile' ? 0 : clamp(TEMPERS[temperament].agg + gauss() * .04, .05, .97);
  let hazard = 'none';
  if(kind === 'fauna') hazard = temperament === 'ambush' || temperament === 'swarm' ? pick(['venom', 'electric', 'venom']) : form === 'crab' ? 'acid' : form === 'blind' ? 'electric' : rnd() < .3 ? 'venom' : 'none';
  if(kind === 'floater') hazard = rnd() < .5 ? 'spores' : 'none';
  if(kind === 'flora') hazard = form === 'trap' ? 'acid' : form === 'fungus' ? (p.magnet ? 'spores' : 'radiation') : form === 'ironplant' ? 'acid' : rnd() < .5 ? 'spores' : 'none';
  if(kind === 'microbe') hazard = rnd() < (p.arch === 'hostile' || p.arch === 'ice' ? .55 : .4) ? 'pathogen' : 'none';
  if(kind === 'fossil') hazard = rnd() < .4 ? 'pathogen' : 'none';
  if(opts.tutorial && ['venom', 'electric', 'pathogen'].includes(hazard)) hazard = pick(['none', 'acid']);
  const lethal = ['venom', 'electric', 'pathogen'].includes(hazard);
  let bsl = 1;
  if(lethal && (agg > .6 || hazard === 'pathogen')) bsl = 3;
  else if(lethal || hazard !== 'none' || agg > .45) bsl = 2;
  if(hazard === 'pathogen' && (p.arch === 'hostile' || kind === 'fossil') && rnd() < .5) bsl = 4;
  if(sapience === 3) bsl = Math.max(bsl, 2);
  const light = (form === 'blind' || p.arch === 'ice' || p.arch === 'cryo') ? 'darkness' : p.star === 'M' ? 'dim red light' : p.star === 'F' ? 'bright blue-white light' : 'standard light';
  const pressure = p.pres > 5 ? 'high' : p.pres < 0.3 && kind !== 'fossil' ? 'low' : 'standard';
  const tempNeed = p.arch === 'cryo' ? 'cryogenic' : p.arch === 'ice' ? 'near-freezing' : p.arch === 'hostile' ? 'scalding' : 'temperate';
  const sensitive = light !== 'standard light' || pressure !== 'standard' || tempNeed !== 'temperate';
  const vocal = (kind === 'fauna' || kind === 'floater') && (sapience === 3 || rnd() < (p.arch === 'garden' || p.arch === 'cloud' ? .5 : .25));
  if(vocal && !sapience) sapience = rnd() < .35 ? 2 : rnd() < .5 ? 1 : 0;
  const exotic = ['methane', 'silicon', 'ammonia', 'sulfur'].includes(p.biochem) && kind !== 'fossil';
  const genome = kind === 'fossil' ? (rnd() < .45 ? 'viable' : 'degraded') : 'viable';
  let yieldT = null;
  if(hazard === 'venom') yieldT = {type:'a nerve-blocking anesthetic', dual:true};
  else if(hazard === 'electric') yieldT = {type:'a bioelectric power cell', dual:true};
  else if(hazard === 'pathogen') yieldT = {type:'a vaccine platform', dual:true};
  else if(form === 'fungus') yieldT = {type:'a melanin radiation shield', dual:false};
  else if(form === 'crab' || form === 'ironplant') yieldT = {type:'a self-repairing armor composite', dual:true};
  else if(kind === 'flora' || kind === 'microbe') yieldT = {type:'an antibiotic compound', dual:false};
  const [n1, n2] = NAMES[form];
  const pal = kind === 'flora' ? {body:pick(STARS[p.star].flora), light:'#c9d2de', dark:'#1a1420', eye:pick(EYES)} :
    kind === 'microbe' ? {body:pick(['#62d6e3', '#b98cf0', '#8bd472', '#f3c14a']), light:'#e8fbff', dark:'#1d2a33', eye:'#fff'} :
    kind === 'fossil' ? {body:'#d8c9a8', light:'#f2e8d0', dark:'#7a6a50', eye:'#3a3020'} :
    (() => { const c = pick(FAUNA_COLORS); return {body:c[0], light:c[1], dark:c[2], eye:pick(EYES)}; })();
  const n = ++specSeq;
  const sp = {
    id:'s' + n, code:`${codeFor(p)}-${String(n).padStart(2, '0')}`, name:opts.name || pick(n1) + pick(n2), planet:p.i, kind, form, pal,
    truth:{temperament, agg, hazard, lethal, bsl, sedHalf:Math.round(clamp(8 + rnd() * 22, 8, 30) * (p.arch === 'cryo' ? 1.3 : 1)),
      needs:{light, pressure, temp:tempNeed}, sensitive, vocal, sapience, genome, exotic, biochem:p.biochem, yield:yieldT,
      age:Math.round(5 + rnd() * 400), ruins:kind === 'fossil' && p.ruins && rnd() < .7, doubling:Math.round(3 + rnd() * 20)},
    sed:0, stress:.3, loc:'none', lab:null, find:{}, flags:new Set(), paper:null, paperV:0, grantTier:0, person:null, alive:true, origin:opts.origin || 'recovered', arrived:S ? S.t : 0, licensed:false
  };
  sp.truth.compounds = genCompounds(sp);
  const c0 = COMPOUND_TYPES[sp.truth.compounds[0]];
  sp.truth.yield = c0 ? {type:'a ' + c0.label, dual:c0.dual} : null;
  sp.extracted = 0;
  return sp;
}
const ANIMAL = sp => sp.kind === 'fauna' || sp.kind === 'floater';
const planetOf = sp => S.planets[sp.planet];
const KIND_LABEL = {fauna:'Fauna', floater:'Aerial fauna', flora:'Flora', microbe:'Microbe', fossil:'Fossil'};
function truthClass(sp){ const a = sp.truth.agg; return a < .38 ? 'docile' : a < .62 ? 'wary' : 'aggressive'; }

