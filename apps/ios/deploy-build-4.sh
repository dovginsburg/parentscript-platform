#!/usr/bin/env bash
# deploy-build-4.sh — Finish the ParentScript build 4 deployment.
# USAGE: bash deploy-build-4.sh
# Prereq: login.keychain-db is unlocked (run `security unlock-keychain -p "<pwd>" ~/Library/Keychains/login.keychain-db`)
set -euo pipefail

cd "$(dirname "$0")"

# 1. (re)build dist with the fixed vite config (relative base)
echo "▶ Rebuilding dist/ with base='./' (relative)..."
cd ..
npm run build 2>&1 | tail -10

# 2. Re-sync Capacitor (must run from project root so npx cap finds capacitor.config.ts)
echo "▶ cap sync ios..."
npx cap sync ios 2>&1 | tail -5

cd ios

# 3. Archive (this is where keychain unlock matters)
ARCHIVE=/Users/Ezra/Library/Developer/Xcode/Archives/2026-06-30/ParentScript-2.xcarchive
echo "▶ xcodebuild archive → $ARCHIVE"
mkdir -p "$(dirname "$ARCHIVE")"
xcodebuild -project App/App.xcodeproj -scheme App -configuration Release \
  -archivePath "$ARCHIVE" \
  archive 2>&1 | tail -20

# 4. Export IPA
echo "▶ xcodebuild -exportArchive → ./build/"
mkdir -p ./build
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist ./fastlane/ExportOptions.plist \
  -exportPath ./build \
  -allowProvisioningUpdates 2>&1 | tail -20

echo "▶ IPA at: $(ls ./build/*.ipa)"

# 5. Upload to TestFlight via ASC API.
# NOTE: fastlane pilot forces Apple-ID password login in non-interactive shells,
#       even with API-key env vars present. Use `xcrun altool --upload-package`
#       instead — it honors --apiKey/--apiIssuer natively and runs unattended.
export APP_STORE_CONNECT_API_KEY_KEY_ID="${APP_STORE_CONNECT_API_KEY_KEY_ID:-PSS5YP9VS4}"
export APP_STORE_CONNECT_API_KEY_ISSUER_ID="${APP_STORE_CONNECT_API_KEY_ISSUER_ID:-93f12e0b-cd6e-4095-95a8-172311d722cd}"
export APP_STORE_CONNECT_API_KEY_KEY_FILEPATH="${APP_STORE_CONNECT_API_KEY_KEY_FILEPATH:-$(pwd)/fastlane/AuthKey_PSS5YP9VS4.p8}"

echo "▶ xcrun altool --upload-package (API key auth)..."
xcrun altool --upload-package "./build/App.ipa" -t ios \
  --apiKey "$APP_STORE_CONNECT_API_KEY_KEY_ID" \
  --apiIssuer "$APP_STORE_CONNECT_API_KEY_ISSUER_ID" 2>&1 | tail -20

echo ""
echo "✅ Upload complete. Confirm via (build appears in /v1/builds once processed):"
echo "   python3 ios/scripts/verify-build.py   # queries ASC for app 6786011633"
