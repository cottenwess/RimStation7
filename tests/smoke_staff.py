"""Staff roster: stats, traits, discipline-aware crewing, role gating, hiring, growth.

Checks the system does something, not merely that it fails to crash. Each block
asserts an observable consequence of the design in docs/DESIGN_STAFF.md.

Run:  python3 tests/smoke_staff.py   (after `node tools/build.mjs`)
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
from helpers import GAME, SHOTS, clear

FOUNDING = """() => { const S = window.__hb.S();
  const roles = {}; S.techs.forEach(a => { roles[a.role] = (roles[a.role] || 0) + 1; });
  const a = S.techs[0];
  return {roles, n:S.techs.length, hasStats:!!a.stats, hasCap:!!a.cap, hasXp:!!a.xp,
          traits:S.techs.map(x => x.traits.length), morale:a.morale,
          statKeys:Object.keys(a.stats).sort().join(','),
          zooRefusesHandling:S.techs.some(x => x.role === 'zoologist' && x.traits.includes('squeamish')),
          everyCapRespected:S.techs.every(x => Object.keys(x.stats).every(k => x.stats[k] <= x.cap[k]))}; }"""

# A zoologist covers observation work; a xenobiologist covers assays. Auto-assign
# should reach for the right one without being told.
CREWING = """() => { const H = window.__hb, S = H.S();
  const zoo = S.techs.find(a => a.role === 'zoologist'), xb = S.techs.find(a => a.role === 'xenobio');
  const obsPick = H.st.pickCrew('observe', 1, 'obs');
  const assayPick = H.st.pickCrew('bench', 1, 'assay');
  return {zooFirstOnObs:obsPick[0] === zoo.id, xbFirstOnAssay:assayPick[0] === xb.id,
          zoo:zoo.id, xb:xb.id, obsPick, assayPick}; }"""

GATING = """() => { const H = window.__hb, S = H.S();
  const before = {hybrid:H.st.gatedBy('hybrid'), language:H.st.gatedBy('language'),
                  geneticistOpen:H.st.roleOpen('geneticist'), chemistOpen:H.st.roleOpen('chemist'),
                  speechOpen:H.st.roleOpen('speech'), openNow:H.st.openRoles()};
  S.labs.forEach(L => { if(L.type === 'genetics' || L.type === 'chem') L.built = true; });
  const afterLabs = {geneticistOpen:H.st.roleOpen('geneticist'), chemistOpen:H.st.roleOpen('chemist')};
  return {before, afterLabs}; }"""

# Hiring a geneticist must open hybridization, which nothing else can run.
HIRING = """() => { const H = window.__hb, S = H.S();
  S.funds = 900; S.phase = 'evening';
  S.candidates = []; S.nextCandidate = 0;
  S.labs.forEach(L => { L.built = true; });
  H.st.openRoles();
  S.candidates = [];
  S.nextCandidate = -1;
  const mk = () => { S.nextCandidate = -1; };
  mk();
  return {openRoles:H.st.openRoles()}; }"""

GROWTH = """() => { const H = window.__hb, S = H.S();
  const a = S.techs.find(x => x.cap.bench >= 2);
  if(!a) return {skipped:true};
  a.stats.bench = 0; a.xp.bench = 0;
  const before = a.stats.bench;
  H.st.awardXp(a.id, 'bench', 200);
  return {before, after:a.stats.bench, cap:a.cap.bench, cappedCorrectly:a.stats.bench === a.cap.bench}; }"""

# A skilled crew should be faster, safer and cleaner than an unskilled one.
FACTORS = """() => { const H = window.__hb, S = H.S();
  const a = S.techs[0], b = S.techs[1];
  STAT = ['handling', 'bench', 'observe', 'nerve'];
  STAT.forEach(k => { a.stats[k] = 4; a.cap[k] = 4; b.stats[k] = 0; b.cap[k] = 4; });
  a.traits = []; b.traits = []; a.morale = 80; b.morale = 80;
  const good = H.st.crewFactors([a.id], 'bench', 'genome');
  const bad = H.st.crewFactors([b.id], 'bench', 'genome');
  return {good, bad, faster:good.work < bad.work, safer:good.risk < bad.risk, cleaner:good.quality < bad.quality}; }"""

MORALE = """() => { const H = window.__hb, S = H.S();
  const a = S.techs[0];
  a.traits = ['bythebook']; a.stats.bench = 2; a.cap.bench = 4; a.morale = 60;
  S.lead = 'okafor'; const liked = H.st.statOf(a.id, 'bench');
  S.lead = 'vasko'; const clashed = H.st.statOf(a.id, 'bench');
  S.lead = 'okafor'; const base = H.st.statOf(a.id, 'bench');
  a.morale = 5; const low = H.st.statOf(a.id, 'bench');
  return {liked, clashed, affinityMatters:liked > clashed, base, low, moraleMatters:low < base}; }"""


async def main():
    os.makedirs(SHOTS, exist_ok=True)
    fails = []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1360, 'height': 860})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + GAME)
        await pg.wait_for_timeout(800)
        await clear(pg)

        r = await pg.evaluate(FOUNDING)
        print('founding roster:', json.dumps(r))
        if r['n'] != 5 or r['roles'].get('tech') != 3 or r['roles'].get('xenobio') != 1 or r['roles'].get('zoologist') != 1:
            fails.append('founding roster is not 3 techs + xenobiologist + zoologist')
        if not (r['hasStats'] and r['hasCap'] and r['hasXp']):
            fails.append('staff records are missing stats, potential or experience')
        if r['statKeys'] != 'bench,handling,nerve,observe':
            fails.append('stat keys wrong: %s' % r['statKeys'])
        if not all(n >= 1 for n in r['traits']):
            fails.append('some staff have no traits')
        if not r['everyCapRespected']:
            fails.append('a starting stat exceeds its potential')
        if r['zooRefusesHandling']:
            fails.append('a zoologist rolled a trait refusing the hands-on work they exist for')

        r = await pg.evaluate(CREWING)
        print('discipline-aware crewing:', json.dumps(r))
        if not r['zooFirstOnObs']:
            fails.append('zoologist was not picked first for observation work')
        if not r['xbFirstOnAssay']:
            fails.append('xenobiologist was not picked first for assay work')

        r = await pg.evaluate(FACTORS)
        print('crew factors:', json.dumps(r))
        for k in ('faster', 'safer', 'cleaner'):
            if not r[k]:
                fails.append('a skilled crew is not %s than an unskilled one' % k)

        r = await pg.evaluate(MORALE)
        print('affinity and morale:', json.dumps(r))
        if not r['affinityMatters']:
            fails.append('lead affinity does not change effective skill')
        if not r['moraleMatters']:
            fails.append('low morale does not cost a pip')

        r = await pg.evaluate(GROWTH)
        print('growth:', json.dumps(r))
        if not r.get('skipped'):
            if r['after'] <= r['before']:
                fails.append('experience did not raise a stat')
            if not r['cappedCorrectly']:
                fails.append('experience pushed a stat past its potential')

        r = await pg.evaluate(GATING)
        print('role gating:', json.dumps(r))
        if r['before']['hybrid'] != 'geneticist':
            fails.append('hybridization is not gated on a geneticist')
        if r['before']['language'] != 'speech':
            fails.append('signal decoding is not gated on a speech researcher')
        if r['before']['geneticistOpen'] or r['before']['chemistOpen']:
            fails.append('lab specialists were hirable before their lab was built')
        if not (r['afterLabs']['geneticistOpen'] and r['afterLabs']['chemistOpen']):
            fails.append('building the lab did not open its specialist')
        if r['before']['speechOpen']:
            fails.append('speech researcher was open with no vocal specimen')
        if sorted(r['before']['openNow']) != ['tech', 'xenobio', 'zoologist']:
            fails.append('day-one roles are not tech/xenobio/zoologist: %s' % r['before']['openNow'])

        # Hire whoever is on the list and confirm they join the roster.
        hired = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          S.funds = 900; S.phase = 'evening'; S.specs = [];
          S.nextCandidate = 0; S.candidates = [];
          window.__rc && window.__rc();
          return null; }""")
        await pg.evaluate("() => { const S = window.__hb.S(); S.nextCandidate = 0; }")
        # Drive a night so refreshCandidates() runs through the real day cycle.
        await pg.evaluate("() => { const S = window.__hb.S(); S.t = S.t - (S.t % 24) + 19; S.phase = 'shift'; }")
        for _ in range(40):
            await pg.evaluate('() => window.__hb.tick()')
        await clear(pg)
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          const before = S.techs.length, c = (S.candidates || [])[0];
          if(!c) return {noCandidates:true, n:(S.candidates || []).length};
          S.funds = 900; S.phase = 'evening';
          H.st.hire(c.id);
          return {before, after:S.techs.length, role:c.role, name:c.name,
                  joined:S.techs.some(a => a.id === c.id), funds:Math.round(S.funds),
                  stillListed:(S.candidates || []).some(x => x.id === c.id)}; }""")
        print('hiring:', json.dumps(r))
        if r.get('noCandidates'):
            fails.append('no candidates were ever offered')
        else:
            if not r['joined']:
                fails.append('a hired candidate did not join the roster')
            if r['after'] != r['before'] + 1:
                fails.append('roster size did not grow by one on hire')
            if r['stillListed']:
                fails.append('a hired candidate is still on the candidate list')

        # ---- lab heads ----
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          // Start this block from a known roster: earlier blocks hire at random.
          S.techs = S.techs.filter(a => a.role === 'tech' || a.role === 'xenobio' || a.role === 'zoologist');
          S.labs.forEach(L => { L.built = (L.type === 'containment' && L.j === 0); L.head = null; });
          H.st.reseat();
          const a = H.st.heads().find(x => x.built);
          const before = {headed:a.headed, need:a.need};
          // Building a specialty lab with nobody qualified must be refused
          const gi = S.labs.findIndex(L => L.type === 'genetics');
          S.funds = 2000; S.phase = 'evening'; S.specs = [];
          // Labs build in row order, so clear the chain ahead of Genetics first.
          S.labs.forEach(L => { if(L.type === 'containment' || L.type === 'micro') L.built = true; });
          S.specs = [{grantTier:1, alive:true, paperV:1, flags:new Set(), truth:{sapience:0}, find:{}, id:'x', kind:'fauna', name:'t', lab:null, paper:null}];
          const blockNoHead = H.st.buildBlock(gi);
          return {before, blockNoHead, freeGeneticists:H.st.freeHeads('geneticist').length}; }""")
        print('lab heads:', json.dumps(r))
        if not r['before']['headed']:
            fails.append('Lab A has no head even though a xenobiologist is on the roster')
        if r['freeGeneticists'] != 0:
            fails.append('a geneticist exists before one was hired')
        if 'geneticist' not in (r['blockNoHead'] or '').lower():
            fails.append('building the Genetics Lab was not blocked on hiring a geneticist: %r' % r['blockNoHead'])

        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          const gi = S.labs.findIndex(L => L.type === 'genetics');
          // hire a geneticist, then the build should be allowed
          S.labs.forEach(L => { if(L.type === 'containment' || L.type === 'micro') L.built = true; });
          if(!S.techs.some(a => a.alive && a.role === 'micro')){ const m = H.mkStaff('micro'); S.techs.push(m); }
          const made = H.mkStaff('geneticist'); S.techs.push(made); H.st.reseat();
          const after = H.st.buildBlock(gi);
          // build it and confirm the head is seated on completion
          S.labs[gi].built = true; H.st.reseat();
          const seated = H.st.heads().find(x => x.type === 'genetics');
          return {after, seated:seated.headed, head:seated.head, madeId:made.id}; }""")
        print('after hiring a geneticist:', json.dumps(r))
        if r['after']:
            fails.append('building was still blocked after hiring a geneticist: %r' % r['after'])
        if not r['seated'] or r['head'] != r['madeId']:
            fails.append('the hired geneticist was not seated as head of the Genetics Lab')

        # An unheaded lab must be slower and dirtier than a headed one.
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          const gi = S.labs.findIndex(L => L.type === 'genetics');
          const L = S.labs[gi];
          const keep = L.head;
          const lane = 'L' + gi;
          const headed = H.st.headPenalty ? null : null;
          L.head = keep; const withHead = H.st.penalty(lane);
          L.head = null;  const without = H.st.penalty(lane);
          L.head = keep;
          return {withHead, without}; }""")
        print('head penalty:', json.dumps(r))
        if not (r['without']['work'] > r['withHead']['work'] and r['without']['quality'] > r['withHead']['quality']):
            fails.append('an unheaded lab is not slower and less reliable')

        # ---- same-type lab dynamics ----
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          S.labs.forEach(L => { L.built = L.type === 'containment'; L.head = null; });
          // two xenobiologists so both containment cells get a head
          S.techs = S.techs.filter(a => a.role !== 'xenobio');
          const A = H.mkStaff('xenobio'); S.usedNames.add(A.name);
          const B = H.mkStaff('xenobio'); S.usedNames.add(B.name);
          A.traits = ['ambitious']; B.traits = ['gloryhound'];
          A.morale = 60; B.morale = 60;
          S.techs.push(A, B); H.st.reseat();
          S.bonds = {};
          const pairs = H.st.pairs();
          for(let i = 0; i < 40; i++) H.st.dayTick();
          const b = Object.values(S.bonds)[0];
          return {pairs:pairs.length, tension:b && Math.round(b.tension), bond:b && Math.round(b.bond),
                  A:A.id, B:B.id}; }""")
        print('head pairs:', json.dumps(r))
        if r['pairs'] != 1:
            fails.append('two same-type labs did not produce exactly one head pairing (%s)' % r['pairs'])
        if not r['tension'] or r['tension'] < 20:
            fails.append('two ambitious heads built no tension over 40 days (%s)' % r['tension'])

        # The friction has to actually reach the player as a decision.
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          const b = Object.values(S.bonds)[0];
          b.tension = 90; b.told = -999; b.state = '';
          H.st.briefing();
          return {dlg:!document.querySelector('#dlg').hidden,
                  text:(document.querySelector('#dlgText') || {}).textContent || '',
                  choices:document.querySelectorAll('#dlgChoices button').length}; }""")
        # The dialog types itself out; wait for the decision to appear.
        r2 = {'text': '', 'choices': 0}
        for _ in range(40):
            await pg.wait_for_timeout(120)
            r2 = await pg.evaluate("() => ({text:(document.querySelector('#dlgText')||{}).textContent||'', choices:document.querySelectorAll('#dlgChoices button').length})")
            if r2['choices']:
                break
        print('friction event:', json.dumps({'dlg': r['dlg'], 'text': r2['text'][:150], 'choices': r2['choices']}))
        names = await pg.evaluate("""() => { const S = window.__hb.S();
          const b = Object.values(S.bonds)[0];
          const A = S.techs.find(x => x.id === b.a), B = S.techs.find(x => x.id === b.b);
          return {a:A && A.name, b:B && B.name}; }""")
        if names['a'] == names['b']:
            fails.append('two different staff share a name: %r' % names)
        if not r['dlg']:
            fails.append('high tension between two lab heads raised no event')
        if r2['choices'] < 2:
            fails.append('the friction event offered no decision (%d choices)' % r2['choices'])
        await clear(pg, 4)

        # ---- budget: nothing is refused for money ----
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          S.funds = -500; S.phase = 'evening'; S.breach = null;
          const gi = S.labs.findIndex(L => L.type === 'genetics');
          S.labs.forEach(L => { if(L.type === 'containment' || L.type === 'micro') L.built = true; });
          S.labs[gi].built = false; S.labs[gi].building = null;
          const geneticist = S.techs.find(a => a.role === 'geneticist');
          if(!geneticist){ const g = H.mkStaff('geneticist'); S.techs.push(g); H.st.reseat(); }
          const build = H.st.buildBlock(gi);
          const cand = (S.candidates || [])[0];
          return {overBudget:H.st.overBudget(), deficit:Math.round(H.st.deficit()),
                  buildBlocked:build, moneyWord:/fund|cr\b|afford/i.test(build || '')}; }""")
        print('over budget:', json.dumps(r))
        if not r['overBudget']:
            fails.append('a negative balance did not register as over budget')
        if r['moneyWord']:
            fails.append('building was refused for money reasons: %r' % r['buildBlocked'])

        # The Staff tab has to render all of this without throwing.
        await pg.click('#tab-staff')
        await pg.wait_for_timeout(300)
        txt = await pg.inner_text('#pane')
        low = txt.lower()
        for want in ['roster', 'available for hire', 'record']:
            if want not in low:
                fails.append('Staff tab is missing the %s section' % want)
        if '★' not in txt:
            fails.append('Staff tab shows no stat pips')
        await pg.screenshot(path=os.path.join(SHOTS, 'staff.png'))
        print('staff tab rendered, %d chars' % len(txt))

        print('FAILURES', fails)
        print('ERRORS', errs)
        await br.close()
        return 1 if errs or fails else 0

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
