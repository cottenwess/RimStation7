"""Planner and scheduler: no drift, parked work, provisional queueing, lab lanes.

Guards the scheduling behaviours that are easy to break and obvious in play:
  1. Work queued behind its prerequisite parks at that prerequisite's end and
     stays there, instead of creeping an hour to the right every tick.
  2. A lone blocked item holds its slot rather than crawling across the day.
  3. Work pushed past tonight still appears on the schedule, parked at the edge.
  4. Bench work can be moved into a lab equipped for it, and not into one that
     is not.

Run:  python3 tests/smoke_planner.py   (after `node tools/build.mjs`)
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
from helpers import GAME, SHOTS, clear

BASE = """(sed) => { const H = window.__hb, S = H.S();
  S.labs.forEach(L => { L.built = true; });
  const p = S.planets.find(q => q.arch === 'garden') || S.planets[0];
  const sp = H.genSpecimen(p, 'fauna'); S.specs.push(sp); H.placeSpecimen(sp);
  sp.sed = sed ? 1 : 0; sp.lastSedT = sed ? S.t : null;
  S.lead = 'okafor'; S.funds = 2000; S.speed = 0; S.phase = 'morning';
  S.ui.spec = sp.id; S.ui.reps = 1; S.ui.washout = 0;
  return sp.id; }"""


async def boot(pg, sed=False):
    await pg.goto('file://' + GAME)
    await pg.wait_for_timeout(700)
    await clear(pg)
    return await pg.evaluate(BASE, sed)


async def main():
    os.makedirs(SHOTS, exist_ok=True)
    fails = []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1400, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))

        # 1. A dependency chain must not drift while it waits.
        await boot(pg)
        await pg.evaluate("""() => { const H = window.__hb, S = H.S(), id = S.specs[0].id;
          H.mkItem({kind:'study', type:'obs', sp:id});
          H.mkItem({kind:'study', type:'sample', sp:id});
          H.mkItem({kind:'study', type:'genome', sp:id});
          S.phase = 'shift'; }""")
        await clear(pg, 3)
        seen = []
        for _ in range(6):
            await pg.evaluate('() => window.__hb.tick()')
            g = await pg.evaluate("() => { const it = window.__hb.S().items.find(x => x.type === 'genome'); return it && it.start; }")
            if g is not None:
                seen.append(g)
        # Drift is a move on every tick. One move is legitimate: the prerequisite's
        # real duration can differ from the estimate, and the dependent work follows.
        changes = sum(1 for a, b in zip(seen, seen[1:]) if a != b)
        lockstep = len(seen) > 2 and all(b - a == 1 for a, b in zip(seen, seen[1:]))
        print('genome start while waiting:', seen, '| moves:', changes)
        if changes > 1 or lockstep:
            fails.append('dependent work drifted while waiting: %s' % seen)

        # 2. A lone blocked item holds its slot.
        await boot(pg)
        await pg.evaluate("""() => { const H = window.__hb, S = H.S(), sp = S.specs[0];
          sp.find.obs = {text:'x', ok:true, flagged:false, stance:'safe', by:'Okafor', t:S.t};
          sp.flags.add('motile');
          H.mkItem({kind:'study', type:'habitat', sp:sp.id});
          S.labs[0].haltUntil = S.t + 9; S.phase = 'shift'; }""")
        await clear(pg, 3)
        seen, why = [], ''
        for _ in range(6):
            await pg.evaluate('() => window.__hb.tick()')
            st = await pg.evaluate("() => { const it = window.__hb.S().items[0]; return it && {s:it.start, w:it.why}; }")
            if st:
                seen.append(st['s'])
                why = st['w']
        print('blocked item start:', seen, '| reason:', why)
        if len(set(seen)) > 1:
            fails.append('a lone blocked item drifted: %s' % seen)
        if seen and seen[0] != 8:
            fails.append('a blocked item did not hold its scheduled hour: %s' % seen)
        if not why:
            fails.append('a blocked item gave no reason')

        # 3. Work pushed past tonight still shows, parked at the edge.
        await boot(pg, sed=True)
        await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          S.ui.washout = 24;
          H.mkItem({kind:'study', type:'obs', sp:S.specs[0].id});
          S.ui.planner = true; S.dirty = true; }""")
        await pg.wait_for_timeout(400)
        await clear(pg, 3)
        r = await pg.evaluate("""() => { const S = window.__hb.S();
          const it = S.items[0];
          const d = Math.floor(S.t / 24), we = d * 24 + (S.ot[d] ? 23 : 20);
          return {start:it.start, pastToday:it.start >= we,
                  blocks:document.querySelectorAll('#planner .pblk').length,
                  parked:document.querySelectorAll('#planner .pblk.parked').length}; }""")
        print('washout parking:', json.dumps(r))
        if not r['pastToday']:
            fails.append('the washout did not push the observation past tonight, so parking is untested')
        elif r['parked'] < 1:
            fails.append('work pushed past tonight is not shown on the schedule')
        await pg.screenshot(path=os.path.join(SHOTS, 'planner-parked.png'))

        # 4. Bench work moves into an equipped lab, and only an equipped one.
        await boot(pg)
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S(), sp = S.specs[0];
          sp.find.obs = {text:'x', ok:true, flagged:false, stance:'safe', by:'Okafor', t:S.t};
          sp.find.sample = {text:'x', ok:true, flagged:false, stance:'', by:'Okafor', t:S.t};
          sp.flags.add('motile'); sp.flags.add('sample');
          const it = H.mkItem({kind:'study', type:'genome', sp:sp.id});
          const gi = S.labs.findIndex(L => L.type === 'genetics');
          const pi = S.labs.findIndex(L => L.type === 'physics');
          const toGen = H.moveItem(it, it.start, 'L' + gi);
          const laneAfter = it.lane;
          const toPhys = H.moveItem(it, it.start, 'L' + pi);
          return {defaultLane:'bench', toGen, laneAfter, toPhys, laneFinal:it.lane, gi, pi}; }""")
        print('lab lanes:', json.dumps(r))
        if r['toGen']:
            fails.append('genome sequencing was refused by the Genetics Lab: %r' % r['toGen'])
        if r['laneAfter'] != 'L%d' % r['gi']:
            fails.append('genome sequencing did not move into the Genetics Lab')
        if not r['toPhys']:
            fails.append('the Physics Lab accepted genome sequencing, which it is not equipped for')
        if r['laneFinal'] != 'L%d' % r['gi']:
            fails.append('a refused move changed the lane anyway')

        print('FAILURES', fails)
        print('ERRORS', errs)
        await br.close()
        return 1 if errs or fails else 0

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
