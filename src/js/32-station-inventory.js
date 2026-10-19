/* ================= station: labs & inventory ================= */
const SYNERGY = {
  containment:'Sends tissue samples to the bench, genomes to Genetics, and compounds to Chem and Micro.',
  micro:'Holds microbes from recovery trips. Screens compounds from the containment labs. With a sequenced pathogen, develops vaccines.',
  genetics:'Holds fossils. Runs cloning lines from any viable genome, breeds hybrids from two animals, and crop strains from plants.',
  chem:'Synthesizes compounds so they license for more, and searches for derivatives with new uses.',
  physics:'Studies materials from every recovery trip, builds bio-batteries from bioelectric compounds, tests melanin shielding, and watches the black hole.'
};
function inventoryCards(){
  let h = '';
  const cs = S.compounds.filter(c => c.state !== 'licensed' && c.state !== 'sold');
  if(S.compounds.length) h += `<section class="card"><div class="eyebrow">Compounds · ${cs.length} on station</div>${cs.length ? `<ul class="inv">${cs.map(c => `<li><div><b>${c.short}</b><small>from ${c.spName} · ${c.state === 'micro' ? 'in the Micro Lab queue' : c.state === 'chem' ? 'in the Chem Lab queue' : 'held'}${c.synth ? ' · synthesized' : ''}${c.screened ? ' · screened' : ''}${c.battery ? ' · power cell' : ''}${c.shield ? ' · shielding' : ''} · worth ${compoundValue(c)} cr</small></div><div class="row">
      ${c.state === 'held' ? `<button type="button" class="btn" data-act="cmp:lic:${c.id}">License</button>${labOfType('micro') && !c.screened ? `<button type="button" class="btn" data-act="cmp:micro:${c.id}">To Micro</button>` : ''}${labOfType('chem') && !c.synth ? `<button type="button" class="btn" data-act="cmp:chem:${c.id}">To Chem</button>` : ''}${c.dual ? `<button type="button" class="btn danger" data-act="cmp:dir:${c.id}">Directorate</button>` : ''}` : `<button type="button" class="btn" data-act="cmp:hold:${c.id}">Recall</button>`}</div></li>`).join('')}</ul>` : '<p class="muted small">Everything extracted so far has been licensed or sold.</p>'}</section>`;
  const ms = S.materials.filter(m => m.state === 'held');
  if(S.materials.length) h += `<section class="card"><div class="eyebrow">Materials · ${ms.length} in the stores</div>${ms.length ? `<ul class="inv">${ms.map(m => `<li><div><b>${cap(m.base)}</b><small>${S.planets[m.planet].name}${m.volatile ? ' · volatile' : ''}${m.spectro ? ' · characterized' : ''}${m.stressed ? ' · stress tested' : ''}</small></div><div class="row">${m.stressed ? `<button type="button" class="btn" data-act="mat:lic:${m.id}">License · ${m.value} cr</button>` : `<span class="muted small">${labOfType('physics') ? 'Physics work available' : 'Needs the Physics Lab'}</span>`}</div></li>`).join('')}</ul>` : '<p class="muted small">Nothing in the stores.</p>'}</section>`;
  return h;
}

