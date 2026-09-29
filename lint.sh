#!/usr/bin/env sh

set -u

ROOT=$(git rev-parse --show-toplevel)
STATUS=0

for APP in frontend backend; do
  echo "Checking \"$APP\""

  if [ ! -d "$ROOT/$APP/node_modules" ]; then
    echo "  skipped: $APP/node_modules is missing, run npm install in $APP" >&2
    continue
  fi

  # lint-staged is resolved from the app's own node_modules
  (cd "$ROOT/$APP" && npx --no-install lint-staged) || STATUS=1
done

exit $STATUS
