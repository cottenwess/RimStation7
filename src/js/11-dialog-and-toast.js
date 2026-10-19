/* ================= notebook / dialog / toast ================= */
function fmtT(t){ return 'Day ' + (Math.floor(t / 24) + 1) + ' ' + String(t % 24).padStart(2, '0') + ':00'; }
function fmtShort(t){ return 'D' + (Math.floor(t / 24) + 1) + ' ' + String(t % 24).padStart(2, '0') + ':00'; }
function log(who, kind, text){ S.notes.push({t:S.t, who, kind, text}); S.dirty = true; }
const Q = []; let cur = null, typer = null, typedLen = 0;
function say(who, mood, text, o = {}){
  if(o.log !== false) log(who, o.kind || 'note', text);
  Q.push({who, mood, text, choices:o.choices || null});
  if(!cur) nextDlg();
}
function nextDlg(){
  cur = Q.shift() || null;
  const el = $('#dlg');
  if(!cur){ el.hidden = true; S.dirty = true; return; }
  el.hidden = false;
  const p = PEOPLE[cur.who];
  drawPortrait($('#dlgPt').getContext('2d'), cur.who, cur.mood);
  $('#dlgName').textContent = p.name; $('#dlgRole').textContent = p.role || '';
  $('#dlgMood').textContent = MOODS[cur.mood] || '';
  $('#dlgChoices').hidden = true; $('#dlgChoices').innerHTML = ''; $('#dlgHint').hidden = true;
  typedLen = 0; $('#dlgText').textContent = '';
  clearInterval(typer);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){ finishType(); return; }
  typer = setInterval(() => { typedLen += 2; $('#dlgText').textContent = cur.text.slice(0, typedLen); if(typedLen >= cur.text.length) finishType(); }, 16);
}
function finishType(){
  clearInterval(typer); typer = null;
  if(!cur) return;
  $('#dlgText').textContent = cur.text;
  if(cur.choices){
    const box = $('#dlgChoices'); box.hidden = false;
    box.innerHTML = cur.choices.map((c, i) => `<button type="button" data-choice="${i}">${c.label}</button>`).join('');
    const first = box.querySelector('button'); if(first) first.focus({preventScroll:true});
  } else $('#dlgHint').hidden = false;
}
$('#dlg').addEventListener('click', e => {
  const ch = e.target.closest('[data-choice]');
  if(ch && cur && cur.choices){ const c = cur.choices[+ch.dataset.choice]; c.act(); nextDlg(); return; }
  if(typer){ finishType(); return; }
  if(cur && !cur.choices) nextDlg();
});
window.addEventListener('keydown', e => {
  if(e.key === 'Escape' && !$('#study').hidden){ S.ui.studyOpen = false; S.dirty = true; return; }
  if(e.key === 'Escape' && !$('#report').hidden){ S.ui.report = null; S.dirty = true; return; }
  if(!cur || (e.key !== ' ' && e.key !== 'Enter')) return;
  if(e.target.closest && e.target.closest('[data-choice]')) return;
  e.preventDefault();
  if(typer){ finishType(); return; }
  if(!cur.choices) nextDlg();
});
let toastTimer = null;
function notify(who, text, kind = 'admin'){
  log(who, kind, text);
  drawPortrait($('#toastPt').getContext('2d'), who, 'neutral');
  $('#toastName').textContent = PEOPLE[who].name; $('#toastText').textContent = text;
  $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6000);
}

