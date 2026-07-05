#!/usr/bin/env python3
"""
QA harness for Tono + ParentScript web apps.
Drives both sites with headless Chromium, captures screenshots,
collects console errors / network failures / meta tags / page text.
"""
import json, os, re, sys, time, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

DESKTOP = {"width": 1280, "height": 900}
MOBILE = {"width": 375, "height": 667}

PAGES = [
    # (name, url, viewport, app)
    ("tono-home-desktop",     "https://tonoit.com/",                       DESKTOP, "tono"),
    ("tono-home-mobile",      "https://tonoit.com/",                       MOBILE,  "tono"),
    ("tono-login-desktop",    "https://tonoit.com/login",                  DESKTOP, "tono"),
    ("tono-pricing-desktop",  "https://tonoit.com/pricing",                DESKTOP, "tono"),
    ("tono-account-desktop",  "https://tonoit.com/account",                DESKTOP, "tono"),

    ("ps-root-desktop",       "https://parentscript.app/",                 DESKTOP, "ps"),
    ("ps-login-desktop",      "https://parentscript.app/app/login",        DESKTOP, "ps"),
    ("ps-signup-desktop",     "https://parentscript.app/app/signup",       DESKTOP, "ps"),
    ("ps-reset-desktop",      "https://parentscript.app/app/reset-password", DESKTOP, "ps"),
    ("ps-parent-login",       "https://parentscript.app/app/parent-login", DESKTOP, "ps"),
    ("ps-pricing-desktop",    "https://parentscript.app/app/pricing",      DESKTOP, "ps"),
    ("ps-home-desktop",       "https://parentscript.app/app/",             DESKTOP, "ps"),
    ("ps-login-mobile",       "https://parentscript.app/app/login",        MOBILE,  "ps"),
]

def meta_snapshot(page):
    return page.evaluate("""() => {
        const get = (sel) => document.querySelector(sel)?.getAttribute(sel.startsWith('link') ? 'href' : 'content') ?? null;
        const og = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(m => og[m.getAttribute('property')] = m.getAttribute('content'));
        return {
            title: document.title,
            description: get('meta[name=description]'),
            themeColor: get('meta[name=theme-color]'),
            og,
            canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
            manifest: document.querySelector('link[rel=manifest]')?.href ?? null,
        };
    }""")

def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for name, url, vp, app in PAGES:
            entry = {"name": name, "url": url, "viewport": vp, "app": app,
                     "console_errors": [], "page_errors": [], "failed_requests": [],
                     "status": None, "final_url": None, "title": None, "meta": None,
                     "snippet": None, "screenshot": None}
            try:
                ctx = browser.new_context(viewport=vp, user_agent="Mozilla/5.0 QA-Harness")
                page = ctx.new_page()

                def on_console(msg):
                    if msg.type in ("error", "warning"):
                        entry["console_errors"].append(f"[{msg.type}] {msg.text[:300]}")
                def on_pageerror(exc):
                    entry["page_errors"].append(str(exc)[:500])
                def on_requestfailed(req):
                    entry["failed_requests"].append(f"{req.method} {req.url} -> {req.failure}")
                def on_response(resp):
                    if resp.status >= 400:
                        entry.setdefault("http_errors", []).append(f"{resp.status} {resp.url}")
                page.on("console", on_console)
                page.on("pageerror", on_pageerror)
                page.on("requestfailed", on_requestfailed)
                page.on("response", on_response)

                resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
                entry["status"] = resp.status if resp else None
                # let SPA hydrate
                page.wait_for_timeout(2500)
                entry["final_url"] = page.url
                entry["title"] = page.title()
                entry["meta"] = meta_snapshot(page)
                # capture a snippet of visible text
                txt = page.evaluate("() => document.body.innerText || ''")
                entry["snippet"] = (txt[:600] + ("…" if len(txt) > 600 else "")).strip()
                shot = SHOTS / f"{name}.png"
                page.screenshot(path=str(shot), full_page=False)
                entry["screenshot"] = str(shot)
            except Exception as e:
                entry["exception"] = f"{type(e).__name__}: {str(e)[:300]}"
                entry["trace"] = traceback.format_exc(limit=2).splitlines()[-6:]
            finally:
                try: ctx.close()
                except Exception: pass
            results.append(entry)
            print(f"[{entry['status']}] {name:30s} {url:55s} errs={len(entry['console_errors'])+len(entry['page_errors'])} fail={len(entry['failed_requests'])}")

        browser.close()

    out_json = OUT / "raw-results.json"
    out_json.write_text(json.dumps(results, indent=2, default=str))
    print(f"\nWrote {out_json}")

if __name__ == "__main__":
    main()