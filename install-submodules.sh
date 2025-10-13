#!/usr/bin/env sh
set -eu

APPS="frontend backend edge"

REPO_ROOT=$(git rev-parse --show-toplevel)

for APP in $APPS; do
  (
    cd "$REPO_ROOT/$APP"
    echo "Installing \"$APP\""
    npm ci
  )
done
