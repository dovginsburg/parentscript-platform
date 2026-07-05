#!/usr/bin/env python3
"""Tono coach interaction: type text, click coach, verify suggestions appear."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width":1280,"height":900})
    page = ctx.new_page()

    events = []
    page.on("request", lambda r: events.append({"k":"req","u":r.url[:200]}) if "/api/" in r.url else None)
    page.on("response", lambda r: events.append({"k":"resp","s":r.status,"u":r.url[:200]}) if "/api/" in r.url else None)
    page.on("pageerror", lambda e: events.append({"k":"err","msg":str(e)[:300]}))

    page.goto("https://tonoit.com/", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(3000)

    # find textarea
    ta = page.locator("textarea").first
    ta.fill("I need that report by end of day")
    page.screenshot(path=str(OUT/"screenshots/tono-coach-before.png"))
    # click coach button
    coach_btn = page.get_by_role("button", name="coach").first
    coach_btn.click()
    page.wait_for_timeout(8000)
    page.screenshot(path=str(OUT/"screenshots/tono-coach-after.png"))
    print(f"Final URL: {page.url}")
    print(f"Snippet: {page.evaluate('() => document.body.innerText')[:600]}")
    print(f"\nAPI events: {len(events)}")
    for e in events[:20]:
        print(f"  {e}")
    b.close()