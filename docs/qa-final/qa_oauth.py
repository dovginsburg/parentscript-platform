#!/usr/bin/env python3
"""
Quick OAuth popup probe — no other interactions to avoid hangs.
Just verify Apple/Google buttons open a popup pointing at the right IdP.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

OUT = Path("/Users/Ezra/Projects/parentscript/docs/qa-final")

def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)

        # ---- Tono Apple OAuth ----
        try:
            ctx = b.new_context(viewport={"width":1280,"height":900})
            page = ctx.new_page()
            page.goto("https://tonoit.com/login", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(1500)
            apple_btn = page.get_by_role("button", name="continue with apple")
            try:
                with ctx.expect_page(timeout=8000) as np:
                    apple_btn.click()
                popup = np.value
                popup.wait_for_load_state("domcontentloaded", timeout=8000)
                out["tono_apple_popup"] = {"url": popup.url, "title": popup.title()}
                popup.close()
            except PWTimeout:
                out["tono_apple_popup"] = {"error": "no popup opened (timeout)"}
            ctx.close()
        except Exception as e:
            out["tono_apple_popup"] = {"error": str(e)[:300]}

        # ---- Tono Google OAuth ----
        try:
            ctx = b.new_context(viewport={"width":1280,"height":900})
            page = ctx.new_page()
            page.goto("https://tonoit.com/login", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(1500)
            google_btn = page.get_by_role("button", name="continue with google")
            try:
                with ctx.expect_page(timeout=8000) as np:
                    google_btn.click()
                popup = np.value
                popup.wait_for_load_state("domcontentloaded", timeout=8000)
                out["tono_google_popup"] = {"url": popup.url, "title": popup.title()}
                popup.close()
            except PWTimeout:
                out["tono_google_popup"] = {"error": "no popup opened (timeout)"}
            ctx.close()
        except Exception as e:
            out["tono_google_popup"] = {"error": str(e)[:300]}

        b.close()
    (OUT / "oauth-results.json").write_text(json.dumps(out, indent=2, default=str))
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()