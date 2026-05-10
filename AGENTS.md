# Lessons for coding agents

## CI failures: check GitHub first, not local files

When asked to fix CI failures, **do not** start by reading workflow YAML files, package.json, or other local configuration. Instead:

1. Run `gh run list` to see recent run statuses
2. Run `gh run view <id> --log` or `gh run view <id> --log --job <job>` to get the actual failure output
3. Only after seeing the error should you examine relevant local files

Rationale: CI runs remotely — the local files may not reflect what's happening on the runner. The actual error message is the fastest path to the root cause.