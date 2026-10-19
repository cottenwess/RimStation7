/* ================= papers ================= */
function checkContradictions(sp){
  if(!sp.paper) return;
  const bad = sectionsFor(sp).filter(s => claimStatus(sp, s)[1] === 'bad');
  if(bad.length && !sp.papersAlert){ sp.papersAlert = true; notify('pruitt', `The published paper on ${sp.name} no longer matches your data (${bad.map(s => secLabel(sp, s)).join(', ')}). Partner labs are still following it.`, 'warning'); }
  if(!bad.length) sp.papersAlert = false;
}
function claimStatus(sp, sec){
  const p = sp.paper && sp.paper.claims[sec], c = claimFor(sp, sec);
  if(!p && !c) return ['Not studied', ''];
  if(!p && c) return ['New data, not in the paper yet', 'new'];
  if(p && !c) return ['Since flagged as unreliable', 'bad'];
  if((p.stance || p.text) !== (c.stance || c.text)) return ['Contradicted by newer data', 'bad'];
  if(p.text !== c.text) return ['Newer data adds detail', 'new'];
  return ['Matches your data', 'ok'];
}
function snapshotClaims(sp){ const o = {}; sectionsFor(sp).forEach(s => { const c = claimFor(sp, s); o[s] = c ? {text:c.text, ok:c.ok, stance:c.stance} : null; }); return o; }
function publishPay(sp){ const t = topTier(sp); return t > sp.grantTier ? {tier:t, amt:renewalFor(t)} : {tier:sp.grantTier, amt:0}; }
const PARTNERS = ['Kepler Deep Lab', 'Halden Station', 'Vireo Biolabs'];
function hazards(sp, c, rec){
  const H = [], t = sp.truth;
  if(ANIMAL(sp)){
    if(!c.behavior) H.push({sec:'behavior', p:.3, kind:'beh-missing'});
    else if(!c.behavior.ok) H.push({sec:'behavior', p:t.agg > .6 ? .75 : .3, kind:'beh-wrong', claim:c.behavior.text});
    if(!c.handling) H.push({sec:'handling', p:.3, kind:'hand-missing'});
    else if(!c.handling.ok) H.push({sec:'handling', p:.65, kind:'hand-wrong'});
  }
  if(t.hazard !== 'none' && !c.hazard) H.push({sec:'hazard', p:t.lethal ? .6 : .4, kind:'haz-missing'});
  if(sp.kind !== 'fossil' && t.sensitive && (!c.habitat || !c.habitat.ok)) H.push({sec:'habitat', p:.5, kind:'hab'});
  if(sp.kind !== 'fossil' && rec < t.bsl) H.push({sec:'containment', p:clamp(.3 + .25 * (t.bsl - rec), 0, .9), kind:'bsl'});
  return H;
}
function buildIncident(sp, h, rec){
  const lab = PARTNERS[S.labIdx++ % PARTNERS.length], t = sp.truth, n = sp.name;
  let deaths = 0, cost = 0, text = '';
  const dead = k => k === 1 ? '1 dead.' : `${k} dead.`;
  switch(h.kind){
    case 'beh-wrong': deaths = rnd() < .4 ? 2 : 1; text = `${lab} took your paper at its word that ${n} is "${h.claim.split(' (')[0].toLowerCase()}". A handler reached into the enclosure. ${dead(deaths)}`; break;
    case 'beh-missing': deaths = t.agg > .5 ? 1 : 0; cost = deaths ? 0 : 10; text = `Your paper said nothing about how ${n} behaves. ${lab} treated it like any new arrival. ${deaths ? 'It struck a handler during intake. 1 dead.' : 'A handler was hurt during intake.'}`; break;
    case 'haz-missing':
      if(t.hazard === 'pathogen'){ deaths = 2; text = `Three techs at ${lab} fell ill after working with ${n} on an open bench. Your paper listed no pathogen. 2 dead.`; }
      else if(t.hazard === 'venom' || t.hazard === 'electric'){ deaths = 1; text = `A tech at ${lab} was ${t.hazard === 'venom' ? 'grazed through a standard glove' : 'hit by a discharge through a wet glove'}. Your paper said nothing about it. 1 dead.`; }
      else { cost = 20; text = ({acid:`${n}'s acid burned through a glove at ${lab}. A tech lost two fingers.`, spores:`${lab} opened the ${n} enclosure without respirators. Six techs hospitalized.`, radiation:`${lab} stored ${n} next to a break room. Dosimeters went off a week later.`})[t.hazard]; }
      break;
    case 'hand-wrong': deaths = 1; text = `${lab} followed your sedation timing and went in early. ${n} was awake. 1 dead.`; break;
    case 'hand-missing': cost = 15; text = `${lab} guessed at sedation timing for ${n} and guessed short. A handler was injured. They are suing.`; break;
    case 'hab': cost = 15; text = `${lab} kept ${n} in standard conditions. Every specimen died within a week. Meridian is billing you.`; break;
    case 'bsl': deaths = t.lethal ? 2 : 0; cost = deaths ? 0 : 25; text = `${lab} built to your BSL-${rec} recommendation. ${n} got out on day two. ${deaths ? dead(deaths) : 'Nobody died. The facility is contaminated.'}`; break;
  }
  return {sp:sp.id, sec:h.sec, lab, deaths, cost:cost + deaths * 15, text, at:S.t + 30 + Math.floor(rnd() * 60)};
}
function publish(sp, rec){
  const claims = snapshotClaims(sp), grant = publishPay(sp), pay = grant.amt, first = !sp.paperV;
  const fixed = [];
  S.pending = S.pending.filter(inc => {
    if(inc.sp !== sp.id) return true;
    const ok = inc.sec === 'containment' ? rec >= sp.truth.bsl : !!(claims[inc.sec] && claims[inc.sec].ok);
    if(ok) fixed.push(inc.lab);
    return !ok;
  });
  for(const h of hazards(sp, claims, rec)){
    if(S.pending.some(p => p.sp === sp.id && p.sec === h.sec)) continue;
    if(rnd() < h.p) S.pending.push(buildIncident(sp, h, rec));
  }
  sp.paperV++;
  sp.paper = {v:sp.paperV, t:S.t, rec, claims, label:sp.person === 'recognized' ? 'people' : 'specimen'};
  sp.papersAlert = false;
  if(pay){
    const cut = Math.min(pay, S.bridgeDebt || 0);
    S.bridgeDebt = (S.bridgeDebt || 0) - cut;
    S.funds += pay - cut; S.granted += pay; sp.grantTier = grant.tier;
    S.deadline = null;
    if(cut) log('pruitt', 'admin', `${cut} cr of the renewal went back to Meridian to repay the bridge advance.`);
    if(grant.tier >= 1 && sp.grantTier === grant.tier) notify('pruitt', `Paper accepted. Tier ${grant.tier + 1} studies on ${sp.name} are open now.`);
  }
  standing(pay > 0 ? 4 : 1);
  const n = Object.values(claims).filter(Boolean).length, tot = sectionsFor(sp).length;
  log('pruitt', 'admin', `Paper v${sp.paperV} on ${sp.name} published (BSL-${rec} recommended, ${n} of ${tot} sections).${pay ? ` Grant renewed: +${pay} cr.` : ''}`);
  say('pruitt', 'smug', first ? `The ${sp.name} paper is out${pay ? `, and Meridian renewed the grant: ${pay} credits` : ''}. The partner labs are receiving their own specimens under your protocol.` :
    `Version ${sp.paperV} on ${sp.name} is out.${pay ? ` It completes Tier ${grant.tier}. Grant renewed: ${pay} credits.` : ''}${fixed.length ? ` ${[...new Set(fixed)].join(' and ')} got the correction in time.` : ''}`, {log:false});
  if(sp.person === 'ignored' && !sp.leaked){ sp.leaked = true; S.pending.push({sp:sp.id, sec:'ethics', lab:'The press', deaths:0, cost:30, text:`Dr. Okafor's report reached the press. The headline calls ${sp.name} "the people Meridian files as specimens."`, at:S.t + 24}); }
  S.dirty = true;
}
function retract(sp){
  if(!sp.paper) return;
  S.pending = S.pending.filter(p => p.sp !== sp.id || p.sec === 'ethics'); sp.paper = null; sp.papersAlert = false;
  S.funds -= 20; standing(-15);
  log('pruitt', 'warning', `Paper on ${sp.name} retracted. Partner labs halted that work. Retraction cost 20 cr.`);
  say('pruitt', 'uneasy', `Retraction filed. The partner labs have stopped all work on ${sp.name} until we publish again.`, {log:false});
  S.dirty = true;
}
function fireIncident(inc){
  S.downstream += inc.deaths; S.funds -= inc.cost; standing(inc.deaths ? -10 * inc.deaths : -6);
  S.reports.push({t:S.t, lab:inc.lab, text:inc.text, deaths:inc.deaths});
  say('pruitt', inc.deaths ? 'alarmed' : 'uneasy', `Report from ${inc.lab}. ${inc.text}`, {kind:'warning'});
  if(inc.cost) log('ops', 'admin', `Meridian legal: damages, ${inc.cost} cr.`);
  if(inc.deaths){
    if(S.lead === 'okafor') say('okafor', 'numb', 'They trusted our paper. That was our data.', {kind:'note'});
    else if(S.lead === 'vasko') say('vasko', 'uneasy', "Their handling must have been sloppy. That's not on us. ...Is it?", {kind:'note'});
  }
}

