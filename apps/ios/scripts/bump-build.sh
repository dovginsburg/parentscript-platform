#!/usr/bin/env bash
# bump-build.sh — Increment CURRENT_PROJECT_VERSION in App.xcodeproj on every
# Release archive of ParentScript, and (optionally) MARKETING_VERSION when
# the BUMP_MARKETING_VERSION=1 env var is exported.
#
# History:
#   Yesterday the build # froze because App/Info.plist hardcoded literal
#   CFBundleVersion/CFBundleShortVersionString values instead of
#   $(CURRENT_PROJECT_VERSION)/$(MARKETING_VERSION), so the .pbxproj vars
#   never flowed into the bundle. This script lives in a Run Script phase
#   so every Release archive bumps the .pbxproj, while Info.plist consumes
#   the values via the build-system substitutions. One edit, one bump, one
#   archive — no human in the loop.

set -eo pipefail

# When invoked from Xcode, PROJECT_FILE_PATH points at the .pbxproj and
# SRCROOT points at the directory holding it (the App/ folder for
# ParentScript). When invoked by hand for a dry run, fall back to the
# script's own grandparent directory (ios/).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRCROOT="${SRCROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

# PROJECT_FILE_PATH from Xcode may be either:
#   /path/to/Foo.xcodeproj/project.pbxproj  (preferred — pbxproj file path)
#   /path/to/Foo.xcodeproj                  (older Xcode: the .xcodeproj DIR)
# Normalize both to the pbxproj file. If unset, search SRCROOT for known layouts.
if [[ -n "${PROJECT_FILE_PATH:-}" ]]; then
  case "$PROJECT_FILE_PATH" in
    *.xcodeproj/project.pbxproj) : ;; # already correct
    *.xcodeproj) PROJECT_FILE_PATH="$PROJECT_FILE_PATH/project.pbxproj" ;;
    *) : ;; # leave as-is; the -f check below will catch bad paths
  esac
fi

if [[ -z "${PROJECT_FILE_PATH:-}" ]] || [[ ! -f "$PROJECT_FILE_PATH" ]]; then
  if [[ -f "$SRCROOT/App/App.xcodeproj/project.pbxproj" ]]; then
    PROJECT_FILE_PATH="$SRCROOT/App/App.xcodeproj/project.pbxproj"
  elif [[ -f "$SRCROOT/App.xcodeproj/project.pbxproj" ]]; then
    PROJECT_FILE_PATH="$SRCROOT/App.xcodeproj/project.pbxproj"
  fi
fi
PBXPROJ="$PROJECT_FILE_PATH"

if [[ ! -f "$PBXPROJ" ]]; then
  echo "bump-build: project.pbxproj not found at $PBXPROJ" >&2
  echo "bump-build: SRCROOT=$SRCROOT SCRIPT_DIR=$SCRIPT_DIR" >&2
  exit 1
fi

# Honor an opt-out: SKIP_BUMP=1 lets a one-off archive upload the current
# value without auto-incrementing (useful when shipping a build that was
# already hand-bumped and committed). Otherwise: auto-bump below.
if [[ "${SKIP_BUMP:-0}" == "1" ]]; then
  echo "bump-build: SKIP_BUMP=1 set, not modifying project version"
  exit 0
fi

# Find current CURRENT_PROJECT_VERSION from the .pbxproj and bump it.
CURRENT=$(awk '/CURRENT_PROJECT_VERSION *= *[0-9]+;/{ gsub(/[^0-9]/,"",$3); print $3; exit }' "$PBXPROJ")
NEXT=$((CURRENT + 1))

python3 - "$PBXPROJ" "$NEXT" <<'PY'
import re, sys
path, new_value = sys.argv[1], sys.argv[2]
with open(path, 'r') as f:
    src = f.read()
def repl(match):
    return f'CURRENT_PROJECT_VERSION = {new_value};'
out, count = re.subn(r'CURRENT_PROJECT_VERSION\s*=\s*[0-9]+\s*;', repl, src)
with open(path, 'w') as f:
    f.write(out)
print(f'bump-build: CURRENT_PROJECT_VERSION -> {new_value} ({count} occurrence(s) bumped)')
PY

# Optional marketing-version bump (off by default — let a human flip the
# BUMP_MARKETING_VERSION=1 env var when shipping a customer-visible release).
if [[ "${BUMP_MARKETING_VERSION:-0}" == "1" ]]; then
  python3 - "$PBXPROJ" "${MARKETING_VERSION_NEXT:-1.1.0}" <<'PY'
import re, sys
path, new_value = sys.argv[1], sys.argv[2]
with open(path, 'r') as f:
    src = f.read()
def repl(match):
    return f'MARKETING_VERSION = {new_value};'
out, count = re.subn(r'MARKETING_VERSION\s*=\s*[0-9.]+\s*;', repl, src)
with open(path, 'w') as f:
    f.write(out)
print(f'bump-build: MARKETING_VERSION -> {new_value} ({count} occurrence(s) bumped)')
PY
fi

exit 0
