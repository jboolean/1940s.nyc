#!/bin/bash
# Resolves DB + OpenRouter credentials from SSM inline (never printed, never
# stored) and runs the experiment CLI. Mirrors the pattern already used by
# ../cloneDb.sh and ../cloneStories.sh.
#
# DB_STAGE selects which database to read from (default: production --
# read-only SELECTs only). The OpenRouter key always comes from the "dev"
# SSM parameter regardless of DB_STAGE, per instruction.
set -euo pipefail

STAGE="${DB_STAGE:-production}"
cd "$(dirname "$0")/.."

# `ts-node` type-checks this whole program (all 13 TypeORM entities, plus
# @openrouter/sdk's large generated type surface) from scratch on every
# invocation -- that alone was ~10s per run, dwarfing the actual DB query
# and Jev API calls (each under ~1s). `tsc --incremental` caches that work
# in .build/moderation-experiment.tsbuildinfo (gitignored), so only changed
# files get re-checked. First build after `npm install` is still slow; every
# run after that -- including after editing rules.ts -- is fast.
npx tsc -p tsconfig.json --incremental --tsBuildInfoFile .build/moderation-experiment.tsbuildinfo

DB_HOST=$(aws ssm get-parameter --name "fourtiesnyc-${STAGE}-db-host" --query Parameter.Value --output text --with-decryption) \
DB_PORT=$(aws ssm get-parameter --name "fourtiesnyc-${STAGE}-db-port" --query Parameter.Value --output text --with-decryption) \
DB_USERNAME=$(aws ssm get-parameter --name "fourtiesnyc-${STAGE}-db-username" --query Parameter.Value --output text --with-decryption) \
DB_PASSWORD=$(aws ssm get-parameter --name "fourtiesnyc-${STAGE}-db-password" --query Parameter.Value --output text --with-decryption) \
DB_DATABASE=$(aws ssm get-parameter --name "fourtiesnyc-${STAGE}-db-database" --query Parameter.Value --output text --with-decryption) \
OPENROUTER_API_KEY=$(aws ssm get-parameter --name "fourtiesnyc-dev-openrouter-sk" --query Parameter.Value --output text --with-decryption) \
node .build/moderation-experiment/run.js "$@"
