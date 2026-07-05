#!/usr/bin/env python3
"""
Second-pass QA: probe OAuth buttons, test interactions, capture richer evidence.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")
SHOTS = OUT / "screenshots"

def find_oauth_buttons(page):
    """Return all clickable elements that look like OAuth provider buttons."""
    return page.evaluate("""() => {
        const text = (el) => (el.innerText || el.textContent || '').trim().toLowerCase();
        const isVisible = (el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
        };
        const all = Array.from(document.querySelectorAll('button, a, [role=button], div[class*=oauth] div, div[class*=google] div, div[class*=apple] div'));
        const out = [];
        for (const el of all) {
            if (!isVisible(el)) continue;
            const t = text(el);
            if (!t || t.length > 80) continue;
            if (/(apple|google|github|facebook|twitter|microsoft|oauth|continue with|sign in with|sign up with)/.test(t)) {
                out.push({tag: el.tagName, text: t.slice(0, 80), html: el.outerHTML.slice(0, 300)});
            }
        }
        return out;
    }""")

def find_forms(page):
    return page.evaluate("""() => {
        return Array.from(document.querySelectorAll('form')).map(f => ({
            action: f.action, method: f.method,
            inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({name: i.name, type: i.type, placeholder: i.placeholder, required: i.required, autocomplete: i.autocomplete}))
        }));
    }""")

def find_broken(page):
    return page.evaluate("""() => {
        return Array.from(document.querySelectorAll('img')).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src);
    }""")

def main():
    out = []
    targets = [
        ("tono-login",  "https://tonoit.com/login",                 {"width":1280,"height":900}),
        ("tono-home",   "https://tonoit.com/",                      {"width":1280,"height":900}),
        ("ps-login",    "https://parentscript.app/app/login",       {"width":1280,"height":900}),
        ("ps-signup",   "https://parentscript.app/app/signup",      {"width":1280,"height":900}),
        ("ps-parent",   "https://parentscript.app/app/parent-login",{"width":1280,"height":900}),
        ("ps-reset",    "https://parentscript.app/app/reset-password", {"width":1280,"height":900}),
        ("ps-pricing",  "https://parentscript.app/app/pricing",     {"width":1280,"height":900}),
        ("ps-home",     "https://parentscript.app/app/",            {"width":1280,"height":900}),
    ]
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for name, url, vp in targets:
            entry = {"name": name, "url": url, "oauth_buttons": [], "forms": [], "broken_images": []}
            ctx = b.new_context(viewport=vp)
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)[:300]))
            page.on("console", lambda m: errors.append(f"[{m.type}] {m.text[:300]}") if m.type == "error" else None)
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(1500)
                entry["oauth_buttons"] = find_oauth_buttons(page)
                entry["forms"] = find_forms(page)
                entry["broken_images"] = find_broken(page)
                entry["errors"] = errors[:10]
                shot = SHOTS / f"deep-{name}.png"
                page.screenshot(path=str(shot), full_page=True)
                entry["screenshot"] = str(shot)
                # try a hover on language switcher if it exists
            except Exception as e:
                entry["exception"] = str(e)[:300]
            finally:
                ctx.close()
            out.append(entry)
            print(f"{name}: oauth={len(entry['oauth_buttons'])} forms={len(entry['forms'])} broken_img={len(entry['broken_images'])} errs={len(entry.get('errors',[]))}")
        b.close()
    (OUT / "deep-results.json").write_text(json.dumps(out, indent=2))
    print(f"\nWrote {OUT/'deep-results.json'}")

if __name__ == "__main__":
    main()