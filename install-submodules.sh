#!/usr/bin/env sh

APPS=(
  "frontend"
  "backend",
  "edge"
)

for APP in "${APPS[@]}"; do
 cd $(git rev-parse --show-toplevel)/$APP
 echo "Installing \"$APP\""
 npm install
done