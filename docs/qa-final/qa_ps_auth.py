#!/usr/bin/env python3
"""PS auth flows: login wrong creds, signup bad email, reset-password token check."""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")

results = {}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)

    # ---- wrong creds on /app/login ----
    try:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        page.goto("https://parentscript.app/app/login", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(1500)
        page.fill('input[type=email]', f'qa_{int(time.time())}@example.com')
        page.fill('input[type=password]', 'BadPass123!')
        page.get_by_role("button", name="Sign in").click()
        page.wait_for_timeout(3000)
        results["ps_login_wrong"] = {
            "url": page.url,
            "title": page.title(),
            "snippet": page.evaluate("() => document.body.innerText.slice(0, 500)"),
        }
        ctx.close()
    except Exception as e:
        results["ps_login_wrong_error"] = str(e)[:300]

    # ---- reset-password with token ----
    try:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        page.goto("https://parentscript.app/app/reset-password#access_token=fake&type=recovery", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2000)
        results["ps_reset_with_token"] = {
            "url": page.url,
            "title": page.title(),
            "snippet": page.evaluate("() => document.body.innerText.slice(0, 500)"),
        }
        page.screenshot(path=str(OUT/"screenshots/ps-reset-with-token.png"))
        ctx.close()
    except Exception as e:
        results["ps_reset_with_token_error"] = str(e)[:300]

    # ---- signup with mismatched/weak password ----
    try:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        page.goto("https://parentscript.app/app/signup", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(1500)
        page.fill('input[type=email]', f'qa_{int(time.time())}@example.com')
        page.fill('input[type=password]', '123')
        page.get_by_role("button", name="Create account").click()
        page.wait_for_timeout(3000)
        results["ps_signup_weak"] = {
            "url": page.url,
            "snippet": page.evaluate("() => document.body.innerText.slice(0, 500)"),
        }
        ctx.close()
    except Exception as e:
        results["ps_signup_weak_error"] = str(e)[:300]

    # ---- signup form layout ----
    try:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        page.goto("https://parentscript.app/app/signup", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
        # check if there's a "I am a parent" vs "I am a therapist" distinction
        radio_check = page.evaluate("""() => {
            const radios = Array.from(document.querySelectorAll('input[type=radio], [role=radio]'));
            const labels = Array.from(document.querySelectorAll('label')).map(l => l.innerText.trim()).filter(Boolean);
            const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.innerText.trim()).filter(Boolean);
            return {radios: radios.map(r => r.value), labels, headings};
        }""")
        results["ps_signup_form"] = radio_check
        ctx.close()
    except Exception as e:
        results["ps_signup_form_error"] = str(e)[:300]

    # ---- /app/parent-login page ----
    try:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        page.goto("https://parentscript.app/app/parent-login", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2000)
        results["ps_parent_login"] = {
            "url": page.url,
            "title": page.title(),
            "snippet": page.evaluate("() => document.body.innerText.slice(0, 500)"),
            "screenshot": str(OUT/"screenshots/ps-parent-login.png"),
        }
        page.screenshot(path=str(OUT/"screenshots/ps-parent-login.png"))
        ctx.close()
    except Exception as e:
        results["ps_parent_login_error"] = str(e)[:300]

    # ---- /app/pricing full ----
    try:
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        page.goto("https://parentscript.app/app/pricing", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(2000)
        results["ps_pricing"] = {
            "url": page.url,
            "snippet": page.evaluate("() => document.body.innerText"),
            "screenshot": str(OUT/"screenshots/ps-pricing-full.png"),
        }
        page.screenshot(path=str(OUT/"screenshots/ps-pricing-full.png"), full_page=True)
        ctx.close()
    except Exception as e:
        results["ps_pricing_error"] = str(e)[:300]

    b.close()

(OUT/"ps-auth-results.json").write_text(json.dumps(results, indent=2, default=str))
print(json.dumps(results, indent=2)[:4000])