# Plan: Mixed-duration collision review fixes

- status: done
- generated: 2026-07-16
- last_updated: 2026-07-16
- work_type: code

## Goal
- Resolve every actionable finding from the first `gh-review-hook` run for PR #392 without regressing the existing same-speed fast path.

## Definition of Done
- Unequal-width trajectory overlap uses the correct comment width on each relative-position boundary.
- Mixed-duration trajectories are compared only while both comments intersect the configured collision judgment region.
- Per-comment invariant trajectory values are not recomputed for every candidate.
- Focused unit tests, type checking, formatting/lint checks, independent review, commit, push, and a new blocking `gh-review-hook` run succeed.

## Scope / Non-goals
- Scope: mixed-duration movable-comment trajectory intersection and its focused regression tests.
- Non-goals: changing fixed-comment behavior, replacing the existing same-duration fast path, or redesigning row allocation.

## Context (workspace)
- Related files/areas: `src/utils/comment.ts`, `tests/unit/movable-collision.spec.ts`.
- Existing patterns or references: existing movable-comment position formula and `config.collisionRange` boundary checks.
- Repo reference docs consulted: root `AGENTS.md`; no repository rule suite is present.

## Open Questions (max 3)
- None.

## Assumptions
- The collision judgment region contains a comment while its rectangle intersects the interval from `collisionRange.left` to `collisionRange.right`, including configured collision padding on its trailing edge.
- Existing repository scripts remain the canonical local validation commands for this TypeScript-only change.

## Tasks

### Task_1: Correct mixed-duration trajectory intersection
- type: impl
- owns:
  - src/utils/comment.ts
  - tests/unit/movable-collision.spec.ts
- depends_on: []
- description: |
  Fix the relative-width boundaries, clip trajectory comparison to the collision judgment region, hoist invariant values from the candidate loop, and add focused behavioral regression tests.
- acceptance:
  - Relative-position upper and lower bounds use the geometrically correct comment widths.
  - Trajectories that overlap only outside the configured collision judgment region do not consume separate rows.
  - Mixed-duration comments that intersect inside the judgment region still collide.
  - Invariant range and speed values for the current comment are computed once per placement attempt.
- validation:
  - kind: command
    required: true
    owner: worker
    detail: "Run the focused movable-collision unit test file and report a positive executed-test count."
  - kind: command
    required: true
    owner: worker
    detail: "Run repository TypeScript type checking."
  - kind: command
    required: true
    owner: worker
    detail: "Run repository formatting/lint validation for changed files."

### Task_2: Independently review the review-hook fixes
- type: review
- owns: []
- depends_on: [Task_1]
- description: |
  Review the integrated diff for collision geometry, range clipping, hot-path cost, and regression-test coverage.
- acceptance:
  - No correctness issue remains in relative-position bounds or collision-region timing.
  - Existing same-duration behavior remains unchanged.
  - Focused tests cover both a collision inside the judgment region and a non-collision outside it.
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "Perform read-only diff review against the acceptance criteria and report APPROVED or actionable findings."

## Task Waves (explicit parallel dispatch sets)

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]

## Rollback / Safety
- Revert the new follow-up commit; do not rewrite branch history or force push because PR #392 is open.

## Progress Log (append-only)

- 2026-07-16 00:00 Plan started.
  - Summary: Recorded the three actionable findings from the first `gh-review-hook` run.
  - Validation evidence: `gh-review-hook` exited 2 after all CI checks passed.
  - Notes: Research dispatch waived because the hook supplied exact code anchors and expected behavior.

- 2026-07-16 01:58 Wave 1 completed: [Task_1]
  - Summary: Corrected collision-region clipping, relative-coordinate sign and unequal-width bounds, and hoisted current-comment invariants.
  - Validation evidence: Focused Vitest 10/10, TypeScript check, Biome check, and diff whitespace check passed.
  - Notes: Initial integration review caught a relative-coordinate sign mismatch; the helper and asymmetric regression were corrected before Reviewer dispatch. Worker process cleanup is unavailable in this runtime after completion.

- 2026-07-16 02:02 Wave 2 completed: [Task_2]
  - Summary: Independent read-only review approved the collision geometry, region clipping, unchanged fast path, hot-path cost, and regression coverage.
  - Validation evidence: Reviewer reran focused Vitest 10/10, TypeScript check, Biome check, and `git diff --check`; all passed.
  - Notes: No actionable findings. Reviewer process cleanup is unavailable in this runtime after completion.

## Decision Log (append-only; re-plans and major discoveries)

- 2026-07-16 00:00 Decision: Handle all findings as one bounded collision-geometry change.
  - Trigger / new insight: Width bounds, region clipping, and invariant calculation affect the same trajectory-intersection path.
  - Plan delta (what changed): Added focused implementation/testing and independent review tasks.
  - Tradeoffs considered: Separate commits would split one mathematical invariant across dependent changes.
  - User approval: yes; the user requested repeated fixes through a clean hook result.

- 2026-07-16 01:58 Decision: Express the relative coordinate as candidate left minus comment left.
  - Trigger / new insight: The first bound-only correction used the opposite sign from the helper's actual displacement expression.
  - Plan delta (what changed): Inverted and renamed the helper and strengthened the regression with asymmetric widths and start times.
  - Tradeoffs considered: Reverting to the old bounds would be mathematically equivalent but would not align the helper name and hook finding with the rendered coordinate definition.
  - User approval: yes; this remains within the requested review-fix loop.

## Notes
- Risks: Off-by-one behavior at region boundaries and accidental changes to the same-duration fast path.
- Edge cases: Unequal widths, unequal durations, overlap only before region entry, and overlap at a judgment boundary.
