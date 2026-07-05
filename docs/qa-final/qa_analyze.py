#!/usr/bin/env python3
"""Tono analyze API + language switcher."""
import json, urllib.request, urllib.error

OUT = "/Users/Ezra/Projects/parentscript/docs/qa-final/analyze-results.json"

def post(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Content-Type":"application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()[:3000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:3000]
    except Exception as e:
        return -1, f"ERR: {type(e).__name__}: {e}"

cases = [
    ("warmer",  "hey just checking in, you free?",                              "en"),
    ("clearer", "send me the report by friday",                                  "en"),
    ("funnier", "I need that done today",                                        "en"),
    ("safer",   "what's the status",                                             "en"),
    ("warmer",  "hola amigo, como estas?",                                       "es"),
    ("warmer",  "こんにちは元気ですか",                                            "ja"),
    ("warmer",  "مرحبا كيف حالك",                                                "ar"),
    ("warmer",  "bonjour comment ça va",                                         "fr"),
    ("warmer",  "olá tudo bem",                                                  "pt"),
    ("warmer",  "hallo wie geht es dir",                                         "de"),
]
out = {}
for mode, text, locale in cases:
    out[f"{locale}/{mode}"] = post("https://tonoit.com/api/analyze",
                                    {"text": text, "mode": mode, "locale": locale})
    print(f"{locale}/{mode}: HTTP {out[f'{locale}/{mode}'][0]}")

with open(OUT, "w") as f:
    json.dump(out, f, indent=2)
print(f"\nWrote {OUT}")