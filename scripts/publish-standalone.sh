#!/usr/bin/env bash
set -euo pipefail

TARGET_REPO="${1:-}"
VISIBILITY="${2:-private}"
SOURCE_BRANCH="${SOURCE_BRANCH:-operator/standalone-staging}"

if [[ -z "$TARGET_REPO" ]]; then
  echo "Usage: bash scripts/publish-standalone.sh OWNER/REPO [private|public]"
  exit 1
fi

if [[ "$VISIBILITY" != "private" && "$VISIBILITY" != "public" ]]; then
  echo "Visibility must be private or public."
  exit 1
fi

for command in git gh tar npm; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "$command is required."
    exit 1
  }
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "Run this script from the source repository."
  exit 1
}

git show-ref --verify --quiet "refs/heads/$SOURCE_BRANCH" || {
  echo "Local branch $SOURCE_BRANCH was not found. Fetch it first."
  exit 1
}

gh auth status >/dev/null

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Exporting $SOURCE_BRANCH into a clean repository root..."
git archive "$SOURCE_BRANCH" | tar -x -C "$TMP_DIR"

cd "$TMP_DIR"
git init -b main >/dev/null
git add .
git commit -m "Initial Operator standalone release"

echo "Creating $TARGET_REPO as a $VISIBILITY repository..."
gh repo create "$TARGET_REPO" "--$VISIBILITY" --source=. --remote=origin --push

echo
echo "Standalone Operator repository created:"
echo "  https://github.com/$TARGET_REPO"
echo
echo "Next:"
echo "  1. Configure production environment variables."
echo "  2. Run npm ci && npm run check:production."
echo "  3. Attach PostgreSQL and deploy the Docker image."
