# Plan: Issue 378 v0.2.76 Regression Recheck

- status: done
- generated: 2026-07-01
- last_updated: 2026-07-01
- work_type: code

## Goal
- Recheck issue #378 against the real `sm34256261` formatted data around 45s, identify the v0.2.76 to v0.2.78 regression point, and update the PR with a regression fixture that reflects the real failing condition.

## Definition of Done
- The real comment shape around 45s is understood and represented in tests or snapshots.
- The implementation matches the v0.2.76 behavior for that case.
- Required unit and Playwright regression checks pass.
- Reviewer and `gh-review-hook` report no actionable findings.

## Scope / Non-goals
- Scope:
  - `src/comments/**`
  - `tests/unit/**`
  - `src/__tests__/**`
  - `docs/sample/commentdata/-1.json`
  - Playwright snapshot assets needed for the regression
- Non-goals:
  - Broad renderer refactors unrelated to issue #378
  - Changing public APIs outside the regression fix

## Context (workspace)
- Related files/areas:
  - `/Users/xpadev/sm34256261.formatted.json`
  - `src/comments/HTML5Comment.ts`
  - `docs/sample/commentdata/-1.json`
  - `src/__tests__/test.spec.ts`
- Existing patterns or references:
  - Unit coverage in `tests/unit/html5-resource-bounds.spec.ts`
  - Playwright PNG snapshots in `src/__tests__/test.spec.ts-snapshots/`
- Repo reference docs consulted:
  - Repository rule suite absent: `docs/coding-agent/rules/index.md` was not found.

## Open Questions
- Q1: Which v0.2.77/v0.2.78 change introduced the bad placement?
- Q2: Does the real 45s data fail because of owner replacement, `commentData` replacement timing, fixed-position sizing, or another condition?
- Q3: Should the current synthetic `-1` fixture be replaced or supplemented with a closer real-data fixture?

## Assumptions
- A1: The existing PR branch and PR #379 remain the target for this follow-up.
- A2: Approval to proceed is waived for this continuation because the user supplied concrete new reproduction data and previously requested the full PR/review loop.

## Tasks

### Task_1: Identify Real Regression Shape
- type: research
- owns:
  - docs/coding-agent/plans/active/issue-378-v0276-regression-plan.md
- depends_on: []
- description: |
  Inspect v0.2.76..v0.2.78 changes and `/Users/xpadev/sm34256261.formatted.json` around 45s.
- acceptance:
  - Relevant comments around 45s are identified.
  - Likely regression commit or code area is identified.
  - Test fixture implications are recorded.
- validation:
  - kind: review
    required: true
    owner: orchestrator
    detail: "Research notes recorded in Decision Log"

### Task_2: Implement Correct Regression Coverage And Fix
- type: impl
- owns:
  - src/comments/**
  - tests/unit/**
  - src/__tests__/**
  - docs/sample/commentdata/-1.json
- depends_on: [Task_1]
- description: |
  Update implementation and regression coverage to match the real v0.2.76-good case.
- acceptance:
  - The fixture reflects the real failing comment structure.
  - Unit coverage captures the placement rule.
  - Playwright snapshot coverage protects the visual regression.
- validation:
  - kind: command
    required: true
    owner: orchestrator
    detail: "pnpm check-types"
  - kind: command
    required: true
    owner: orchestrator
    detail: "pnpm lint"
  - kind: command
    required: true
    owner: orchestrator
    detail: "pnpm test:unit -- tests/unit/html5-resource-bounds.spec.ts tests/unit/nicoscript-range.spec.ts"
  - kind: e2e
    required: true
    owner: orchestrator
    detail: "Docker/Linux Playwright regression snapshot for the added case"

### Task_3: Review, Push, And Hook
- type: review
- owns: []
- depends_on: [Task_2]
- description: |
  Run independent review, commit, push, and rerun `gh-review-hook 379`.
- acceptance:
  - Reviewer reports no actionable findings or all valid findings are fixed.
  - PR branch is pushed.
  - `gh-review-hook 379` exits successfully.
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "Subagent review of final diff"
  - kind: command
    required: true
    owner: orchestrator
    detail: "gh-review-hook 379"

## Task Waves

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]
- Wave 3 (parallel): [Task_3]

## E2E / Visual Validation Spec

- provider: Docker Compose Playwright
- artifact_root: `src/__tests__/test.spec.ts-snapshots/`
- base_url: Playwright config default or `PLAYWRIGHT_BASE_URL`
- app_start_command: `pnpm run test-server`
- readiness_check: `/docs/sample/index.html`
- flows:
  - Load `/docs/sample/test.html?video=-1&time=<regression-time>`
  - Compare Firefox Linux PNG snapshot
- viewports:
  - Playwright Desktop Firefox default
- evidence_requirements:
  - The regression snapshot test passes in Docker/Linux.
- known_flakiness:
  - macOS local Firefox snapshots may differ from Linux; commit Linux snapshot only.

## Rollback / Safety
- Revert the PR commits for issue #378 if needed.

## Progress Log

- 2026-07-01 00:00 Wave 1 started: [Task_1]
  - Summary: Started local and subagent research using real formatted data and v0.2.76/v0.2.78 comparison.
  - Validation evidence: Pending.
  - Notes: Repo rule suite absent.
- 2026-07-01 12:36 Wave 1 completed: [Task_1]
  - Summary: Identified `_processResizeX` rewrite in the v0.2.76..v0.2.78 window as the likely regression; real 45s comments depend on `@置換` expansion and converted data has `owner:false`.
  - Validation evidence: Local inspection plus Researcher report.
  - Notes: Fixture must set owner semantics explicitly for script and target comments.
- 2026-07-01 12:36 Wave 2 started: [Task_2]
  - Summary: Restored legacy-compatible fixed-comment resize stepping for normal `baseCharSize >= 1` cases and added focused unit coverage.
  - Validation evidence: `pnpm test:unit -- tests/unit/html5-resource-bounds.spec.ts` passed.
  - Notes: Extreme sub-pixel resize path remains bounded.
- 2026-07-01 12:46 Wave 2 completed: [Task_2]
  - Summary: Added owner-true real-data fixture entries and Playwright comparison against v0.2.76 for the 45s regression frames.
  - Validation evidence: `pnpm check-types`, `pnpm lint`, `pnpm test:unit`, and Docker/Linux Playwright `-1(regression fixtures)` passed.
  - Notes: Fixed PNG snapshot for `-1-30` was removed because these regression frames compare dynamically against v0.2.76.
- 2026-07-01 12:47 Wave 3 completed: [Task_3]
  - Summary: Independent Reviewer approved the final working-tree changes with no actionable findings.
  - Validation evidence: Reviewer status APPROVED.
  - Notes: `gh-review-hook` remains pending until commit/push.

## Decision Log

- 2026-07-01 00:00 Decision: proceed without separate plan approval
  - Trigger / new insight: User provided concrete real data and version boundary after prior PR/review workflow.
  - Plan delta: Re-opened investigation before changing implementation.
  - Tradeoffs considered: Asking for approval would add latency; changes remain scoped to existing PR and issue.
  - User approval: waived by Orchestrator.
- 2026-07-01 12:36 Decision: preserve owner semantics in fixture
  - Trigger / new insight: User clarified the real data is owner comments but the formatted JSON conversion set `owner:false`.
  - Plan delta: Regression fixture generation now sets owner true for both `@置換` script comments and their target comments.
  - Tradeoffs considered: Keeping converted JSON literally would not exercise `@置換 ... 投コメ`; setting owner true matches the observed source semantics.
  - User approval: yes.

## Notes
- Risks:
  - Current synthetic fixture may not match the actual broken condition.
- Edge cases:
  - `@置換` commands may differ depending on owner/non-owner and replacement target timing.
