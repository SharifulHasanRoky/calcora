#!/usr/bin/env bash
#
# CALCORA — Push to GitHub
#
# Run this script to push the CALCORA codebase to your GitHub repository.
#
# Usage:
#   1. Create a new empty repo on GitHub (e.g. https://github.com/new)
#      Name it e.g. "calcora" — do NOT initialize with README/license.
#   2. Set your repo URL below (or pass it as an argument):
#        ./push-to-github.sh https://github.com/YOUR_USERNAME/calcora.git
#   3. Run the script. You'll be prompted for GitHub credentials if not cached.
#
set -euo pipefail

REMOTE_URL="${1:-}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$REMOTE_URL" ]; then
  echo "Usage: $0 <github-remote-url>"
  echo "Example: $0 https://github.com/yourname/calcora.git"
  exit 1
fi

cd "$REPO_DIR"

echo "==> Adding remote 'origin' -> $REMOTE_URL"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo "==> Pushing to GitHub (branch: main)"
git push -u origin main

echo ""
echo "Done! Your code is now on GitHub at:"
git remote get-url origin
