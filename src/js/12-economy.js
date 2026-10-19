/* ================= economy ================= */
function staffUpkeep(){ return S.techs.reduce((n, a) => n + (a.alive ? (ROLES[a.role] ? ROLES[a.role].upkeep : 0) : 0), 0) / 24; }
function upkeepPerHour(){ const b = S.labs.filter(L => L.built); return 0.15 + b.length * 0.08 + b.filter(L => L.bsl >= 3).length * 0.12 + (S.hazardPay ? 0.1 : 0) + 0.02 * S.specs.filter(s => s.alive && s.loc === 'hold').length + staffUpkeep(); }
function standing(d){ S.standing = clamp(S.standing + d, 0, 100); }
/* Budget model: this is an R&D station, not a business. Meridian funds the work
   up front and the director's job is the science, so nothing here is ever refused
   for lack of credits. Spending past the grant puts the station over budget, which
   is an administrative problem with administrative consequences: Pruitt files it,
   Meridian's confidence drops, and a program that stays over budget long enough
   gets cancelled. The science never stops for want of money. */
const overBudget = () => S.funds < 0;
const deficit = () => Math.max(0, -S.funds);
/* Would committing this much put the station over, or deeper over? */
const wouldOverrun = cost => S.funds - cost < 0;
const budgetTag = cost => wouldOverrun(cost) ? (overBudget() ? 'deepens the overrun' : 'goes over budget') : '';
/* Confidence lost per day while the books are red, scaled to how red. */
const overBudgetBleed = () => clamp(1 + deficit() / 70, 1, 6);
function budgetDayTick(){
  if(!overBudget()){ S.overRun = 0; return; }
  S.overDays = (S.overDays || 0) + 1;
  S.overRun = (S.overRun || 0) + 1;
  S.overPeak = Math.max(S.overPeak || 0, deficit());
  standing(-overBudgetBleed());
  const d = Math.round(deficit());
  if(S.overRun === 1) notify('pruitt', `We are over budget, ${d} cr in the red. Nothing stops. I want to be clear that nothing stopping is the policy and not an oversight, because I will be asked.`, 'warning');
  else if(S.overRun === 4) say('pruitt', 'uneasy', `Fourth day in the red, ${d} cr down. The work carries on, Director, that is the whole point of the place. But there is a column on a sheet in an office you will never visit, and it is going the wrong way, and eventually a person reads that column instead of the papers.`, {kind:'warning'});
  else if(S.overRun === 9) say('pruitt', 'numb', `Finance want a recovery plan. I have written "publish" and left the rest of the page blank. They will accept it, because the alternative is reading it.`, {kind:'warning'});
  else if(S.overRun % 7 === 0) notify('pruitt', `${S.overRun} days over budget, ${d} cr down. Standing is paying for it, as standing does.`, 'warning');
}
function renewalFor(t){ return Math.round(GRANT_RENEW[t] * clamp(S.standing / 60, 0.4, 1.3)); }

