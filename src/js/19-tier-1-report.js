/* ================= tier 1 report ================= */
const BIOCHEM_NAME = {methane:'liquid methane chemistry', silicon:'silicon-oxygen chemistry', ammonia:'ammonia-solvent chemistry', sulfur:'sulfur-based chemistry'};
function t2Program(sp){
  const ids = STUDY_ORDER.filter(id => STUDIES[id].tier === 2 && STUDIES[id].applies(sp) && !found(sp, id) && (STUDIES[id].avail(sp) || (id === 'biochem' && sp.truth.exotic) || (id === 'acoustic' && sp.flags.has('vocal'))));
  return {ids, cost:ids.reduce((a, id) => a + studyCost(sp, id, {...S.ui, mit:'std'}), 0)};
}
function tierReport(sp){
  const p = planetOf(sp), F = id => valid(sp, id), traits = [], apps = [];
  let score = 1;
  const exotic = ['methane', 'silicon', 'ammonia', 'sulfur'].includes(p.biochem) && sp.kind !== 'fossil';
  if(sp.flags.has('tools')){ score += 3; traits.push({t:'Tool marks', d:`Something on ${p.name} made tools and cut these bones. Every specimen from that world just got more important, and harder to treat as inventory.`}); }
  else if(sp.flags.has('ruins')){ score += 2; traits.push({t:'Regular cut marks', d:'The bones carry marks that look deliberate. Isotope work on the rock around them could say what made them.'}); }
  if(sp.flags.has('vocal')){ score += 2; traits.push({t:'Vocalization', d:`It makes sound on purpose. Acoustic analysis (Tier 2) can tell whether the calls have structure. If they do, this stops being a pure biology question.`}); }
  if(exotic){ score += 2; traits.push({t:'Non-standard biochemistry', d:`It runs on ${BIOCHEM_NAME[p.biochem]}. The sequencer won't read it until biochemistry characterization (Tier 2) tells us how. Nobody at the partner labs has seen anything like it.`}); }
  if(sp.flags.has('dormant')){ score += 2; traits.push({t:'Dormant cells', d:'Something in the residue is still alive. Culture revival (Tier 2) could wake it. That is a high-risk study on a known pathogen. Plan full precautions.' }); }
  if(sp.kind === 'fossil' && sp.truth.genome === 'viable' && F('sample')){ score += 2; traits.push({t:'Intact organics', d:'The core is better preserved than it has any right to be. Sequencing (Tier 2) might recover enough genome for a de-extinction line (Tier 3).'}); }
  if(sp.truth.yield && F('assay')){ score += 2; }
  if(ANIMAL(sp) && sp.flags.has('motile')) traits.push({t:'Behavior under pressure', d:`Partner labs will handle ${sp.name} hands-on. Sedative clearance and a provocation test (Tier 2) tell them how long the drug lasts and what it does when cornered.`});
  if((sp.kind === 'flora' || sp.kind === 'microbe') && F('obs')) traits.push({t:'Spread pattern', d:'A spread test (Tier 2) answers the question every partner lab will ask first: will our seals hold it?'});
  if(F('habitat') && sp.truth.sensitive){ score += 1; traits.push({t:'Narrow habitat', d:`It needs ${sp.truth.needs.light}, ${sp.truth.needs.pressure} pressure, ${sp.truth.needs.temp} temperatures. Labs that skip that step get a stressed specimen, and stressed specimens breach.`}); }
  if(sp.kind !== 'fossil') traits.push({t:'Genome', d:'Sequencing (Tier 2) opens a cloning line. A cloned population means no more recovery trips for this species.'});
  const y = sp.truth.yield;
  if(y && F('assay')) apps.push({t:cap(y.type), d:`Compound extraction (Tier 2) could isolate it for licensing to Meridian.${y.dual ? ' The Directorate will want it too. Their money is better, and they want it as a weapon.' : ''}`, dual:!!y.dual});
  if(sp.kind === 'fossil') apps.push({t:'Deep-time record', d:`${sp.truth.age ? 'Hundreds of millions of years' : 'Deep time'} of ${p.name}'s history in one core. Paleobiology grants are small but steady.`});
  if(exotic) apps.push({t:'Exotic materials science', d:'Chemistry that works where ours freezes or burns. Industrial partners pay for that kind of thing.'});
  if(sp.flags.has('vocal') || sp.flags.has('tools')) apps.push({t:'Xenolinguistics and contact', d:'The best-funded work in the field, and the most dangerous to get wrong. If it turns out to be a person, consent stops being a formality.'});
  apps.push({t:'Reference dossier', d:`Every partner lab working with ${sp.name} follows your papers. A fuller dossier means fewer people hurt somewhere else.`});
  const hz = sp.truth.hazard, known = F('assay');
  const risk = !known ? 'Unknown' : ['venom', 'electric', 'pathogen'].includes(hz) ? 'Severe' : hz === 'none' ? (F('obs') && sp.find.obs.stance === 'danger' ? 'Elevated' : 'Low') : 'Elevated';
  const via = score >= 7 ? 'Exceptional' : score >= 5 ? 'Strong' : score >= 3 ? 'Moderate' : 'Limited';
  const prog = t2Program(sp);
  const by = sp.t1By || 'okafor', V = by === 'vasko';
  let rec;
  if(score >= 5) rec = V ? `This is a career, Director. Publish fast, then put everything into Tier 2.` : `Worth a second tier. Publish what we have first, so the partner labs aren't guessing, then start Tier 2.`;
  else if(score >= 3) rec = V ? `Decent. Publish, take the grant, and cherry-pick the Tier 2 studies that pay.` : `Publish Tier 1. Then pick the Tier 2 studies that close the biggest safety gaps before the ones that look good in a press release.`;
  else rec = V ? `Not much here. Publish it and ship it out. We need the lab for something interesting.` : `There isn't much left to learn that justifies the lab. Publish Tier 1, ship it to Meridian, and use the lab for the next recovery.`;
  if(sp.flags.has('vocal') && !V) rec += ' And I want acoustic work done before anyone sedates it again.';
  if(apps.some(a => a.dual) && !V) rec += ' Please do not sell the compound to Whitcomb.';
  return {score:Math.min(score, 8), via, risk, traits, apps, rec, by, prog};
}
