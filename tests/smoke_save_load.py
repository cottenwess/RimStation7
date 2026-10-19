"""Save/load round trip: captures a run, restores it, and proves nothing changed.

Three checks, in order of how much they catch:
  1. Purity    capture -> restore -> capture gives a byte-identical payload.
  2. Resume    40 ticks after a restore play out exactly as the 40 ticks before it,
               which only holds if the RNG position and every counter came back.
  3. Slots     a real localStorage save survives further play and a reload.

Run:  python3 tests/smoke_save_load.py   (after `node tools/build.mjs`)
Needs: pip install playwright && python3 -m playwright install chromium
Exit code 1 if the page throws any error or a check fails.
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
from helpers import GAME, SHOTS, clear, step, until, plan_day

# A run with something in every system: all labs, three kinds of specimen,
# compounds mid-queue, materials, a lead, and scheduled work.
SEED = """() => { const H = window.__hb, S = H.S();
  S.labs.forEach(L => { L.built = true; });
  const p = S.planets[0];
  for(const k of ['fauna', 'microbe', 'fossil']){ const s = H.genSpecimen(p, k); S.specs.push(s); H.placeSpecimen(s); }
  H.genMaterials(p); H.genMaterials(p);
  H.makeCompound(S.specs[0], 'bioelectric');
  const c2 = H.makeCompound(S.specs[0], 'toxin'); c2.state = 'chem';
  const c3 = H.makeCompound(S.specs[0], 'antimicrobial'); c3.state = 'micro';
  S.lead = 'okafor'; S.funds = 900; S.phase = 'morning'; S.speed = 0; H.camFit(); S.dirty = true; }"""

# capture -> restore -> capture, compared byte for byte, with the first
# difference reported so a broken field names itself.
PURITY = """() => { const H = window.__hb;
  const why = H.blocked(); if(why) return {ok:false, err:'save was blocked: ' + why};
  let a; try { a = H.capture(); } catch(e){ return {ok:false, err:'capture threw: ' + e.message}; }
  const before = JSON.stringify(a.S), leadsBefore = JSON.stringify(a.leads);
  const err = H.restore(JSON.parse(JSON.stringify(a))); if(err) return {ok:false, err:'restore: ' + err};
  const b = H.capture();
  const after = JSON.stringify(b.S), leadsAfter = JSON.stringify(b.leads);
  const diff = (x, y) => { if(x === y) return null;
    let i = 0; while(i < x.length && i < y.length && x[i] === y[i]) i++;
    return {at:i, was:x.slice(Math.max(0, i - 60), i + 60), now:y.slice(Math.max(0, i - 60), i + 60)}; };
  return {ok:before === after && leadsBefore === leadsAfter, bytes:before.length,
          sDiff:diff(before, after), leadDiff:diff(leadsBefore, leadsAfter)}; }"""

# The same 40 hours, played twice from the same saved point.
RESUME = """(n) => { const H = window.__hb;
  const why = H.blocked(); if(why) return {ok:false, err:'save was blocked: ' + why};
  const snap = JSON.parse(JSON.stringify(H.capture()));
  const play = () => { const out = [];
    for(let i = 0; i < n; i++){ H.tick(); const s = H.S();
      out.push([s.t, Math.round(s.funds * 1000), H.rng(), s.specs.length, s.items.length,
                s.deaths, s.injuries, s.notes.length, s.standing, s.breach ? s.breach.stage : 0,
                s.specs.map(x => Math.round(x.stress * 1e6) + ':' + Math.round(x.sed * 1e6)).join('|')].join(','));
      if(s.over) break; }
    return out.join(';'); };
  const first = play();
  const err = H.restore(JSON.parse(JSON.stringify(snap))); if(err) return {ok:false, err:'restore: ' + err};
  const second = play();
  if(first === second) return {ok:true, hours:first.split(';').length};
  const rows1 = first.split(';'), rows2 = second.split(';');
  let i = 0; while(i < rows1.length && i < rows2.length && rows1[i] === rows2[i]) i++;
  return {ok:false, divergedAtHour:i, was:rows1[i], now:rows2[i]}; }"""


async def dialog_idle(pg):
    """Saving is refused mid-sentence by design, so drain the queue first."""
    for _ in range(30):
        if not await pg.evaluate('() => window.__hb.blocked()'):
            return True
        await clear(pg, 3)
        await pg.wait_for_timeout(80)
    return not await pg.evaluate('() => window.__hb.blocked()')


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
        await pg.evaluate(SEED)
        await pg.wait_for_timeout(200)
        await clear(pg)

        # 1. Purity, on a seeded run with every system populated.
        if not await dialog_idle(pg):
            fails.append('could not reach an idle dialog to save from')
        r = await pg.evaluate(PURITY)
        print('purity (seeded):', json.dumps(r)[:600])
        if not r.get('ok'):
            fails.append('purity failed on the seeded run')

        # 2. Resume: identical play after a restore.
        r = await pg.evaluate(RESUME, 40)
        print('resume (40 h):', json.dumps(r)[:600])
        if not r.get('ok'):
            fails.append('resume diverged after restore')

        # 2b. Every id counter must survive a load. A counter left out of the save
        # resets to zero and the next entity minted collides with an existing one,
        # which rebinds crews and lab heads to the wrong people without any error.
        r = await pg.evaluate("""() => { const H = window.__hb, S = H.S();
          const snap = JSON.parse(JSON.stringify(H.capture()));
          const err = H.restore(snap); if(err) return {ok:false, err};
          const ids = () => ({staff:S.techs.map(a => a.id), items:S.items.map(x => x.id),
                              specs:S.specs.map(x => x.id), cmp:S.compounds.map(x => x.id),
                              mat:S.materials.map(x => x.id)});
          const before = ids();
          // Mint one of everything the game can create after a load.
          const made = H.mkStaff('tech'); S.techs.push(made);
          const p = S.planets[0];
          const sp = H.genSpecimen(p, 'fauna'); S.specs.push(sp);
          H.makeCompound(sp, 'toxin'); H.genMaterials(p);
          const after = ids();
          const dup = k => { const seen = {}, out = []; for(const v of after[k]) { if(seen[v]) out.push(k + ':' + v); seen[v] = 1; } return out; };
          const dups = ['staff', 'items', 'specs', 'cmp', 'mat'].reduce((a, k) => a.concat(dup(k)), []);
          return {ok:dups.length === 0, dups, newStaff:made.id, staffBefore:before.staff.length}; }""")
        print('id counters survive a load:', json.dumps(r))
        if not r.get('ok'):
            fails.append('ids collided after a load, a counter is missing from the save: %s' % r.get('dups') or r.get('err'))

        # 3. Purity again at every phase seam of a real playthrough.
        await pg.goto('file://' + GAME)
        await pg.wait_for_timeout(800)
        await clear(pg)
        await pg.click('[data-act^="planet:"] >> nth=0')
        if await pg.locator('[data-act^="dispatch:"]').is_disabled():
            await pg.click('[data-act^="planet:"] >> nth=1')
        await pg.click('[data-act^="dispatch:"]')
        await clear(pg)
        await pg.click('#tab-staff')
        await pg.click('[data-act="assign:okafor"]')
        await clear(pg)
        await pg.click('#tab-research')
        await pg.click('#sp6')

        async def ready():
            return await pg.is_visible('#evening') or await pg.locator('#stats [data-act="planner"].pulse').count() > 0

        checked, saved_at = 0, None
        for day in range(6):
            if not await until(pg, ready, 250):
                print('stuck waiting for morning or evening')
                break
            await step(pg)
            if await dialog_idle(pg):
                r = await pg.evaluate(PURITY)
                checked += 1
                if not r.get('ok'):
                    print('purity (day %d):' % day, json.dumps(r)[:800])
                    fails.append('purity failed at a phase seam on day %d' % day)
            if await pg.is_visible('#evening'):
                b = pg.locator('#evening [data-act="build:1"]')
                if await b.count() and not await b.is_disabled():
                    await b.click()
                    await clear(pg)
                await clear(pg)
                await pg.click('#evening [data-act="closeday"]')
                await pg.wait_for_timeout(150)
                continue
            # Morning: save to a real slot on day 2, then keep playing.
            if saved_at is None and day >= 1 and await dialog_idle(pg):
                why = await pg.evaluate('() => window.__hb.save("2")')
                if why:
                    fails.append('slot save refused: %s' % why)
                else:
                    saved_at = await pg.evaluate('() => { const i = window.__hb.slots().find(x => x && x.slot === "2"); return i && {day:i.day, funds:i.funds, specs:i.specs}; }')
                    print('saved to slot 2:', saved_at)
            await pg.click('#stats [data-act="planner"]')
            await pg.wait_for_timeout(150)
            await plan_day(pg)
            await step(pg)
            await pg.click('#planner [data-act="startday"]')
            await pg.wait_for_timeout(100)
            await clear(pg, 4)
            await pg.click('#sp6')
            await pg.click('#tab-papers')
            await pg.wait_for_timeout(80)
            pb = pg.locator('[data-act="publish-open"]')
            if await pb.count() and not await pb.is_disabled():
                await pb.click()
                await pg.click('[data-act="publish-confirm"]')
                await clear(pg)
            await pg.click('#tab-research')
        print('phase-seam purity checks:', checked)
        if checked < 3:
            fails.append('too few phase-seam checks ran (%d)' % checked)

        # 4. The slot survives further play, and survives a page reload.
        if saved_at:
            err = await pg.evaluate('() => window.__hb.load("2")')
            if err:
                fails.append('slot load failed: %s' % err)
            else:
                now = await pg.evaluate('() => { const s = window.__hb.S(); return {day:Math.floor(s.t / 24) + 1, funds:Math.round(s.funds), specs:s.specs.filter(x => x.alive).length}; }')
                print('loaded slot 2:', now)
                if now != saved_at:
                    fails.append('loaded run does not match what was saved: %s vs %s' % (now, saved_at))
            await pg.reload()
            await pg.wait_for_timeout(800)
            await clear(pg)
            after_reload = await pg.evaluate('() => { const i = window.__hb.slots().find(x => x && x.slot === "2"); return i && {day:i.day, funds:i.funds, specs:i.specs}; }')
            print('slot 2 after reload:', after_reload)
            if after_reload != saved_at:
                fails.append('slot did not survive a reload: %s vs %s' % (after_reload, saved_at))
            await pg.evaluate('() => window.__hb.del("2")')
        else:
            fails.append('never reached a morning to save from')

        await pg.screenshot(path=os.path.join(SHOTS, 'save-load.png'))
        print('FAILURES', fails)
        print('ERRORS', errs)
        await br.close()
        return 1 if errs or fails else 0

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
