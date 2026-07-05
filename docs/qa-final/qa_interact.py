#!/usr/bin/env python3
"""
Third pass: test interactions.
- Tono: click Apple OAuth (cua-driver simulation), verify pop-up navigates to appleid.apple.com
- Tono: click Google OAuth, verify navigation
- Tono: /v1/analyze API call
- Tono: language switcher (click Spanish, verify text changes)
- PS: email/password signup with random email (verify error path, don't pollute DB)
- PS: email/password login with wrong creds (verify error)
- PS: check Supabase /auth/v1/signup endpoint reachable
"""
import json, urllib.request, urllib.parse, urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")

def http_post_json(url, body, headers=None):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type":"application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode()[:2000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:2000]
    except Exception as e:
        return -1, f"ERR: {e}"

def main():
    out = {}
    # ---- Tono analyze ----
    out["tono_analyze_warmer"] = http_post_json(
        "https://tonoit.com/api/v1/analyze",
        {"text": "hey, just checking in", "mode": "warmer", "locale": "en"}
    )
    out["tono_analyze_clearer"] = http_post_json(
        "https://tonoit.com/api/v1/analyze",
        {"text": "send me the report by friday", "mode": "clearer", "locale": "en"}
    )
    out["tono_analyze_funnier"] = http_post_json(
        "https://tonoit.com/api/v1/analyze",
        {"text": "I need that done today", "mode": "funnier", "locale": "en"}
    )
    out["tono_analyze_safer"] = http_post_json(
        "https://tonoit.com/api/v1/analyze",
        {"text": "what's the status", "mode": "safer", "locale": "en"}
    )
    out["tono_analyze_japanese"] = http_post_json(
        "https://tonoit.com/api/v1/analyze",
        {"text": "こんにちは", "mode": "warmer", "locale": "ja"}
    )
    out["tono_analyze_arabic"] = http_post_json(
        "https://tonoit.com/api/v1/analyze",
        {"text": "مرحبا", "mode": "warmer", "locale": "ar"}
    )

    # ---- Tono OAuth popups via Playwright ----
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width":1280,"height":900})
        page = ctx.new_page()
        try:
            page.goto("https://tonoit.com/login", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            # find Apple button by text
            apple_btn = page.get_by_role("button", name="continue with apple")
            with ctx.expect_page(timeout=10000) as new_page_info:
                apple_btn.click()
            popup = new_page_info.value
            popup.wait_for_load_state("domcontentloaded", timeout=10000)
            out["tono_apple_popup"] = {
                "url": popup.url,
                "title": popup.title(),
            }
            popup.close()
        except Exception as e:
            out["tono_apple_popup"] = {"error": str(e)[:300]}
        try:
            # fresh context to avoid cookies
            ctx.close()
            ctx = b.new_context(viewport={"width":1280,"height":900})
            page = ctx.new_page()
            page.goto("https://tonoit.com/login", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            google_btn = page.get_by_role("button", name="continue with google")
            with ctx.expect_page(timeout=10000) as new_page_info:
                google_btn.click()
            popup = new_page_info.value
            popup.wait_for_load_state("domcontentloaded", timeout=10000)
            out["tono_google_popup"] = {
                "url": popup.url,
                "title": popup.title(),
            }
            popup.close()
        except Exception as e:
            out["tono_google_popup"] = {"error": str(e)[:300]}

        # ---- Tono language switcher ----
        try:
            ctx.close()
            ctx = b.new_context(viewport={"width":1280,"height":900})
            page = ctx.new_page()
            page.goto("https://tonoit.com/", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            # capture original
            out["tono_lang_en_snippet"] = page.evaluate("() => document.body.innerText.slice(0, 400)")
            # look for lang switcher - find any select or button labeled with a language
            # click "Spanish" text if exposed
            try:
                sp = page.get_by_text("Spanish", exact=True).first
                sp.click()
                page.wait_for_timeout(1500)
                out["tono_lang_es_snippet"] = page.evaluate("() => document.body.innerText.slice(0, 400)")
            except Exception as e:
                out["tono_lang_es_error"] = str(e)[:200]
        except Exception as e:
            out["tono_lang_error"] = str(e)[:300]

        # ---- PS signup wrong creds ----
        try:
            ctx.close()
            ctx = b.new_context(viewport={"width":1280,"height":900})
            page = ctx.new_page()
            page.goto("https://parentscript.app/app/login", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            page.fill('input[type=email]', 'nonexistent_'+str(__import__('time').time())+'@example.com')
            page.fill('input[type=password]', 'WrongPass123!')
            page.get_by_role("button", name="Sign in").click()
            page.wait_for_timeout(3000)
            out["ps_login_wrong"] = {
                "url": page.url,
                "title": page.title(),
                "body_text_snippet": page.evaluate("() => document.body.innerText.slice(0, 400)"),
                "errors": page.evaluate("""() => Array.from(document.querySelectorAll('[role=alert],.error,.text-red-500,[class*=error]')).map(e => e.innerText).filter(Boolean)""")
            }
        except Exception as e:
            out["ps_login_wrong_error"] = str(e)[:300]

        # ---- PS signup page render check ----
        try:
            page.goto("https://parentscript.app/app/signup", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            out["ps_signup_render"] = {
                "url": page.url,
                "title": page.title(),
                "snippet": page.evaluate("() => document.body.innerText.slice(0, 500)"),
            }
        except Exception as e:
            out["ps_signup_render_error"] = str(e)[:300]

        b.close()

    (OUT / "interact-results.json").write_text(json.dumps(out, indent=2, default=str))
    print(f"Wrote {OUT/'interact-results.json'}")
    for k, v in out.items():
        if isinstance(v, tuple):
            print(f"  {k}: HTTP {v[0]}  body[:140]={v[1][:140]}")
        elif isinstance(v, dict):
            print(f"  {k}: {json.dumps(v)[:200]}")

if __name__ == "__main__":
    main()