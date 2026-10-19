/* ================= lead suggestions ================= */
function suggestFor(sp){
  if(!sp || !sp.alive) return null;
  const V = S.lead === 'vasko', who = S.lead || 'okafor';
  const st = id => ({kind:'study', type:id, sp:sp.id});
  const can = id => STUDIES[id].applies(sp) && visible(sp, id) && !itemFor(sp, id) && !valid(sp, id);
  const nm = id => STUDIES[id].name(sp).toLowerCase();
  const recentSed = ANIMAL(sp) && sinceSed(sp) !== null && sp.sed > .2;
  for(const id of STUDY_ORDER) if(sp.find[id] && sp.find[id].flagged && !itemFor(sp, id) && STUDIES[id].avail(sp)) return {who, work:st(id), text:`Rerun the ${nm(id)}. The last result is unreliable${recentSed && STUDIES[id].mode(sp) === 'observe' ? ', and it is still sedated. Give it a longer washout first' : ''}.`};
  if(sp.grantTier < 1){
    const order = sp.kind === 'fossil' ? ['obs', 'sample', 'age', 'assay'] : ['obs', 'habitat', 'sample', 'assay'];
    for(const id of order) if(can(id)){
      if(id === 'obs' && recentSed) return {who, work:st(id), text:V ? `Watch ${sp.name}. The sedative is nearly gone, it'll be fine.` : `Observe ${sp.name}, but schedule it after the sedative clears. Tomorrow morning is safer than today.`};
      if(id === 'habitat' && recentSed) return {who, work:st(id), text:`Habitat sweep next, once it is awake enough to move around. A sedated animal tells you nothing about what it prefers.`};
      if(id === 'sample') return {who, work:st(id), text:`Take a sample. Do the sealed work first, because the biopsy sedates it.${ANIMAL(sp) ? '' : ''}`};
      return {who, work:st(id), text:`Next: ${nm(id)}.`};
    }
    if(tierDone(sp, 1)) return {who, act:'tab:papers', label:'Go to Papers', text:`Tier 1 is complete. Publish before we do anything else. The partner labs need it and so does our grant.`};
    return null;
  }
  if(topTier(sp) > sp.grantTier) return {who, act:'tab:papers', label:'Go to Papers', text:`Tier ${topTier(sp)} is complete. Publish it.`};
  const held = S.compounds.find(c => c.sp === sp.id && c.state === 'held' && (!c.screened || !c.synth));
  if(held){
    if(labOfType('chem') && !held.synth) return {who, cmp:held.id, dest:'chem', text:`Send the ${held.short.toLowerCase()} to the Chem Lab. Synthesized, it licenses for half again as much.`};
    if(labOfType('micro') && !held.screened) return {who, cmp:held.id, dest:'micro', text:`Send the ${held.short.toLowerCase()} to the Micro Lab for screening before we sell it short.`};
  }
  const t2 = V ? ['stimulus', 'extract', 'genome', 'clearance', 'acoustic', 'biochem', 'spread'] : ['clearance', 'acoustic', 'biochem', 'genome', 'spread', 'extract', 'stimulus'];
  if(sp.flags.has('vocal') && can('acoustic') && !V) return {who, work:st('acoustic'), text:`Acoustic analysis on ${sp.name} before anything invasive. If those calls are language, everything changes.`};
  for(const id of t2) if(can(id) && tierOpen(sp, id)) return {who, work:st(id), text:({clearance:`Measure how long the sedative lasts in ${sp.name}. Every behavior result depends on it.`, stimulus:`Run the provocation test. I want to see what it does when it means it.`, extract:`Extract the next compound from ${sp.name}. Each one is worth money, and some are worth more after Micro or Chem.`, genome:`Sequence ${sp.name}. A genome opens Genetics: cloning${sp.kind === 'flora' ? ', crop strains' : ''}${ANIMAL(sp) ? ', hybrids' : ''}.`, acoustic:`Record and analyze the calls.`, biochem:`Characterize the chemistry, or the sequencer will keep failing.`, spread:`Run the spread test so partner labs know if their seals hold.`})[id]};
  if(sp.flags.has('viable')){
    if(!labOfType('genetics')) return {who, act:'tab:lab', label:'Station tab', text:`${sp.name}'s genome is viable. Build the Genetics Lab and we can clone it${sp.kind === 'flora' ? ' or breed a crop strain' : ''}.`};
    if(sp.kind === 'flora' && !sp.crop) return {who, work:{kind:'job', type:'crop', tgt:sp.id}, text:`Send the genome to Genetics for a crop strain. Agriculture pays steady money and nobody gets hurt.`};
  }
  if(sp.kind === 'microbe' && sp.truth.hazard === 'pathogen' && valid(sp, 'genome') && !sp.vaccine && JOBS.vaccine.list().includes(sp)) return {who, work:{kind:'job', type:'vaccine', tgt:sp.id}, text:`We have the genome of a pathogen. Start vaccine work. It saves people at the partner labs.`};
  for(const id of ['challenge', 'language', 'clone']) if(can(id) && tierOpen(sp, id)) return {who, work:st(id), text:({challenge:`Run the containment challenge so the paper's BSL recommendation is real, not a guess.`, language:`Try to decode the calls. If they're talking, we need to know before anyone else touches them.`, clone:`Start a cloning line in Genetics.`})[id]};
  if(sp.paper) return {who, act:`ship:${sp.id}`, label:'Ship to Meridian', text:`We've learned what we can from ${sp.name} for now. Ship it to Meridian and free the lab for the next recovery.`};
  return null;
}
function suggestCard(sp){
  const g = suggestFor(sp); if(!g) return '';
  const P = PEOPLE[g.who];
  let btn = '';
  if(g.work && g.work.kind === 'study') btn = `<button type="button" class="btn primary" data-act="plan:${sp.id}:${g.work.type}">Plan it</button>`;
  else if(g.work) btn = `<button type="button" class="btn primary" data-act="qjob:${g.work.type}:${g.work.tgt}">Schedule it</button>`;
  else if(g.cmp) btn = `<button type="button" class="btn primary" data-act="cmp:${g.dest}:${g.cmp}">Send it</button>`;
  else if(g.act) btn = `<button type="button" class="btn primary" data-act="${g.act}">${g.label}</button>`;
  return `<section class="card suggest"><div class="sg"><canvas data-portrait="${g.who}" data-mood="neutral" width="16" height="16"></canvas><div><div class="eyebrow">${P.name} suggests</div><p class="small">${g.text}</p></div></div><div class="row">${btn}</div></section>`;
}
function suggestedKey(sp){ const g = suggestFor(sp); return g && g.work ? `${g.work.kind}:${g.work.type}:${g.work.sp || g.work.tgt}` : ''; }

