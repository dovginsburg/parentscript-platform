#!/usr/bin/env python3
"""Tono language switcher - uses native <select>."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")

def capture(page, label):
    txt = page.evaluate("() => document.body.innerText")[:250]
    html_dir = page.evaluate("() => document.documentElement.dir || ''")
    val = page.evaluate("() => { const s = document.querySelector('select'); return s ? s.value : ''; }")
    print(f"  {label:10s} dir={html_dir!r}  <select>.value={val!r}  text[:120]={txt[:120]!r}")
    page.screenshot(path=str(OUT/f"screenshots/tono-lang-{label}.png"))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width":1280,"height":900})
    page = ctx.new_page()
    page.goto("https://tonoit.com/", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(2500)
    capture(page, "en")

    # find the select
    sel = page.locator("select").first
    options = sel.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
    print(f"Options: {options}")

    for lang_code, lang_label in [("es","Spanish"), ("ja","Japanese"), ("ar","Arabic"), ("fr","French")]:
        try:
            sel.select_option(value=lang_code)
            page.wait_for_timeout(1500)
            capture(page, lang_code)
        except Exception as e:
            print(f"  {lang_label}: error {str(e)[:120]}")

    b.close()