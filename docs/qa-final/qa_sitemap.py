#!/usr/bin/env python3
"""Capture parent signup, security, privacy, full sitemap."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")
SHOTS = OUT/"screenshots"

PAGES = [
    ("ps-parent-signup",  "https://parentscript.app/app/parent-signup"),
    ("ps-security",       "https://parentscript.app/app/security"),
    ("ps-privacy",        "https://parentscript.app/app/privacy"),
    ("ps-reset-notoken",  "https://parentscript.app/app/reset-password"),
    ("ps-404",            "https://parentscript.app/app/this-page-does-not-exist"),
    ("tono-404",          "https://tonoit.com/this-page-does-not-exist"),
]

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    for name, url in PAGES:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)[:200]))
        page.on("response", lambda r: errors.append(f"{r.status} {r.url[:120]}") if r.status >= 400 and 'favicon' not in r.url else None)
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(2000)
            shot = SHOTS/f"{name}.png"
            page.screenshot(path=str(shot), full_page=True)
            print(f"[{resp.status if resp else '??'}] {name:30s} -> {page.url[:60]}  errs={len(errors)}")
        except Exception as e:
            print(f"[ERR] {name}: {e}")
        ctx.close()
    b.close()