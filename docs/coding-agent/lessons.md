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

## 2026-08-12 — Model keepCA scale preservation explicitly instead of inferring it from layer  [tags: assumptions, api-design, review]

Context:
- Plan: `docs/coding-agent/plans/active/keep-ca-scale-state-decoupling-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Orchestrator | Researcher | Worker | Reviewer

Symptom:
- `BaseComment.getEffectiveScale` used `layer === -1` to decide whether global scale applied, even though layer IDs primarily represent collision groups.

Root cause:
- The first implementation reused keepCA's visible layer mutation as an implicit proxy for a separate rendering-policy decision.

Fix applied:
- Track comments actually classified by keepCA through explicit internal state and make effective-scale precedence independent of numeric layer values.

Prevention:
- Review and design guardrail:
  - When one feature needs policy state and another field merely correlates with it, model the owning feature's state explicitly rather than branching on the incidental representation.
- Residual risk / waiver:
  - none

Evidence:
- User correction identified the non-intuitive condition; implementation and independent review verified explicit classification state, layer-independent precedence, and focused tests passing 72/72.

## 2026-08-12 — Test scale ownership at geometry boundaries, not only final dimensions  [tags: review, validation]

Context:
- Plan: `docs/coding-agent/plans/completed/nico-scale-comment-override-plan.md`
- Task/Wave: Task_1 / Wave 1 review follow-up
- Roles involved: Orchestrator | Worker | Reviewer

Symptom:
- The first implementation double-applied `nico:scale` to HTML5 collision-guide height and changed legacy option-based guide positioning, while dimension and raster-transform tests still passed.

Root cause:
- The implementation did not distinguish fields already scaled during comment-size calculation from raw geometry, and the recording renderers discarded `strokeRect` arguments so collision math was not directly asserted.

Fix applied:
- Separated explicit command position scaling from effective fallback height scaling, removed the duplicate HTML5 height multiplier, and added exact collision-rectangle tests for explicit and legacy HTML5/Flash paths.

Prevention:
- Review and validation guardrail:
  - For render-scale changes, classify every stored geometry field as raw or already scaled, then require exact coordinate/size assertions at each independent measurement, raster, collision, and hit-test boundary.
- Residual risk / waiver:
  - none

Evidence:
- Reviewer delta re-review approved; focused tests pass 24/24 and full unit tests pass 223/223.

## 2026-08-12 — Resolve pnpm workspace admission before provisioning worktree dependencies  [tags: tooling, validation]

Context:
- Plan: `docs/coding-agent/plans/active/nico-scale-comment-override-plan.md`
- Task/Wave: Task_1 / Wave 1
- Roles involved: Orchestrator | Worker

Symptom:
- Standard `pnpm` commands stopped before running repository scripts with `packages field missing or empty`, and the isolated worktree initially lacked local dependencies.

Root cause:
- The checked-in `pnpm-workspace.yaml` has workspace settings but no `packages` entry, which the active pnpm version rejects; dependency provisioning was attempted before coordinating the equivalent validation route.

Fix applied:
- Used `--ignore-workspace` and direct package-script binaries to execute the same focused tests, typecheck, docs-version check, Biome check, full unit suite, and build without changing tracked dependency metadata.

Prevention:
- Validation guardrail:
  - On the first pnpm workspace-admission failure, capture workspace metadata and dependency state, then agree on an `--ignore-workspace` or direct-binary equivalent before installing or retrying scripts.
- Residual risk / waiver:
  - Standard nested pnpm scripts remain unusable until the repository workspace metadata is repaired; equivalent underlying commands are required in this worktree.

Evidence:
- Focused tests passed 20/20, related suites 62/62, full unit tests 219/219, and equivalent tsc, Biome/docs, and rolldown builds passed.

## 2026-08-12 — Evaluate public APIs against the library contract, not one issue reporter's minimum need  [tags: planning, scope-owns, api-design]

Context:
- Discussion: GitHub issue #405, per-comment and per-layer scale controls.
- Roles involved: Orchestrator | User

Symptom:
- The initial recommendation favored an owner-specific option because it was the smallest change satisfying the reporter's immediate use case.

Root cause:
- The design assessment treated the issue reporter as the primary consumer instead of evaluating the API surface for a general-purpose rendering library and its existing custom-command conventions.

Fix applied:
- Reframed the design around format-independent global and per-comment controls, selecting `options.scale` plus `nico:scale:<number>` without owner-specific or input-format-specific API additions.

Prevention:
- Planning guardrail:
  - For public API changes, list the library-wide consumer contract, existing extension conventions, and format portability before comparing implementation size or the reporter's minimum requirement.
- Residual risk / waiver:
  - none

Evidence:
- The accepted direction uses the existing `nico:*` command namespace and applies across all supported input formats.

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
