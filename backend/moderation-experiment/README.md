# AI moderation experimentation tool

This tool tests whether an AI model can take a first pass at story moderation. It reads a story's text, predicts whether a human moderator would approve or reject it, and reports how often that prediction matches what actually happened.

The tool is local only. It does not deploy anywhere and does not write to the database. It reads real production story data (read only) and calls OpenRouter to score it. Results, including real story text and storyteller names, live in `results/` and `.cache/`. Both folders are excluded from git. Do not commit them, and do not paste their contents anywhere public. Some rejected stories contain offensive or sexual content, since that is one of the rejection rules being tested.

## The two backends

The tool supports two ways to score a story, both scored against the same rules.

`jev` is the default. It calls [typesafe/jev-1.13](https://openrouter.ai/typesafe/jev-1.13) through OpenRouter's alpha Decisions API. Jev is not a chat model. You ask it typed yes-or-no questions about a story and it returns calibrated probabilities directly, with no text generation or parsing involved.

`llm` is a fallback that uses a normal chat-completion model (`openai/gpt-5.4-mini` by default) through OpenRouter, prompted to return the same per-rule probabilities as structured JSON. Use `--moderator llm` if Jev access is not working, or if you want a comparison point. Override the model with `--model` (for example `--model anthropic/claude-haiku-4.5`).

Both backends read their rules and prompt text from [`rules.ts`](./rules.ts). That file is the only place prompt content lives. The moderator files (`moderators/jevModerator.ts` and `moderators/llmModerator.ts`) only handle the API call and response parsing. Edit the rule instructions, criteria, or the reject threshold in `rules.ts`, and both backends pick up the change identically.

Both backends use the official [`@openrouter/sdk`](https://www.npmjs.com/package/@openrouter/sdk) package rather than raw HTTP calls, so requests and responses are typed and validated.

## Running it

```bash
# from backend/
npm run experiment                          # re-run the cached working sample against Jev
npm run experiment -- --new-sample          # draw a fresh random sample (20 approved, 20 rejected)
npm run experiment -- --sample-size 50 --new-sample
npm run experiment -- --moderator llm       # try the LLM fallback instead
npm run experiment -- --moderator llm --model anthropic/claude-haiku-4.5
npm run experiment -- --holdout             # final check only, see below
npm run experiment -- --full                # entire working pool, natural (unbalanced) class mix -- see below
npm run experiment -- --natural --sample-size 300   # cheap stand-in for --full: N stories at the natural class ratio
npm run experiment -- --recent-months 6     # restrict the pool to stories reviewed in the last 6 months -- see below
npm run experiment -- --help                # list all flags
```

### Balanced samples vs. the real class mix

The default/`--new-sample` draw is deliberately balanced (equal approved and rejected), so iterating on `rules.ts` gets clear signal from both classes even though rejections are the rare case in the wild. That means the accuracy/false-approve/false-reject numbers from a normal run do NOT reflect real-world-weighted accuracy -- in production, roughly 85-90% of eligible stories are approved, so false-rejects on that large majority class matter much more to overall accuracy than the balanced samples let on. Pass `--full` (without `--holdout`) to score the entire working pool at its natural class mix instead, as a sanity check on real-world-weighted accuracy without touching the holdout set. `--natural --sample-size N` is a cheap stand-in for `--full`: it draws N stories at the pool's natural ratio instead of scoring the whole pool, so real-world-weighted accuracy can be checked on every `rules.ts` iteration without the time/cost of a full-pool run.

### Moderation standards drift over time

What counts as approvable has changed over time (e.g. bare "I live here" claims used to be approved more often than they are now), so the eligible pool is a blend of old and new standards. `--recent-months <n>` restricts sampling/drawing to stories reviewed in the last `n` months, which reflects current policy instead of that blend -- at the cost of a smaller eligible pool the more you restrict it.

Each run prints a table of mismatches, a table of errors (if any), and a summary: accuracy, cost, and the false-approve rate. The false-approve rate matters most: it is the share of human-rejected stories the model would have auto-approved. That is the costly kind of mistake, since it means publishing something a human would have rejected. The false-reject rate (a human-approved story the model would have queued for review) is safer but reduces how much moderation gets automated.

Each run also prints a `RESULT_JSON: {...}` line, so a script, or another Claude session, can read the outcome without parsing the tables.

Results are written to `results/working-latest.json` (or `results/holdout-latest.json`), plus a timestamped copy of every run.

### Cost

Every run reports the OpenRouter cost for that batch of calls, both total and per story. Jev costs a fraction of a cent per story. The LLM fallback costs roughly 20 times more per story, since it is a general chat model rather than a purpose-built decision model.

### Credentials

`npm run experiment` runs [`run.sh`](./run.sh), which resolves database and OpenRouter credentials from SSM inline, into environment variables for a single command. This is the same pattern `../cloneDb.sh` uses, so nothing is ever printed, typed, or written to disk. It needs AWS SSO access to read `fourtiesnyc-production-db-*` (read only) and `fourtiesnyc-dev-openrouter-sk`. Set `DB_STAGE=staging` (or any other stage) to point at a different database if you need to.

### Speed

Each run prints a `Timing (ms)` table breaking down node startup, the DB query, and the API calls. Jev itself is fast (well under a second for a typical sample). What is not shown, because it happens before the process even starts, is `run.sh` resolving SSM credentials (roughly 2 to 3 seconds) and an incremental `tsc` build (`.build/moderation-experiment.tsbuildinfo`, gitignored). The build step exists because `ts-node` used to fully type-check the whole backend, plus `@openrouter/sdk`'s large generated types, on every single invocation, which was costing around 10 seconds per run regardless of sample size. Compiling once and reusing the cache, the same way the deployed backend already builds for real, cuts a typical repeat run to a few seconds total.

## The holdout

Story IDs are split into a working pool (80%) and a holdout pool (20%) by hashing the ID. There is no state file, so the split never drifts. `npm run experiment` (without `--holdout`) only ever touches the working pool.

Use `--holdout` once, only after you believe the prompt is done. Running it repeatedly and adjusting `rules.ts` in response defeats the purpose of having a holdout at all. Each holdout run is logged to `.cache/holdout-run-log.json`, and the CLI reports how many times you have run it, as a reminder.

A holdout run respects `--sample-size` the same way a working run does (a bounded sample drawn from the holdout pool), so it cannot silently balloon into an enormous batch of real API calls as the pool grows over time. Pass `--full` to evaluate the entire holdout pool instead, as a deliberate final check.

Story text and titles are never included in a holdout run's output: not in the CLI's mismatch table, not in `results/holdout-*.json`, not in the viewer. Only IDs, labels, probabilities, and cost are kept. The working pool's output is unaffected and still includes full story text, since seeing that content is the point of iterating on it.

## Viewing results in a browser

```bash
npm run experiment:ui
```

This starts a small local server at `http://localhost:4500`, bound to `127.0.0.1` only. It lets you browse any past run: filter to mismatches, filter by which rule fired, search the text, and expand a row to see the full story with its per-rule probabilities and cost. It only reads local files in `results/`. Nothing is uploaded anywhere. Stop the server when you are done.

The page also has a "Run a new experiment" panel at the top. It calls the same `run.sh` the CLI uses, so it makes the same real, billed OpenRouter calls against the same production data. Output streams into the page live as the run happens, and the results list refreshes when it finishes. Checking "Holdout" asks for confirmation before starting, same as the CLI's warning. Only one run can be in progress at a time.

## Files

- `rules.ts`: the prompt. One `noul` (yes-or-no probability) question per rejection rule, the reject threshold, the combine logic, and the prompt text for both backends. This is the only file to edit when iterating.
- `types.ts`: shared types (`Moderator`, `ModerationVerdict`, and so on).
- `moderators/jevModerator.ts` and `moderators/llmModerator.ts`: the two backends. Both call the OpenRouter SDK and parse its response into a `ModerationVerdict`. Neither contains prompt text.
- `sampling.ts`: loads eligible stories (state `published` or `rejected`, with text, excluding `last_reviewer = 'system'` -- automated rejections, not an actual human decision), splits them into the working and holdout pools, and draws random samples using lodash (`partition`, `sampleSize`, `compact`), which is already a dependency of this project.
- `run.ts` and `run.sh`: the CLI and its wrapper. `run.sh` resolves credentials, compiles this program with an incremental `tsc` build (see Speed, above), and runs the compiled output with plain `node`. `run.ts` uses [`commander`](https://www.npmjs.com/package/commander) for argument parsing, which is why `--help` lists every flag with its default.
- `viewer/`: the local results browser. `serve.mjs` also exposes the run-and-stream endpoints behind the "Run a new experiment" panel; it shells out to `run.sh`, the same as the CLI does.
