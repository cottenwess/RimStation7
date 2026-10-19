"""Shared Playwright helpers for Rim Station 7 smoke tests.

The game exposes a debug handle at window.__hb for tests (S, genSpecimen, placeSpecimen, ...).
"""
import os

GAME = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist', 'rim-station-7.html'))
SHOTS = os.path.abspath(os.path.join(os.path.dirname(__file__), 'screenshots'))


async def clear(pg, n=14):
    """Click through any open dialog boxes, taking the first choice when one is offered."""
    for _ in range(n):
        if await pg.is_visible('#dlg'):
            ch = pg.locator('#dlgChoices button')
            if await ch.count() and await ch.first.is_visible():
                await ch.first.click()
            else:
                await pg.click('#dlg')
        await pg.wait_for_timeout(70)


# The failsafe ladder, cheapest first. Each rung is capped at a breach stage
# (lock at 1, seal and vent at 2, detach at 3), so a breach that escalates can
# only be answered from further down: a harness that stops at vent deadlocks on
# a stage-3 breach with the overlay swallowing every other click.
FAILSAFES = ['lock', 'seal', 'vent', 'detach', 'scuttle']


async def handle_breach(pg):
    for _ in range(12):
        if not await pg.is_visible('#breach') or await pg.is_visible('#end'):
            return
        for f in FAILSAFES:
            b = pg.locator(f'[data-act="fs:{f}"]')
            if await b.count() and not await b.is_disabled():
                await b.click()
                break
        await pg.wait_for_timeout(200)
        await clear(pg)


async def step(pg):
    await clear(pg, 4)
    if await pg.is_visible('#breach'):
        print('BREACH')
        await handle_breach(pg)
    if await pg.is_visible('#report'):
        print('T1 REPORT')
        await pg.click('[data-act="report-publish"]')


async def until(pg, cond, n=300):
    for _ in range(n):
        await pg.wait_for_timeout(200)
        await step(pg)
        if await pg.is_visible('#end'):
            print('ENDED')
            return False
        if await cond():
            return True
    return False


async def plan_day(pg):
    """Drag the first available card onto a lane, then add the rest with the + buttons."""
    await clear(pg)
    tray = pg.locator('#planner .tcard')
    if await tray.count():
        card = tray.nth(0)
        lanes = pg.locator('#planner .prow:not(.pload) .ptrack')
        before = await pg.locator('#planner .pblk').count()
        for li in range(await lanes.count()):
            cb = await card.bounding_box()
            lb = await lanes.nth(li).bounding_box()
            await pg.mouse.move(cb['x'] + 20, cb['y'] + 10)
            await pg.mouse.down()
            await pg.mouse.move(lb['x'] + lb['width'] * 0.12, lb['y'] + lb['height'] / 2, steps=6)
            await pg.mouse.up()
            await pg.wait_for_timeout(150)
            await clear(pg, 2)
            if await pg.locator('#planner .pblk').count() > before:
                break
            if await pg.locator('#planner .tcard').count() == 0:
                break
            card = pg.locator('#planner .tcard').nth(0)
    for _ in range(6):
        adds = pg.locator('#planner .tcard .tadd')
        if await adds.count() == 0:
            break
        await adds.nth(0).click()
        await pg.wait_for_timeout(120)
        if await pg.is_visible('#study'):
            b = pg.locator('#study [data-act="begin"]')
            if await b.is_disabled():
                await pg.click('#study [data-act="study-close"]')
                break
            await b.click()
            await pg.wait_for_timeout(120)
        await clear(pg, 2)
