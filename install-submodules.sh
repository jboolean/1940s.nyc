#!/usr/bin/env bash
set -euo pipefail

APPS=(
  "frontend"
  "backend"
  "edge"
)

repo_root=$(git rev-parse --show-toplevel)
for app in "${APPS[@]}"; do
  pushd "$repo_root/$app" > /dev/null
  echo "Installing \"$app\""
  npm ci
  popd > /dev/null
done
