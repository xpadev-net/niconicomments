# Lessons Log (Coding Agent)

Purpose:
- capture recurring mistakes and the prevention mechanism
- enable “read once, don’t repeat” improvements

## How to use
- Append a new entry after any user correction or significant miss.
- Keep entries short and actionable.
- Promote repeated/high-severity lessons into repo rules, harness migration candidates, troubleshooting notes, or accepted residual-risk records.

## Tags (recommended)
- planning
- validation
- delegation
- review
- ui-e2e
- tooling
- ci
- scope-owns

## Entries

## 2026-07-16 — Derive relative-coordinate signs before changing asymmetric bounds  [tags: review, validation]

Context:
- Plan: `docs/coding-agent/plans/active/mixed-duration-collision-review-fixes-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Orchestrator | Worker

Symptom:
- The first unequal-width fix swapped the two width bounds without also correcting the sign of the relative-coordinate expression.

Root cause:
- The inequality was reviewed from its helper name and hook description without expanding the rendering equation `left = initialLeft - displacement` and checking operand order.

Fix applied:
- Renamed and inverted the helper to explicitly compute candidate left minus comment left, then added an asymmetric regression case that fails when the sign is inverted.

Prevention:
- Dispatch/plan guardrail:
  - For asymmetric geometry bounds, derive the relative quantity from the rendering equation, encode operand order in the helper name, and require a sign-sensitive asymmetric regression before integration.
- Residual risk / waiver:
  - none

Evidence:
- Focused movable-collision tests pass 10/10, including widths 200/20 with asymmetric start times; TypeScript and Biome checks pass.

## 2026-08-12 — Preserve local indentation during repeated workflow pin edits  [tags: validation, ci]

Context:
- Plan: `docs/coding-agent/plans/active/consolidate-green-non-typescript-dependency-updates-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Orchestrator | Worker

Symptom:
- The first repeated checkout pin replacement changed indentation in one non-uniform workflow step, causing YAML parsing to fail.

Root cause:
- The replacement assumed every checkout step used the same leading whitespace, but `pr-test-codeql-analysis.yml` has a structurally different checkout step.

Fix applied:
- Restored the original indentation for that step and reran YAML parsing across every workflow successfully.

Prevention:
- Dispatch/plan guardrail:
  - Preserve each matched workflow line's existing indentation during repeated pin updates and require an all-workflow YAML parse immediately after the edit.
- Residual risk / waiver:
  - none

Evidence:
- The initial Ruby YAML parse failed at the changed CodeQL workflow; after the indentation correction, the same parse and `git diff --check` passed.

## 2026-09-14 — Scope workflow whitespace gates to the changed surface  [tags: validation, ci]

Context:
- Plan: `docs/coding-agent/plans/completed/ci-test-workflow-cleanup-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Orchestrator | Worker | Reviewer

Symptom:
- The required all-workflow trailing-whitespace check blocked an otherwise complete CI restructuring because it detected three unchanged blank lines in `release-create-release.yml`, outside the worker-owned paths.

Root cause:
- A broad repository hygiene check was treated as a change-specific gate without separating baseline violations from newly introduced violations.

Fix applied:
- Verified the findings against the baseline, confirmed changed workflows and `git diff --check` were clean, and recorded a narrow Orchestrator waiver instead of expanding the CI cleanup into release workflow formatting.

Prevention:
- Dispatch/plan guardrail:
  - For broad hygiene checks, compare against baseline and report pre-existing findings separately; require changed-surface cleanliness before marking the task done.
- Residual risk / waiver:
  - Existing whitespace in `release-create-release.yml:42,51,135` remains; owner is the Orchestrator for a future release-workflow cleanup or baseline-aware gate.

Evidence:
- Ruby YAML parse passed for all 10 workflows; `rtk git diff --check` and changed-workflow whitespace checks passed; independent Reviewer approved the waiver and CI diff.

## 2026-09-14 — Keep platform-specific Playwright snapshot failures separate from CI workflow validation  [tags: validation, ci, ui-e2e]

Context:
- Plan: `docs/coding-agent/plans/completed/ci-test-workflow-cleanup-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Orchestrator | Worker | Reviewer

Symptom:
- Local Playwright execution passed 46 tests but reported 7 missing macOS Firefox snapshots after the E2E workflow was reduced to Node 24.

Root cause:
- The local environment did not contain the platform-specific snapshots expected by the visual test suite; this was unrelated to the workflow YAML contract.

Fix applied:
- Kept the E2E result optional for this local environment, removed generated snapshots, and preserved the existing CI artifact upload and screenshot-comment path.

Prevention:
- Troubleshooting note/candidate:
  - Symptom: local Firefox visual tests fail only because platform-specific snapshots are absent.
  - Cause: snapshot baseline is platform/provider-specific.
  - Safe steps: do not update snapshots during validation; rely on the supported CI platform or run the dedicated snapshot-update workflow when an intentional baseline change is requested.
- Residual risk / waiver:
  - Local macOS visual parity remains unverified; the GitHub Actions Linux E2E path remains the authoritative CI check.

Evidence:
- `pnpm playwright install-deps` and Firefox installation passed; E2E reported 46 passes and 7 missing-snapshot failures; no snapshot files changed.

## 2026-09-14 — Recover package-manager executable mode before build validation  [tags: tooling, validation]

Context:
- Plan: `docs/coding-agent/plans/completed/ci-test-workflow-cleanup-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Worker | Orchestrator

Symptom:
- The first local `pnpm build` invocation failed because the Corepack `pnpm.cjs` wrapper was not executable.

Root cause:
- The local Corepack cache contained the package-manager entrypoint with mode `0644`, while the npm exec path invokes it directly.

Fix applied:
- Restored execute permission on that cache entrypoint and reran the build successfully; no repository files were changed by the recovery.

Prevention:
- Troubleshooting note/candidate:
  - Symptom: package-manager command fails with an execute-permission error before project code runs.
  - Cause: local Corepack cache entrypoint mode is incorrect.
  - Safe steps: inspect the resolved `npm_execpath`, repair only that specific cache file's executable bit, then rerun the failed validation.
- Residual risk / waiver:
  - none

Evidence:
- The recovered build and post-build package artifact check passed; the failure was environment-only.
