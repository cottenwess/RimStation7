/* ================= end ================= */
function endRun(kind){
  if(S.over) return;
  S.over = true;
  const grave = ['scuttle', 'overrun'].includes(kind);
  if(grave) G.g++;
  G.runs++; saveG();
  Q.length = 0; cur = null; clearInterval(typer); $('#dlg').hidden = true; $('#breach').hidden = true; $('#toast').hidden = true; $('#pub').hidden = true;
  const after = S.pending.slice(); S.pending = [];
  after.forEach(inc => { S.downstream += inc.deaths; });
  const titles = {closed:'Station closed', detach:'Cell detached', scuttle:'Vessel scuttled', overrun:'Station overrun', standing:'Program cancelled'};
  const verdicts = {
    closed:'You closed the station. Whatever the partner labs are working from is what they keep.',
    detach:'The cell falls toward the black hole with whatever was inside it. The station lives. The research does not.',
    scuttle:'You dropped the air-gapped vessel into the black hole. Everything restarts. The old station stays visible at the horizon, slowing to a stop.',
    overrun:'The specimen reached the shuttle bay before you chose a failsafe. The vessel scuttled itself on protocol.',
    standing:'Meridian cancelled the program. Too many retractions, too many bodies at partner labs, too many months in the red.'
  };
  let verdict = verdicts[kind];
  if(S.weapons) verdict += ' Some of your work went to the Directorate. You will see where it ended up, eventually.';
  if(S.sapientChoice === 'recognized') verdict += ' You recognized a sapient species as people. That paper will outlive the station.';
  if(S.sapientChoice === 'ignored') verdict += ' You filed a sapient species as specimens. That paper will outlive the station too.';
  const hidden = S.planets.filter(p => p.sapient);
  const rows = S.specs.map(sp => {
    const P = sp.paper, secs = sectionsFor(sp);
    let ok = 0, bad = 0, miss = 0;
    secs.forEach(s => { const c = P && P.claims[s]; if(!c) miss++; else if(c.ok) ok++; else bad++; });
    const recOk = P ? (sp.kind === 'fossil' || P.rec >= sp.truth.bsl) : null;
    return `<tr><td>${sp.name} <span class="muted">${sp.code}</span></td><td>${KIND_LABEL[sp.kind]}${sp.truth.sapience >= 3 ? ' · sapient' : ''}${!sp.alive ? ' · ' + (sp.released === 'ship' ? 'shipped' : sp.released === 'euth' ? 'euthanized' : 'dead') : ''}</td><td>${P ? `v${P.v}` : '<span class="muted">None</span>'}</td><td class="${bad ? 'bad' : miss ? 'miss' : 'ok'}">${P ? `${ok} right · ${bad} wrong · ${miss} missing` : '-'}</td><td class="${recOk === null ? 'muted' : recOk ? 'ok' : 'bad'}">${recOk === null ? '-' : `BSL-${P.rec} (needs ${sp.truth.bsl})`}</td></tr>`;
  }).join('');
  const reps = S.reports.concat(after.map(a => ({...a, after:true})));
  const repHtml = reps.length ? `<div class="eyebrow">What happened elsewhere</div><ul class="claims">${reps.map(r => `<li class="bad"><b>${r.after ? 'After the station closed' : fmtShort(r.t)} · ${r.lab}</b><span>${r.text}</span></li>`).join('')}</ul>` : '<p class="muted">No incidents were reported from the partner labs.</p>';
  const days = Math.max(1, Math.round((S.t - 6) / 24));
  $('#end').innerHTML = `<div class="sheet" role="dialog" aria-labelledby="endT">
    <div class="eyebrow">Run over · Day ${Math.floor(S.t / 24) + 1} · survey seed ${S.seed}</div>
    <h2 id="endT">${titles[kind]}</h2>
    <p>${verdict}</p>
    <div class="statgrid">
      <div><b>Days run</b><span>${days}</span></div>
      <div><b>Planets known</b><span>${S.planets.filter(p => p.known).length} of 5</span></div>
      <div><b>Specimens</b><span>${S.specs.length}</span></div>
      <div><b>Dead here</b><span>${S.deaths}</span></div>
      <div><b>Dead elsewhere</b><span>${S.downstream}</span></div>
      <div><b>Funds left</b><span>${Math.round(S.funds)} cr</span></div>
    </div>
    <div class="eyebrow">Your papers against the truth</div>
    <div class="tblwrap"><table><thead><tr><th>Specimen</th><th>Kind</th><th>Paper</th><th>Sections</th><th>Containment</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="muted small">${hidden.length ? `A sapient species lived on ${hidden[0].name} (${hidden[0].nick}).${hidden[0].known ? '' : ' You never found that world.'}` : 'No planet in this survey held a sapient species.'}</p>
    ${repHtml}
    ${grave ? '<p class="muted">The station goes over the horizon with every specimen aboard. None of it comes back, and none of it follows you into the next survey.</p>' : ''}
    <div class="row"><button type="button" class="btn primary" data-act="newrun">New survey</button></div>
  </div>`;
  $('#end').hidden = false;
  S.dirty = true;
}


