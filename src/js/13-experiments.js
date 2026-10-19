/* ================= experiments ================= */
function measureAgg(sp){ return clamp(sp.truth.agg * (1 - 0.95 * sp.sed) + (sp.stress - 0.3) * 0.22 + gauss() * 0.05, 0, 1); }
function classify(v){ return v < 0.38 ? 'docile' : v < 0.62 ? 'wary' : 'aggressive'; }
function sedateSpec(sp){ if(!ANIMAL(sp)) return; sp.sed = 1; sp.lastSedT = S.t; }
function sinceSed(sp){ return sp.lastSedT === undefined || sp.lastSedT === null ? null : S.t - sp.lastSedT; }
const invasive = (sp, id) => sp.person === 'recognized' && (studyMode(sp, id) === 'handle' || ['sample', 'clearance', 'stimulus', 'challenge', 'clone'].includes(id));
