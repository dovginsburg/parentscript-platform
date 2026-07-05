#!/usr/bin/env python3
"""Deeper Tono coach probe: capture all console, wait for hydration."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width":1280,"height":900})
    page = ctx.new_page()
    log = []
    page.on("console", lambda m: log.append(f"[{m.type}] {m.text[:300]}"))
    page.on("pageerror", lambda e: log.append(f"[err] {str(e)[:300]}"))
    page.on("requestfailed", lambda r: log.append(f"[fail] {r.method} {r.url[:150]} {r.failure}"))
    page.on("response", lambda r: log.append(f"[{r.status}] {r.url[:150]}") if "/api/" in r.url or r.status >= 400 else None)

    page.goto("https://tonoit.com/", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(5000)  # generous wait for hydration

    # verify hydration status
    hydrated = page.evaluate("() => document.querySelector('[data-hydrated]') !== null || !!window.React")
    print(f"Hydration marker: {hydrated}")

    # find textarea and check value
    ta = page.locator("textarea").first
    print(f"Textarea count: {page.locator('textarea').count()}")
    print(f"Textarea HTML: {ta.evaluate('e => e.outerHTML')[:300]}")

    ta.fill("I need that report by end of day")
    page.wait_for_timeout(500)
    print(f"After fill, textarea value: {ta.input_value()!r}")

    coach_btn = page.get_by_role("button", name="coach").first
    print(f"Coach button HTML: {coach_btn.evaluate('e => e.outerHTML')[:300]}")
    print(f"Coach button disabled: {coach_btn.is_disabled()}")
    coach_btn.click()
    page.wait_for_timeout(10000)

    # any new content?
    body_text = page.evaluate("() => document.body.innerText")
    has_suggestions = "warmer" in body_text.lower() or "clearer" in body_text.lower() or "suggest" in body_text.lower()
    print(f"\nBody text after click: {body_text[:500]}")
    print(f"Has suggestion keywords: {has_suggestions}")

    print(f"\n=== Console log ({len(log)} entries) ===")
    for entry in log:
        print(f"  {entry}")

    b.close()