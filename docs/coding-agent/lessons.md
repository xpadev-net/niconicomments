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
