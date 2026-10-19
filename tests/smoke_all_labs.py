"""Builds every lab, seeds specimens, compounds and materials through the debug handle,
then runs four days of auto-scheduled work across all labs.

Run:  python3 tests/smoke_all_labs.py   (after `node tools/build.mjs`)
"""
import asyncio, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
from helpers import GAME, SHOTS, clear, handle_breach

SEED = """() => { const H = window.__hb, S = H.S(); S.labs.forEach(L => { L.built = true; });
  const p = S.planets[0];
  for(const k of ['fauna', 'microbe', 'fossil']){ const s = H.genSpecimen(p, k); S.specs.push(s); H.placeSpecimen(s); }
  H.genMaterials(p); H.genMaterials(p);
  H.makeCompound(S.specs[0], 'bioelectric');
  const c2 = H.makeCompound(S.specs[0], 'toxin'); c2.state = 'chem';
  const c3 = H.makeCompound(S.specs[0], 'antimicrobial'); c3.state = 'micro';
  S.lead = 'okafor'; S.funds = 900; S.phase = 'morning'; S.speed = 0; H.camFit(); S.dirty = true; }"""


async def main():
    os.makedirs(SHOTS, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1360, 'height': 860})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + GAME)
        await pg.wait_for_timeout(800)
        await clear(pg)
        await pg.click('#sp0')
        await pg.evaluate(SEED)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=os.path.join(SHOTS, 'all-labs.png'))
        for day in range(4):
            await pg.click('#stats [data-act="planner"]')
            await pg.wait_for_timeout(200)
            for k in range(12):
                adds = pg.locator('#planner .tcard .tadd')
                if k >= await adds.count():
                    break
                await adds.nth(k).click()
                await pg.wait_for_timeout(100)
                if await pg.is_visible('#study'):
                    b = pg.locator('#study [data-act="begin"]')
                    if await b.is_disabled():
                        await pg.click('#study [data-act="study-close"]')
                    else:
                        await b.click()
                    await pg.wait_for_timeout(80)
                await clear(pg, 2)
            print('day', day, 'blocks', await pg.locator('#planner .pblk').count())
            await clear(pg)
            await pg.click('#planner [data-act="startday"]')
            await clear(pg, 4)
            await pg.click('#sp6')
            for _ in range(250):
                await pg.wait_for_timeout(200)
                await clear(pg, 3)
                if await pg.is_visible('#breach'):
                    await handle_breach(pg)
                if await pg.is_visible('#report'):
                    await pg.click('[data-act="report-close"]')
                if await pg.is_visible('#evening'):
                    await pg.click('#evening [data-act="closeday"]')
                    await pg.wait_for_timeout(200)
                    await clear(pg)
                    break
        print('ERRORS', errs)
        await br.close()
        return 1 if errs else 0

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
