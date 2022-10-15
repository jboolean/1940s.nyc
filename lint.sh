#!/usr/bin/env sh

APPS=(
  "frontend"
  "backend"
)

for APP in "${APPS[@]}"; do
 cd $(git rev-parse --show-toplevel)/$APP
 echo "Checking \"$APP\""
 npx --no-install lint-staged # run local to submodule
done