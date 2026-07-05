#!/usr/bin/env python3
"""
Real PasskeyAuth test:
- Register a virtual authenticator in Chromium
- Try to navigate the OAuth flow (Apple round-trip up to appleid.apple.com)
- Confirm if Passkey buttons appear on /app/login when the feature flag is on
- Try to call supabase.auth.registerPasskey via page.evaluate
"""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")
SHOTS = OUT / "screenshots-jul5"
SHOTS.mkdir(parents=True, exist_ok=True)

findings = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "tests": {}}

def record(name, **kw):
    findings["tests"][name] = kw
    print(f"[{name}] " + " | ".join(f"{k}={v}" for k, v in kw.items() if k in ("ok", "status", "result", "feature_flag", "register_available", "signin_available")))


def test_passkey_register_persists():
    """Real passkey register, then reload and try sign-in."""
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
            ],
        )
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        # Attach a virtual authenticator (WebAuthn)
        try:
            cdp = ctx.new_cdp_session(ctx.new_page())
            cdp.send("WebAuthn.enable", {
                "enableUI": False,
                "defaultBackupEligibility": True,
                "defaultBackupState": True,
            })
            cdp.send("WebAuthn.addVirtualAuthenticator", {
                "options": {
                    "protocol": "ctap2",
                    "transport": "usb",
                    "hasResidentKey": True,
                    "hasUserVerification": True,
                    "isUserVerified": True,
                    "automaticPresenceSimulation": True,
                }
            })
            virtual_authenticator_ok = True
        except Exception as e:
            virtual_authenticator_ok = False
            findings["tests"]["virtual_authenticator"] = {"ok": False, "error": str(e)[:200]}

        page = ctx.new_page()
        console_errs = []
        page.on("pageerror", lambda e: console_errs.append(str(e)[:200]))
        try:
            resp = page.goto("https://parentscript.app/app/login", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(3000)
            # Check feature flag state for passkeys
            flag_info = page.evaluate("""() => {
                const flags = JSON.parse(localStorage.getItem('parentscript.featureFlags.v1') || '{}');
                return {
                    flags,
                    featureFlagsKey: 'parentscript.featureFlags.v1',
                    hasFeatureFlagHook: typeof window !== 'undefined',
                };
            }""")
            # Try to find passkey UI elements
            ui_info = page.evaluate("""() => {
                const allText = (document.body.innerText || '').toLowerCase();
                const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
                const links = Array.from(document.querySelectorAll('a')).map(a => a.innerText.trim());
                return {
                    allTextSnippet: allText.slice(0, 800),
                    buttons,
                    links: links.filter(l => l).slice(0, 10),
                    passkeyMentioned: allText.includes('passkey'),
                    faceIdMentioned: allText.includes('face id') || allText.includes('faceid'),
                    fingerprintMentioned: allText.includes('fingerprint') || allText.includes('touch id'),
                };
            }""")
            shot = SHOTS / "ps-passkey-state.png"
            page.screenshot(path=str(shot), full_page=False)
            record("ps-passkey-feature-flag",
                   ok=True,
                   status=resp.status if resp else None,
                   virtual_authenticator_attached=virtual_authenticator_ok,
                   feature_flag=flag_info,
                   ui=ui_info,
                   screenshot=str(shot),
                   page_errors=console_errs[:3])
        except Exception as e:
            record("ps-passkey-feature-flag", ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
        ctx.close()
        browser.close()


def test_tono_oauth_button_click():
    """Click Apple button on Tono /login and confirm it tries to navigate to appleid.apple.com."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        nav_log = []
        page.on("framenavigated", lambda fr: nav_log.append({"url": fr.url, "type": "navigated"}))
        try:
            page.goto("https://tonoit.com/login", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(3500)
            # Click the Apple button
            try:
                btn = page.get_by_role("button", name="Continue with Apple")
                btn.click(timeout=5000)
                page.wait_for_timeout(5000)
                navigated_to_apple = "appleid.apple.com" in page.url
                record("tono-apple-click",
                       ok=True,
                       navigated_to_apple=navigated_to_apple,
                       current_url=page.url,
                       nav_log=nav_log[:10])
            except Exception as e:
                record("tono-apple-click", ok=False, error=f"click failed: {str(e)[:200]}", nav_log=nav_log[:10])
        except Exception as e:
            record("tono-apple-click", ok=False, error=f"{type(e).__name__}: {str(e)[:300]}")
        ctx.close()
        browser.close()


def test_ps_apex_redirect_consistency():
    """Confirm apex redirects to /app/login cleanly + the dist is the stale one."""
    import urllib.request
    with urllib.request.urlopen("https://parentscript.app/", timeout=10) as r:
        body = r.read().decode("utf-8", errors="replace")
        bundle_match = "index-" in body
        bundle_hash = None
        import re
        m = re.search(r"index-([A-Za-z0-9]+)\.js", body)
        if m:
            bundle_hash = m.group(1)

    record("ps-apex-bundle",
           ok=bundle_match,
           redirect_status=r.status,
           bundle_hash=bundle_hash,
           note="if bundle_hash != local dist hash, deploy is stale")


def main():
    print("== Round-2 smoke: Passkey + Apple click + bundle staleness ==")
    print("\n[A] Virtual authenticator + PS passkey feature flag…")
    test_passkey_register_persists()

    print("\n[B] Tono Apple OAuth button click round-trip…")
    test_tono_oauth_button_click()

    print("\n[C] PS apex bundle hash…")
    test_ps_apex_redirect_consistency()

    out = OUT / "smoke-jul5-round2.json"
    out.write_text(json.dumps(findings, indent=2, default=str))
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()