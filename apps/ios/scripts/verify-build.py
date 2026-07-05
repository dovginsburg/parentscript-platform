#!/usr/bin/env python3
"""Verify ParentScript build 4 made it to TestFlight via ASC API.
Uses AuthKey_PSS5YP9VS4.p8 directly. Does NOT touch /tmp/tono-export."""
import sys, json, time, jwt, urllib.request

KEY_ID = "PSS5YP9VS4"
ISSUER_ID = "93f12e0b-cd6e-4095-95a8-172311d722cd"
APP_ID = "6786011633"
P8_PATH = "/Users/Ezra/Projects/maze/ios/fastlane/AuthKey_PSS5YP9VS4.p8"
BASE = "https://api.appstoreconnect.apple.com/v1"

with open(P8_PATH) as f:
    private_key = f.read()

now = int(time.time())
token = jwt.encode(
    {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
    private_key,
    algorithm="ES256",
    headers={"alg": "ES256", "kid": KEY_ID, "typ": "JWT"},
)

def req(path):
    r = urllib.request.Request(BASE + path, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(r, timeout=30) as resp:
        return json.loads(resp.read().decode())

# Poll for the just-uploaded build
print("=== Recent builds for app 6786011633 (com.parentscript.app) ===")
data = req(f"/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=5")
for b in data.get("data", []):
    a = b["attributes"]
    print(f"  uploadedDate: {a.get('uploadedDate')}")
    print(f"  version:      {a.get('version')}")
    print(f"  buildNumber:  {a.get('buildNumber','?')}")
    print(f"  processingState: {a.get('processingState')}")
    print(f"  expired:      {a.get('expired')}")
    print(f"  id:           {b['id']}")
    print(f"  ---")