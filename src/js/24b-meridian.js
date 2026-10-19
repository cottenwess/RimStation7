/* ================= Meridian, the employer =================
   The company speaks in process. It has a form for everything that happens here,
   including the things that should not have happened, and the forms arrive on
   their own schedule rather than yours. Nothing in this file is a joke at the
   expense of anyone who got hurt: the comedy is that the institution cannot tell
   the difference between a dead colleague and a line item, and says so in writing. */
const BULLETINS = [
  {who:'ops', when:() => true, text:() => 'Meridian all-staff notice: the quarterly engagement survey is open. Rim Station 7 is listed under "remote and hybrid working".'},
  {who:'pruitt', when:() => S.deaths > 0, text:() => `Head office sent the bereavement policy. It is four pages and three of them are about returning equipment.`},
  {who:'pruitt', when:() => S.labs.filter(L => L.built).length >= 2, text:() => 'Meridian has issued updated signage for the labs. The new biohazard symbol is the old biohazard symbol in the corporate orange.'},
  {who:'ops', when:() => true, text:() => 'Reminder from Meridian Facilities: the nearest fire assembly point is 31 light years from this station. Staff are advised to use judgement.'},
  {who:'pruitt', when:() => S.specs.some(s => s.paperV > 0), text:() => 'Legal have been through the last paper. They have no notes on the science. They have eleven on the phrase "we were surprised".'},
  {who:'pruitt', when:() => overBudget(), text:() => `Finance would like the overrun explained in a form that has a box for "unforeseen" and no box for "alive".`},
  {who:'ops', when:() => S.compounds.some(c => c.state === 'licensed'), text:() => 'Meridian Marketing requests a photograph of the specimen that produced the licensed compound. They have asked that it look approachable.'},
  {who:'pruitt', when:() => S.techs.filter(a => a.alive).length > 6, text:() => 'Payroll has queried why a research station this size employs this many people. I have replied explaining what the work is. I expect they will query it again.'},
  {who:'ops', when:() => true, text:() => 'Meridian IT advise that the station password policy now requires a symbol. The station has one terminal and no door.'},
  {who:'pruitt', when:() => S.injuries > 0, text:() => 'Occupational Health have offered everyone a workstation assessment. They mean chairs.'},
  {who:'pruitt', when:() => S.standing < 45, text:() => 'There is a new reporting line between this station and head office. It is called an oversight partnership. It is a man named Keith who wants a weekly call.'},
  {who:'ops', when:() => S.labs.some(L => L.built && L.integrity < 70), text:() => 'Meridian Facilities have closed the maintenance ticket for this station. The resolution field reads "monitoring".'},
  {who:'pruitt', when:() => specialists().length >= 2, text:() => 'Meridian would like the specialists to record a short video about what drew them to xenobiology. For the careers page.'},
  {who:'pruitt', when:() => S.weapons, text:() => 'The Directorate sent a hamper. I have put it in the hub. Nobody has opened it.'},
  {who:'ops', when:() => S.hybrids > 0, text:() => 'Meridian Ethics has acknowledged receipt of the hybridization record. Acknowledged is the whole of the response.'}
];
/* One every few days, never during a breach, never at the moment of a death. */
function meridianTick(){
  if(S.breach || S.over || !S.specs.length) return;
  if(S.t < (S.nextBulletin || 0)) return;
  S.nextBulletin = S.t + 72 + Math.floor(rnd() * 72);
  S.saidBulletins = S.saidBulletins || [];
  const pool = BULLETINS.map((b, i) => ({b, i})).filter(x => !S.saidBulletins.includes(x.i) && x.b.when());
  if(!pool.length) return;
  const {b, i} = pick(pool);
  S.saidBulletins.push(i);
  notify(b.who, b.text(), 'admin');
}
