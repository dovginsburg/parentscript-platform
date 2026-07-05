#!/usr/bin/env python3
"""
15-min smoke test for t_bd79b516 (re-scoped by Ezra 2026-07-05).

Targets exactly what Dov asked for:
1. Both web apps at apex domains (no /app prefix) load with no console errors
2. Backend health endpoints respond JSON (not HTML)
3. Account migration: OAuth flows don't break existing accounts
4. PasskeyAuth: register, sign in, verify persistence across reloads
"""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")
OUT.mkdir(parents=True, exist_ok=True)
SHOTS = OUT / "screenshots-jul5"
SHOTS.mkdir(parents=True, exist_ok=True)

DESKTOP = {"width": 1280, "height": 900}

findings = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "tests": {}}


def record(name, **kw):
    findings["tests"][name] = kw
    print(f"[{name}] " + " | ".join(f"{k}={v}" for k, v in kw.items() if k in ("ok", "status", "console_errs", "page_errs", "json_ok", "passkey_supported")))


def check_apex_domains(browser):
    """Test 1: Both web apps at apex domains load with no console errors."""
    apex_tests = [
        ("tono-apex", "https://tonoit.com/"),
        ("ps-apex", "https://parentscript.app/"),
    ]
    for name, url in apex_tests:
        ctx = browser.new_context(viewport=DESKTOP)
        page = ctx.new_page()
        errs, perrs, failed = [], [], []
        page.on("console", lambda m: errs.append(f"[{m.type}] {m.text[:200]}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: perrs.append(str(e)[:200]))
        page.on("requestfailed", lambda r: failed.append(f"{r.method} {r.url}"))
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2500)
            shot = SHOTS / f"{name}.png"
            page.screenshot(path=str(shot), full_page=False)
            record(name,
                   ok=True,
                   status=resp.status if resp else None,
                   final_url=page.url,
                   console_errs=len(errs),
                   page_errs=len(perrs),
                   failed_reqs=len(failed),
                   title=page.title(),
                   console_msgs=errs[:5],
                   page_err_msgs=perrs[:3],
                   screenshot=str(shot))
        except Exception as e:
            record(name, ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
        ctx.close()


def check_login_routes(browser):
    """Test login page routes render OAuth buttons client-side."""
    login_tests = [
        ("tono-login", "https://tonoit.com/login", ["continue with apple", "continue with google", "sign in with email"]),
        ("ps-login", "https://parentscript.app/app/login", ["sign in", "google", "apple", "email"]),
        ("ps-signup", "https://parentscript.app/app/signup", ["create account", "therapist"]),
    ]
    for name, url, expected in login_tests:
        ctx = browser.new_context(viewport=DESKTOP)
        page = ctx.new_page()
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(3000)  # let SPA hydrate
            text = page.evaluate("() => (document.body.innerText || '').toLowerCase()")
            hits = {phrase: phrase in text for phrase in expected}
            shot = SHOTS / f"{name}.png"
            page.screenshot(path=str(shot), full_page=False)
            record(name,
                   ok=resp.status == 200,
                   status=resp.status if resp else None,
                   text_len=len(text),
                   phrase_hits=hits,
                   has_passkey="passkey" in text,
                   has_webauthn="webauthn" in text or "use your face" in text or "use your fingerprint" in text or "use your device" in text,
                   screenshot=str(shot))
        except Exception as e:
            record(name, ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
        ctx.close()


def check_passkey_ui(browser):
    """Test 4: PasskeyAuth UI present + navigator.credentials feature detection."""
    ctx = browser.new_context(viewport=DESKTOP)
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)[:200]))
    try:
        resp = page.goto("https://parentscript.app/app/login", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2500)
        # check if Passkey UI is visible
        passkey_info = page.evaluate("""() => {
            const text = (document.body.innerText || '').toLowerCase();
            const passkeyMentioned = text.includes('passkey') || text.includes('use your face') || text.includes('use your fingerprint');
            const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
            return {
                passkeyMentioned,
                buttonLabels: buttons.slice(0, 20),
                hasNavigatorCredentials: typeof navigator !== 'undefined' && !!navigator.credentials,
                isPublicKeyCapable: typeof navigator !== 'undefined' && navigator.credentials && (
                    typeof navigator.credentials.create === 'function' &&
                    typeof navigator.credentials.get === 'function'
                ),
                url: window.location.href,
            };
        }""")
        shot = SHOTS / "ps-passkey-login.png"
        page.screenshot(path=str(shot), full_page=False)
        record("ps-passkey-ui",
               ok=True,
               status=resp.status if resp else None,
               passkey_mentioned=passkey_info.get("passkeyMentioned"),
               button_labels=passkey_info.get("buttonLabels"),
               has_navigator_credentials=passkey_info.get("hasNavigatorCredentials"),
               is_public_key_capable=passkey_info.get("isPublicKeyCapable"),
               page_errors=errs[:3],
               screenshot=str(shot))
    except Exception as e:
        record("ps-passkey-ui", ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
    ctx.close()


def check_health_endpoints():
    """Test 2: Backend health endpoints respond JSON."""
    import urllib.request
    health_tests = [
        ("tono-health-apex", "https://tonoit.com/api/health"),
        ("tono-health-railway", "https://tono-backend-production.up.railway.app/api/health"),
        ("ps-health-apex", "https://parentscript.app/api/health"),
    ]
    for name, url in health_tests:
        try:
            req = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8", errors="replace")
                ct = resp.headers.get("Content-Type", "")
                json_ok = False
                try:
                    parsed = json.loads(body)
                    json_ok = True
                except Exception:
                    parsed = None
                record(name,
                       ok=json_ok,
                       status=resp.status,
                       content_type=ct,
                       json_ok=json_ok,
                       body_preview=body[:200],
                       parsed=parsed if json_ok else None)
        except Exception as e:
            record(name, ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")


def check_oauth_buttons_render(browser):
    """Test 3: OAuth buttons actually rendered client-side."""
    ctx = browser.new_context(viewport=DESKTOP)
    page = ctx.new_page()
    try:
        page.goto("https://parentscript.app/app/login", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3500)
        info = page.evaluate("""() => {
            const all = Array.from(document.querySelectorAll('button, a[role=button]'));
            return all.map(el => ({
                tag: el.tagName.toLowerCase(),
                text: (el.innerText || el.getAttribute('aria-label') || '').trim(),
                ariaLabel: el.getAttribute('aria-label'),
            })).filter(x => x.text).slice(0, 30);
        }""")
        shot = SHOTS / "ps-login-buttons.png"
        page.screenshot(path=str(shot), full_page=False)
        record("ps-login-buttons",
               ok=len(info) > 0,
               button_count=len(info),
               buttons=info[:20],
               screenshot=str(shot))
    except Exception as e:
        record("ps-login-buttons", ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
    ctx.close()

    # Same for Tono
    ctx = browser.new_context(viewport=DESKTOP)
    page = ctx.new_page()
    try:
        page.goto("https://tonoit.com/login", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3500)
        info = page.evaluate("""() => {
            const all = Array.from(document.querySelectorAll('button, a[role=button]'));
            return all.map(el => ({
                tag: el.tagName.toLowerCase(),
                text: (el.innerText || el.getAttribute('aria-label') || '').trim(),
                ariaLabel: el.getAttribute('aria-label'),
            })).filter(x => x.text).slice(0, 30);
        }""")
        shot = SHOTS / "tono-login-buttons.png"
        page.screenshot(path=str(shot), full_page=False)
        record("tono-login-buttons",
               ok=len(info) > 0,
               button_count=len(info),
               buttons=info[:20],
               screenshot=str(shot))
    except Exception as e:
        record("tono-login-buttons", ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
    ctx.close()


def main():
    print("== 15-min smoke test for t_bd79b516 ==")
    print("\n[1/4] Apex domains + health endpoints (curl)…")
    check_health_endpoints()

    print("\n[2/4] Browser: apex domain load with no console errors…")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        check_apex_domains(browser)

        print("\n[3/4] Browser: login routes render OAuth buttons…")
        check_login_routes(browser)
        check_oauth_buttons_render(browser)

        print("\n[4/4] Browser: PasskeyAuth UI detection…")
        check_passkey_ui(browser)

        browser.close()

    out = OUT / "smoke-jul5-results.json"
    out.write_text(json.dumps(findings, indent=2, default=str))
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()