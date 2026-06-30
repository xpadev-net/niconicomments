# Plan: Issue 378 HTML5 Owner Replace Position

- status: in_progress
- generated: 2026-06-30
- last_updated: 2026-06-30
- work_type: code

## Goal
- Fix the HTML5 renderer regression where owner comments affected by `@置換` can render higher than expected after fixed-comment width resize.

## Definition of Done
- Owner `@置換` fixed-comment resize case has regression coverage.
- HTML5 offscreen top padding no longer shifts the logical comment draw position.
- Focused unit tests, typecheck, independent review, PR creation, and `gh-review-hook` pass.

## Scope / Non-goals
- Scope:
  - `src/comments/HTML5Comment.ts`
  - focused unit tests around HTML5 text image draw position and NicoScript replacement.
- Non-goals:
  - Visual snapshot baseline refresh.
  - Broader resize algorithm changes unrelated to issue #378.

## Context (workspace)
- Related files/areas:
  - `src/comments/HTML5Comment.ts`
  - `src/comments/BaseComment.ts`
  - `tests/unit/html5-resource-bounds.spec.ts`
  - `tests/unit/nicoscript-range.spec.ts`
- Existing patterns or references:
  - `d134f42a` introduced HTML5 offscreen top padding draw compensation.
  - Issue #378 reports v0.3.0 does not exhibit the upward shift.
- Repo reference docs consulted:
  - `AGENTS.md`
  - orchestration harness skill
  - plan-format skill
  - git-workflow skill

## Open Questions
- None.

## Assumptions
- The existing issue screenshots correctly identify the regression as the `_draw` `paddingTop` compensation.
- Focused unit tests are acceptable local evidence; Playwright visual snapshots remain CI-owned for this repository unless hook feedback requires otherwise.

## Tasks

### Task_1: Fix HTML5 owner replace draw position
- type: impl
- owns:
  - `src/comments/HTML5Comment.ts`
  - `tests/unit/html5-resource-bounds.spec.ts`
- depends_on: []
- description: |
  Adjust HTML5 text-image padding compensation so the logical fixed-comment draw position is not shifted upward, and add regression coverage for the owner `@置換` resize scenario.
- acceptance:
  - HTML5 offscreen top padding can still reserve image space for tiny resized fixed comments.
  - Drawing uses the caller-provided logical `posY` for the issue scenario instead of `posY - paddingTop`.
  - Regression test covers owner `@置換` targeting `投コメ` and resulting fixed-comment resize.
  - Existing resource-bound behavior remains covered or intentionally updated.
- validation:
  - kind: command
    required: true
    owner: orchestrator
    detail: "`rtk pnpm test:unit -- tests/unit/html5-resource-bounds.spec.ts tests/unit/nicoscript-range.spec.ts`"
  - kind: command
    required: true
    owner: orchestrator
    detail: "`rtk pnpm check-types`"

### Task_2: Independent review and PR hook
- type: review
- owns: []
- depends_on: [Task_1]
- description: |
  Run an independent review pass and iterate on findings, then create a PR and run `gh-review-hook` until no actionable findings remain.
- acceptance:
  - Subagent review reports no unresolved actionable findings.
  - Commits are made from the feature branch, pushed, and a PR is opened.
  - `gh-review-hook` completes without actionable findings.
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "Subagent review of the final diff"
  - kind: command
    required: true
    owner: orchestrator
    detail: "`gh-review-hook` on the opened PR"

## Task Waves

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]

## Rollback / Safety
- Revert the feature branch commit(s) or close the PR if review finds the approach incompatible with existing visual baselines.

## Progress Log

- 2026-06-30 14:45 Wave 1 started: [Task_1]
  - Summary: Created feature branch and began focused implementation.
  - Validation evidence: pending.
  - Notes: Repository rule suite was absent at `docs/coding-agent/rules`.
- 2026-06-30 14:47 Wave 1 completed: [Task_1]
  - Summary: Removed the HTML5 `_draw` y-offset override and added owner `@置換` fixed-resize regression coverage.
  - Validation evidence:
    - `rtk pnpm test:unit -- tests/unit/html5-resource-bounds.spec.ts tests/unit/nicoscript-range.spec.ts` passed.
    - `rtk pnpm check-types` passed.
    - `rtk pnpm lint` passed.
    - `rtk pnpm test:unit` passed.
  - Notes: The padded offscreen image height remains reserved by `canGenerateTextImage()` and `_generateTextImage()`.
- 2026-06-30 14:48 Wave 2 review completed: [Task_2]
  - Summary: Subagent reviewer approved the diff with no actionable findings.
  - Validation evidence:
    - Reviewer status: APPROVED.
  - Notes: PR creation and `gh-review-hook` are still pending.

## Decision Log

- 2026-06-30 14:45 Decision:
  - Trigger / new insight: User explicitly requested branch, review loop, PR, and hook workflow.
  - Plan delta: Proceeded without separate approval because user requested execution steps directly.
  - Tradeoffs considered: Unit regression coverage first; visual snapshots left to CI/hook unless requested.
  - User approval: yes.

## Notes
- Risks:
  - Existing unit coverage currently expects the upward draw offset for long HTML5 fixed comments; updating that expectation must preserve the underlying image-space padding behavior.
- Edge cases:
  - Very small resized fixed comments.
  - Owner-targeted `@置換` with `投コメ`.
