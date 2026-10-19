"""Plays the opening of a run: first mission, planner days, evening briefings, first paper, Lab B.

Run:  python3 tests/smoke_playthrough.py   (after `node tools/build.mjs`)
Needs: pip install playwright && python3 -m playwright install chromium
Exit code 1 if the page throws any error.
"""
import asyncio, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
from helpers import GAME, SHOTS, clear, step, until, plan_day


async def main(days=14):
    os.makedirs(SHOTS, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1360, 'height': 860})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
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

        built = False
        for day in range(days):
            if not await until(pg, ready, 250):
                print('stuck waiting for morning or evening')
                break
            await step(pg)
            if await pg.is_visible('#evening'):
                if day < 2:
                    await pg.screenshot(path=os.path.join(SHOTS, 'evening.png'))
                b = pg.locator('#evening [data-act="build:1"]')
                if not built and await b.count() and not await b.is_disabled():
                    await b.click(); built = True; print('built Lab B')
                    await clear(pg)
                await clear(pg)
                await pg.click('#evening [data-act="closeday"]')
                await pg.wait_for_timeout(150)
                continue
            print('morning', (await pg.inner_text('#stats')).replace('\n', ' '))
            await pg.click('#stats [data-act="planner"]')
            await pg.wait_for_timeout(150)
            await plan_day(pg)
            if day < 3:
                await pg.screenshot(path=os.path.join(SHOTS, 'planner.png'))
            await step(pg)
            await pg.click('#planner [data-act="startday"]')
            await pg.wait_for_timeout(100)
            await pg.click('#sp6')
            # Pause before touching the Papers tab: the panel re-renders live, and
            # a study finishing mid-click can disable Publish under the cursor.
            await pg.click('#sp0')
            await pg.click('#tab-papers')
            await pg.wait_for_timeout(120)
            await clear(pg, 3)
            pb = pg.locator('[data-act="publish-open"]')
            if await pb.count() and not await pb.is_disabled():
                await pb.click()
                await pg.click('[data-act="publish-confirm"]')
                await clear(pg)
                print('published')
            await pg.click('#tab-research')
            await pg.click('#sp6')
        await pg.screenshot(path=os.path.join(SHOTS, 'end.png'))
        print(await pg.inner_text('#stats'))
        print('ERRORS', errs)
        await br.close()
        return 1 if errs else 0

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
