#!/usr/bin/env sh

set -e

ROOT_DIR="$(git rev-parse --show-toplevel)"

for APP in frontend backend edge; do
  cd "$ROOT_DIR/$APP"
  echo "Installing \"$APP\""
  npm install
done
