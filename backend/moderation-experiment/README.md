# AI moderation experimentation tool

This tool tests whether an AI model can take a first pass at story moderation. It reads a story's text, predicts whether a human moderator would approve or reject it, and reports how often that prediction matches what happened.

The tool is local only. It does not deploy anywhere and does not write to the database. It reads real production story data (read only) and calls OpenRouter to score it. Results, including real story text and storyteller names, live in `results/` and `.cache/`. Both folders are excluded from git. Do not commit them or paste their contents anywhere public. Some rejected stories contain offensive or sexual content, since that is one of the rejection rules being tested.

## The two backends

The tool scores a story two ways, against the same rules.

`jev` is the default. It calls [typesafe/jev-1.13](https://openrouter.ai/typesafe/jev-1.13) through OpenRouter's alpha Decisions API. Jev is not a chat model. You ask it typed yes-or-no questions about a story, and it returns calibrated probabilities directly, with no text generation or parsing involved.

`llm` is a fallback that uses a normal chat-completion model (`openai/gpt-5.4-mini` by default) through OpenRouter, prompted to return the same per-rule probabilities as structured JSON. Use `--moderator llm` if Jev access is not working, or if you want a comparison point. Override the model with `--model` (for example, `--model anthropic/claude-haiku-4.5`).

Both backends read their rules and prompt text from [`rules.ts`](./rules.ts). That is the only file that holds prompt content. The moderator files (`moderators/jevModerator.ts` and `moderators/llmModerator.ts`) only handle the API call and response parsing. Edit the rule instructions, criteria, or the reject threshold in `rules.ts`, and both backends pick up the change.

Both backends use the official [`@openrouter/sdk`](https://www.npmjs.com/package/@openrouter/sdk) package, not raw HTTP calls, so requests and responses are typed and validated.

## Running it

```bash
# from backend/
npm run experiment                          # re-run the cached working sample against Jev
npm run experiment -- --new-sample          # draw a fresh random sample (20 approved, 20 rejected)
npm run experiment -- --sample-size 50 --new-sample
npm run experiment -- --moderator llm       # try the LLM fallback instead
npm run experiment -- --moderator llm --model anthropic/claude-haiku-4.5
npm run experiment -- --holdout             # final check only, see below
npm run experiment -- --full                # entire working pool, real class mix, see below
npm run experiment -- --natural --sample-size 300   # cheap stand-in for --full
npm run experiment -- --recent-months 6     # only stories reviewed in the last 6 months
npm run experiment -- --help                # list all flags
```

### Balanced samples vs. the real class mix

`--new-sample` draws a balanced sample (equal approved and rejected) for clear signal while iterating on `rules.ts`. Real traffic is about 85 to 90% approved, so use `--full` or `--natural --sample-size N` to check accuracy at the real mix.

### Moderation standards drift over time

Moderation standards change over time, so the eligible pool blends old and new decisions. `--recent-months <n>` restricts sampling to the last n months, at the cost of a smaller pool.

Each run prints a table of mismatches, a table of errors (if any), and a summary: accuracy, cost, and the false-approve rate. The false-approve rate matters most. It is the share of human-rejected stories the model would have auto-approved, the costly mistake, since it publishes something a human would have rejected. The false-reject rate (a human-approved story the model queues for review) is safer but reduces how much moderation gets automated.

Each run also prints a `RESULT_JSON: {...}` line, so a script, or another Claude session, can read the outcome without parsing the tables.

Results are written to `results/working-latest.json` (or `results/holdout-latest.json`), plus a timestamped copy of every run.

### Cost

Every run reports the OpenRouter cost, both total and per story. Jev costs a fraction of a cent per story. The LLM fallback costs about 10 to 20 times more per story, since it is a general chat model, not a purpose-built decision model.

### Credentials

`npm run experiment` runs [`run.sh`](./run.sh), which resolves database and OpenRouter credentials from SSM into environment variables for a single command. This is the same pattern `../cloneDb.sh` uses, so nothing is ever printed, typed, or written to disk. It needs AWS SSO access to read `fourtiesnyc-production-db-*` (read only) and `fourtiesnyc-dev-openrouter-sk`. Set `DB_STAGE=staging` (or another stage) to point at a different database.

## The holdout

Story IDs split into a working pool (80%) and a holdout pool (20%) by hashing the ID. There is no state file, so the split never drifts. `npm run experiment` without `--holdout` only touches the working pool.

Use `--holdout` once, only after you believe the prompt is done. Running it repeatedly and adjusting `rules.ts` in response defeats the point of having a holdout. Each holdout run is logged to `.cache/holdout-run-log.json`, and the CLI reports how many times you have run it.

A holdout run respects `--sample-size` the same way a working run does, so it cannot balloon into a huge batch of billed API calls as the pool grows. Pass `--full` to evaluate the entire holdout pool as a deliberate final check.

Story text and titles never appear in a holdout run's output: not in the mismatch table, not in `results/holdout-*.json`, not in the viewer. Only IDs, labels, probabilities, and cost are kept. The working pool's output still includes full story text.

## Viewing results in a browser

```bash
npm run experiment:ui
```

This starts a small local server at `http://localhost:4500`, bound to `127.0.0.1`. It lets you browse any past run: filter to mismatches, filter by which rule fired, search the text, and expand a row to see the full story with its per-rule probabilities and cost. A second tab plots `REJECT_THRESHOLD` (in `rules.ts`) against false-approve rate and auto-approve rate, computed from whatever run is loaded, so you can see that tradeoff without a separate step. For an accurate reading, load a `--full` or `--natural` run first (see above). It only reads local files in `results/`. Nothing is uploaded. Stop the server when you are done.

The page also has a "run a new experiment" panel at the top. It calls the same `run.sh` the CLI uses, so it makes the same real, billed OpenRouter calls against the same production data. Output streams into the page as the run happens, and the results list refreshes when it finishes. Checking "holdout" asks for confirmation before starting, same as the CLI's warning. Only one run can be in progress at a time.

## Files

- `rules.ts`: the prompt. One `noul` (yes-or-no probability) question per rejection rule, the reject threshold, the combine logic, and the prompt text for both backends. This is the only file to edit when iterating.
- `types.ts`: shared types (`Moderator`, `ModerationVerdict`, and so on).
- `moderators/jevModerator.ts` and `moderators/llmModerator.ts`: the two backends. Both call the OpenRouter SDK and parse its response into a `ModerationVerdict`. Neither contains prompt text.
- `sampling.ts`: loads eligible stories (state `published` or `rejected`, with text, excluding `last_reviewer = 'system'`, since that is an automated rejection, not a human decision), splits them into the working and holdout pools, and draws random samples with lodash.
- `run.ts` and `run.sh`: the CLI and its wrapper. `run.sh` resolves credentials, compiles the program with an incremental `tsc` build (see Speed, above), and runs the compiled output with plain `node`. `run.ts` uses [`commander`](https://www.npmjs.com/package/commander) for argument parsing, which is why `--help` lists every flag with its default.
- `viewer/`: the local results browser, including the threshold chart tab. `serve.mjs` also exposes the run-and-stream endpoints behind the "run a new experiment" panel. It shells out to `run.sh`, the same as the CLI does.
