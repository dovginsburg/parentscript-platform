#!/usr/bin/env python3
"""Check ALL builds across ALL processing states including FAILED/INVALID/PROCESSING."""
import time, jwt, urllib.request, json
KEY_ID='PSS5YP9VS4'; ISSUER_ID='93f12e0b-cd6e-4095-95a8-172311d722cd'
with open('/Users/Ezra/Projects/maze/ios/fastlane/AuthKey_PSS5YP9VS4.p8') as f: pk=f.read()
now=int(time.time())
tok=jwt.encode({'iss':ISSUER_ID,'iat':now,'exp':now+1200,'aud':'appstoreconnect-v1'},pk,algorithm='ES256',headers={'alg':'ES256','kid':KEY_ID,'typ':'JWT'})

H={'Authorization':f'Bearer {tok}'}
BASE='https://api.appstoreconnect.apple.com/v1'

states = ['PROCESSING','FAILED','INVALID','VALID']
total = 0
for s in states:
    r=urllib.request.Request(f'{BASE}/builds?filter%5Bapp%5D=6786011633&filter%5BprocessingState%5D={s}&limit=20',headers=H)
    try:
        d=json.loads(urllib.request.urlopen(r,timeout=30).read().decode())
        n=len(d.get('data',[]))
        total += n
        print(f"\n=== {s} ({n} builds) ===")
        for b in d.get('data',[]):
            a=b['attributes']
            print(f"  {a.get('uploadedDate')} | v{a.get('version')} | {a.get('processingState')} | {b['id']}")
    except Exception as e:
        print(f"{s}: ERROR {e}")
print(f"\nTOTAL across states: {total}")

# Also check pre-release versions
print("\n=== Pre-release versions for app ===")
r=urllib.request.Request(f'{BASE}/preReleaseVersions?filter%5Bapp%5D=6786011633&limit=20',headers=H)
d=json.loads(urllib.request.urlopen(r,timeout=30).read().decode())
for v in d.get('data',[]):
    a=v['attributes']
    print(f"  preReleaseVersion={a.get('version')} | platform={a.get('platform')} | created={a.get('createdDate')} | id={v['id']}")