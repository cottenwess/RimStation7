/* ================= view inspection ================= */
function focusActor(){
  const f = S.ui.focus; if(!f || f.type !== 'person') return null;
  if(f.id === 'calderon') return S.inspector;
  return actors().find(a => (a.kind === 'lead' ? a.id : a.name) === f.id) || null;
}
function actorKey(a){ return a.kind === 'lead' ? a.id : a === S.inspector ? 'calderon' : a.name; }
function focusSpecFor(a){
  if(a.inLab){ const s = labSpec(S.labs[a.labK]); if(s) return s; }
  const job = a.job && S.items.find(x => x.id === a.job); if(job && job.sp) return specById(job.sp);
  return selSpec();
}
function studyName(sp, id){ return STUDIES[id].name(sp).toLowerCase(); }
function thoughtFor(a){
  const sp = focusSpecFor(a), t = sp ? sp.truth : null, key = actorKey(a);
  /* Two pools. C is what the work is telling them right now and carries the
     suggestions the UI acts on; P is who they are. Both get airtime, because a
     roster you paid for should have a voice and not just a stat block. */
  const C = [], P = [];
  const add = (mood, text, suggest) => C.push({mood, text, suggest:suggest || null});
  const addP = (mood, text) => P.push({mood, text, suggest:null});
  const recentSed = sp && ANIMAL(sp) && sinceSed(sp) !== null && sinceSed(sp) < 24;
  if(key === 'calderon'){
    const L = S.labs.find(L => L.built && L.integrity < 60);
    if(S.inspector && S.inspector.caught) add('angry', `${S.inspector.caught} decon skip${S.inspector.caught > 1 ? 's' : ''} so far. All of them going in the report.`);
    if(L) add('uneasy', `${L.name}'s seals are at ${Math.round(L.integrity)}%. That's not a maintenance note, that's a countdown.`);
    if(sp && claimFor(sp, 'containment') && (labOf(sp) || S.labs[0]).bsl < t.bsl) add('alarmed', `${sp.name} needs BSL-${t.bsl} and you have it in BSL-${(labOf(sp) || S.labs[0]).bsl}. Your own paper says so.`);
    add('neutral', 'Checking the log against what I see on the floor. They never match exactly.');
    return C[0];
  }
  if(sp){
    const motile = ANIMAL(sp);
    if(key === 'okafor'){
      if(sp.flags.has('vocal') && !found(sp, 'acoustic')) add('uneasy', `Those calls aren't noise. I want the acoustic work done before we do anything invasive to ${sp.name} again.`, 'acoustic');
      if(t.sapience === 3 && !sp.flags.has('vocal')) add('uneasy', `${sp.name} watched me write. Not my hand. The pen. I want a proper observation before anyone sedates it again.`, 'obs');
      if(recentSed) add('uneasy', `Another sedation. Every dose costs it something, and every dose muddies our behavior data. How long does this drug actually last in it?`, 'clearance');
      if(sp.stress > .6) add('uneasy', `${sp.name} is stressed. Stressed animals breach, and stressed data lies. Is the habitat matched?`, 'habitat');
      if(!claimFor(sp, 'containment') && sp.grantTier >= 1) add('neutral', "We're guessing at containment. I don't like guessing. A challenge test would end the argument.", 'challenge');
      if(!valid(sp, 'assay') && found(sp, 'sample')) add('neutral', "The sample's sitting in the fridge. Assay it before we handle the animal again.", 'assay');
      add('neutral', motile ? 'Replicates. Then more replicates. Then I believe it.' : `I keep coming back to how ${sp.name} grows. There's something orderly about it.`);
    } else if(key === 'vasko'){
      if(motile && t.agg > .6) add('excited', `Did you see ${sp.name} hit the glass? That's a paper. Put a prey model in there and film it.`, 'stimulus');
      if(t.yield && valid(sp, 'assay')) add('excited', `There's a compound in ${sp.name} worth more than this station. Extract it before somebody else does.`, 'extract');
      if(sp.flags.has('viable') || (!found(sp, 'genome') && found(sp, 'sample'))) add('smug', `Sequence it, clone it, and Rook never has to fly out for another one.`, 'genome');
      if(recentSed) add('smug', `Okafor wants a washout every time we touch it. The data's fine.`);
      add('smug', 'Okafor would still be calibrating the scale.');
    } else {
      if(motile && t.agg > .6 && !valid(sp, 'stimulus')) add('uneasy', `${sp.name} tracks me every time I walk past the tank. Nobody's tested what it does when it gets close.`, 'stimulus');
      if(!valid(sp, 'assay') && sp.kind !== 'fossil') add('uneasy', `We still don't know what ${sp.name} puts out. I'm double-gloving until somebody runs the assay.`, 'assay');
      if(t.vocal && !sp.flags.has('vocal')) add('neutral', `Swear I heard ${sp.name} hum when the lights went down. Probably the vents.`, 'obs');
      if(t.lethal && valid(sp, 'assay')) add('uneasy', `Knowing ${sp.name} can kill you doesn't make the transfer box any lighter.`);
      if(sp.stress > .6) add('uneasy', `${sp.name} is pacing again. That's not a happy animal.`, 'habitat');
      if(recentSed) add('neutral', `It's slow coming round from the sedative. Slower than last time.`, 'clearance');
      if(motile && t.agg < .38 && valid(sp, 'obs')) add('neutral', `${sp.name} came right up to the glass today. Kind of sweet, honestly.`);
    }
  }
  if(a.kind === 'tech'){
    if(a.injured) add('numb', 'Still hurts. Nobody filed anything about it.');
    if(a.flash > 0) add('uneasy', 'Skipped decon. Just once. It was fine.');
    if(S.deaths && !S.hazardPay) add('angry', 'Somebody died here and nobody has said the words hazard pay.');
    /* Who they are, in their own words. The traits the director paid for. */
    const T = n => traitsOf(a).some(x => x.label === n);
    if(a.morale < 25) addP('numb', pick2(a, ["I have started counting the shifts. That is never a good sign.", "I am not asking for much. I am asking for the rota to be posted before the shift it covers."]));
    if(T('Glory hound')) addP('smug', pick2(a, ["My name goes on this one. I have checked how that works.", "Nobody remembers who ran the controls. They remember who wrote it up."]));
    if(T('Squeamish')) addP('uneasy', pick2(a, ["I will do anything you like at the bench. Anything at all, at the bench.", "It looked at me. I am aware that is not a finding."]));
    if(T('By the book')) addP('neutral', pick2(a, ["Every step, every time. It is not slower. It is correct, which people confuse with slower.", "I have the procedure laminated. People find that funny until something gets out."]));
    if(T('Fast hands')) addP('excited', pick2(a, ["Done before the timer. Again.", "There is a quick way and a right way and most days they are the same way."]));
    if(T('Careless')) addP('smug', pick2(a, ["Decon is for people who touch things.", "Nothing has gone wrong yet, which I treat as evidence."]));
    if(T('Veteran')) addP('neutral', pick2(a, ["I have seen a cell go. You do not forget which way the door opens.", "The new lead has ideas. I have a list of people who had ideas."]));
    if(T('Green')) addP('uneasy', pick2(a, ["I have read the manual twice. It does not cover the smell.", "Everyone here is very calm and I do not know whether that is comforting."]));
    if(T('Quiet')) addP('neutral', pick2(a, ["I keep my head down. It is not that I do not notice things.", "I could say something. I usually do not."]));
    if(T('Insomniac')) addP('neutral', pick2(a, ["Better at 2am than I am at 9. I have stopped apologising for it.", "The station is honest at night. Nobody is performing."]));
    if(T('Steady')) addP('neutral', pick2(a, ["Panicking has never once helped and I have tested that twice.", "Somebody has to be the one who walks."]));
    if(T('Ambitious') && !a.workedRecently) addP('uneasy', pick2(a, ["I did not come to the edge of the galaxy to label tubes.", "Put me on the work that matters and watch what happens."]));
    if(a.role === 'zoologist') addP('neutral', pick2(a, [`It has a routine. Everything with a brain has a routine, and the routine is the data.`, "People keep calling it an it. I keep letting them."]));
    if(a.role === 'xenobio') addP('neutral', pick2(a, ["Four billion years of evolution over there and a fortnight of my attention over here.", "Nothing in my training applies and that is the single best thing about this job."]));
    if(a.role === 'geneticist') addP('neutral', pick2(a, ["The sequencer has opinions about this genome. None of them are printable.", "I can read it. Reading it and understanding it are different purchases."]));
    if(a.role === 'micro') addP('neutral', pick2(a, ["Everything in here doubles while I am asleep. I take it personally.", "The cultures are fine. I say that with my whole chest and one hand on the autoclave."]));
    if(a.role === 'chemist') addP('neutral', pick2(a, ["Meridian wants it cheaper. The molecule does not care what Meridian wants.", "Synthesis is just doing it again without the animal watching."]));
    if(a.role === 'physicist') addP('neutral', pick2(a, ["There is a black hole out there and a budget meeting in here. I know which one bends more.", "The instruments are fine. The thing the instruments are pointed at is the problem."]));
    if(a.role === 'engineer') addP('neutral', pick2(a, ["Seals do not fail suddenly. They fail slowly and then suddenly, and I am paid for the slow part.", "Show me a lab nobody has complained about and I will show you a lab nobody has inspected."]));
    if(a.role === 'speech') addP('neutral', pick2(a, ["It repeated a pattern back to me. I am being careful about the word repeated.", "Meridian filed my post under expendable. I have seen the org chart."]));
    if(a.role === 'anthro') addP('neutral', pick2(a, ["Somebody made that. I am not allowed to write it that plainly yet.", "Every culture that found another one has a word for the day it went wrong."]));
    addP('neutral', pick2(a, ['Twelve hours till rotation.', "The coffee in the hub's cold again.", 'I miss weather.', 'Rook says the planets smell like something. Wish I knew what.', 'There is a form for this. There is a form for everything except the thing that happened.', "Payroll call it a remote posting. Remote from what, I asked. No reply."]));
  }
  /* Alternate between the two pools every few hours, rotating inside each, so a
     person says something about the work and then something about themselves. */
  const turn = Math.floor(S.t / 4) + key.length;
  const pool = P.length && (!C.length || turn % 2) ? P : C;
  if(!pool.length) return null;
  return pool[Math.floor(S.t / 9 + key.length) % pool.length];
}
function pick2(a, arr){ return arr[(a.name.length + Math.floor(S.t / 8)) % arr.length]; }
function doingFor(a){
  if(a === S.inspector) return 'Running a safety walkthrough';
  if(a.injured) return 'Injured, off rotation';
  const job = a.job && S.items.find(x => x.id === a.job); if(job) return `${job.lane === 'bench' ? 'At the hub bench' : `In ${laneLab(job.lane) ? laneLab(job.lane).name : 'the lab'}`}: ${wName(job).toLowerCase()}`;
  if(a.inLab) return `In ${S.labs[a.labK].name}`;
  if(a.walking) return 'Walking the station';
  return a.kind === 'lead' ? 'Reviewing data in the hub' : 'On break in the hub';
}
function suggestBtn(sp, id){
  if(!sp || !id || !STUDIES[id] || !STUDIES[id].applies(sp)) return '';
  if(id === 'habitat' && valid(sp, 'habitat')) return sp.truth.sensitive && labOf(sp) && !labOf(sp).envMatched ? `<button type="button" class="btn" data-act="tab:lab">Match the habitat</button>` : '';
  if(valid(sp, id)) return '';
  if(visible(sp, id)) return `<button type="button" class="btn primary" data-act="plan:${sp.id}:${id}">Plan: ${STUDIES[id].name(sp)}</button>`;
  return STUDIES[id].tier > sp.grantTier + 1 ? `<span class="muted small">${STUDIES[id].name(sp)} opens at Tier ${STUDIES[id].tier}.</span>` : '';
}
function renderInspect(){
  const el = $('#inspect'); if(!el) return;
  const f = S.ui.focus;
  if(!f || S.over){ el.hidden = true; return; }
  let html = '';
  if(f.type === 'person'){
    const a = focusActor(); if(!a){ S.ui.focus = null; el.hidden = true; return; }
    const key = actorKey(a), P = PEOPLE[key] || null, th = thoughtFor(a), sp = focusSpecFor(a);
    const name = P ? P.name : a.name, role = P ? P.role : roleLabel(a);
    html = `<div class="ins-h"><canvas class="ins-pt" width="16" height="16" data-who="${P ? key : ''}" data-mood="${th.mood}"></canvas><div><b>${name}</b><small>${role}</small></div><button type="button" class="ins-x" data-act="unfocus" aria-label="Close">×</button></div>
      <p class="ins-doing">${doingFor(a)}</p>
      <p class="ins-thought">"${th.text}"</p>
      <div class="row">${suggestBtn(sp, th.suggest)}</div>`;
  } else {
    const sp = specById(f.id); if(!sp || !sp.alive){ S.ui.focus = null; el.hidden = true; return; }
    const L = labOf(sp), secs = sectionsFor(sp), h = sinceSed(sp);
    const mood = sp.stress > .6 ? 'Agitated' : sp.stress > .4 ? 'Restless' : 'Settled';
    html = `<div class="ins-h"><canvas class="ins-sp" data-spec="${sp.id}" width="36" height="26"></canvas><div><b>${sp.name}</b><small>${sp.code} · ${KIND_LABEL[sp.kind]} · ${L ? `${L.name}, BSL-${L.bsl}` : 'Stasis'}</small></div><button type="button" class="ins-x" data-act="unfocus" aria-label="Close">×</button></div>
      <dl class="kv">${ANIMAL(sp) ? `<dt>Right now</dt><dd>${sp.sed > .3 ? 'Sedated' : mood}</dd><dt>Last sedated</dt><dd>${h === null ? 'Never' : h + ' h ago'}</dd>` : ''}<dt>From</dt><dd>${planetOf(sp).name}</dd><dt>Paper</dt><dd>${sp.paper ? 'v' + sp.paper.v : 'None yet'}</dd></dl>
      ${(k => k.length ? `<ul class="ins-find">${k.map(sec => `<li class="on"><b>${secLabel(sp, sec)}</b><span>${claimFor(sp, sec).text}</span></li>`).join('')}</ul>` : '<p class="muted small">No findings yet.</p>')(secs.filter(sec => claimFor(sp, sec)))}
      ${(u => u.length ? `<p class="small muted"><b>Still unknown:</b> ${u.map(sec => secLabel(sp, sec)).join(', ')}</p>` : '')(secs.filter(sec => !claimFor(sp, sec)))}
      <div class="row"><button type="button" class="btn" data-act="dossier:${sp.id}">Open dossier</button></div>`;
  }
  if(el.dataset.html !== html){
    el.innerHTML = html; el.dataset.html = html;
    el.querySelectorAll('canvas[data-who]').forEach(c => { if(c.dataset.who) drawPortrait(c.getContext('2d'), c.dataset.who, c.dataset.mood); else drawTechPortrait(c, focusActor()); });
    el.querySelectorAll('canvas[data-spec]').forEach(c => { const s = specById(c.dataset.spec); if(s) drawSpecIcon(c, s); });
  }
  el.hidden = false;
}
function drawTechPortrait(c, a){
  if(!a) return;
  const g = c.getContext('2d'), L = a.look; g.clearRect(0, 0, 16, 16);
  g.fillStyle = '#2b3446'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = L.coat; g.fillRect(3, 11, 10, 5);
  g.fillStyle = L.skin; g.fillRect(5, 4, 6, 7);
  g.fillStyle = L.hair; g.fillRect(5, 3, 6, 2); g.fillRect(4, 4, 1, 3);
  g.fillStyle = '#1b1020'; g.fillRect(6, 7, 1, 1); g.fillRect(9, 7, 1, 1);
  g.fillStyle = '#7a4a3a'; g.fillRect(7, 9, 2, 1);
}

