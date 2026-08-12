# Plan: Decouple keepCA scale preservation from comment layer

- status: done
- generated: 2026-08-12
- last_updated: 2026-08-12
- work_type: code

## Goal
- Make keepCA scale preservation explicit instead of inferring it from the numeric collision layer.

## Definition of Done
- Only comments classified by `changeCALayer` are protected from global `options.scale`.
- Manually supplied non-default layers receive global `options.scale` because layer is collision metadata only.
- `nico:scale:<number>` remains the highest-precedence absolute override.
- No public input field or option is added for the internal keepCA classification.
- Focused, type, lint, full-unit, build, and independent review checks pass.

## Scope / Non-goals
- Scope:
  - Internal keepCA classification state, context propagation, effective-scale selection, tests, and affected keepCA/scale documentation.
- Non-goals:
  - Changing comment-art scoring, grouping, layer allocation, or duplicate removal.
  - Applying keepCA classification to comments added later through `addComments`.
  - Adding a public callback, input field, layer map, or option.

## Context (workspace)
- Related files/areas: `src/contexts/instanceContext.ts`, `src/main.ts`, `src/utils/commentArt.ts`, `src/comments/BaseComment.ts`, renderer/context test factories, `docs/localize.js`.
- Existing patterns or references: `changeCALayer` preserves surviving object identity through construction; `BaseComment` currently infers scale preservation from `layer === -1`.
- Repo reference docs consulted: `docs/coding-agent/lessons.md` and the completed `nico:scale` plan. Repository rule files are absent, so package scripts and CI workflows remain the validation source.

## Open Questions (max 3)
- None.

## Assumptions
- A1: The user's correction authorizes the intentional compatibility change for manually layered comments.
- A2: A required internal `WeakSet<FormattedComment>` is preferable to an optional field or public comment metadata because source object identity survives `changeCALayer` through comment construction.
- A3: Dynamic `addComments` behavior remains unchanged because it does not currently run keepCA classification.

## Tasks

### Task_1: Introduce explicit keepCA scale-preservation state
- type: impl
- owns:
  - src/contexts/instanceContext.ts
  - src/main.ts
  - src/utils/commentArt.ts
  - src/comments/BaseComment.ts
  - tests/unit/comment-art-resource-bounds.spec.ts
  - tests/unit/html5-resource-bounds.spec.ts
  - tests/unit/flash-resource-bounds.spec.ts
  - tests/unit/duration-lazy.spec.ts
  - tests/unit/nicoscript-range.spec.ts
  - tests/unit/destroy-lifecycle.spec.ts
  - tests/bench/helpers.ts
  - docs/localize.js
- depends_on: []
- description: |
  Track comments actually classified by keepCA in an internal WeakSet, snapshot that state before renderer conversion, and remove layer-based scale inference.
- acceptance:
  - `changeCALayer` marks only surviving comments it actually assigns to CA layers.
  - `BaseComment.getEffectiveScale` uses explicit `nico:scale`, then keepCA preservation, then global `options.scale`, without reading `layer`.
  - Unmarked non-default layers receive global scale in HTML5 and Flash.
  - Marked keepCA comments remain at scale 1 unless `nico:scale` overrides them.
  - The internal context invariant is required and every context factory is updated.
  - Documentation describes keepCA classification rather than implying all non-default layers suppress scale.
- validation:
  - kind: command
    required: true
    owner: worker
    detail: "Run focused comment-art, HTML5, and Flash Vitest coverage with a positive executed-test count."
  - kind: command
    required: true
    owner: worker
    detail: "Run direct TypeScript validation and targeted Biome checks using the established --ignore-workspace/direct-binary route."
  - kind: command
    required: true
    owner: orchestrator
    detail: "Run full unit, docs/lint, build, and git diff checks after integration."

### Task_2: Independently review the decoupled scale policy
- type: review
- owns: []
- depends_on: [Task_1]
- description: |
  Review the follow-up diff and independently verify object-identity marking, precedence, compatibility, and geometry regressions.
- acceptance:
  - Reviewer confirms no scale decision depends on numeric layer values.
  - Reviewer confirms actual keepCA classification and manual-layer behavior are separately tested.
  - Reviewer confirms `nico:scale` precedence and existing collision/hover geometry remain correct.
  - Reviewer status is APPROVED.
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "Review the diff and required evidence against every acceptance criterion."
  - kind: command
    required: true
    owner: reviewer
    detail: "Run focused tests and TypeScript validation independently."

## Task Waves (explicit parallel dispatch sets)

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]

## Rollback / Safety
- Revert the follow-up commit to restore layer-sentinel scale selection without rewriting the existing PR branch history.

## Progress Log (append-only)

- 2026-08-12 Wave 0 completed: follow-up research and plan approval
  - Summary: Research confirmed surviving comment identity is stable from `changeCALayer` into `BaseComment`, allowing an internal WeakSet without public API changes.
  - Validation evidence: Exhaustive context-construction and direct-call inventory plus scale-consumer search.
  - Notes: User explicitly requested a keepCA-specific flag instead of the non-intuitive layer condition; this is treated as approval for the compatibility adjustment to manually layered comments.

- 2026-08-12 Wave 1 completed: [Task_1]
  - Summary: Added the required internal WeakSet, marked only CA-classified survivors during layer assignment, snapshotted membership before conversion, and removed layer from effective-scale selection.
  - Validation evidence: Focused comment-art/HTML5/Flash tests passed 72/72; direct TypeScript, targeted Biome over all changed files, and `git diff --check` passed.
  - Notes: All changed files stayed within Task_1 ownership. No blockers or contract questions remain; proceed to independent review.

- 2026-08-13 Wave 2 and closeout completed: [Task_2]
  - Summary: Independent review approved the identity-based classification, precedence, compatibility behavior, complete context/caller inventory, and documentation.
  - Validation evidence: Reviewer APPROVED with score 8/8; focused tests passed 72/72; full unit suite passed 224/224; direct TypeScript, docs-version check, canonical Biome check over 74 source files, JS build, DTS build, and `git diff --check` passed.
  - Notes: An optional repository-root Biome diagnostic still reports pre-existing sample formatting and accessibility findings outside the canonical `pnpm lint` scope. No required validation or product blocker remains.

## Decision Log (append-only; re-plans and major discoveries)

- 2026-08-12 Decision: Track actual keepCA classification by object identity.
  - Trigger / new insight: Numeric layer values describe collision grouping and do not explain why a comment should ignore global scale.
  - Plan delta (what changed): Add an internal WeakSet marker, snapshot membership before comment conversion, and make layer irrelevant to scale selection.
  - Tradeoffs considered: A public field leaks internal policy; symbols mutate user-shaped data; IDs are not reliable; a required WeakSet adds mechanical context-factory updates but keeps the invariant explicit.
  - User approval: yes, via the explicit follow-up correction to separate keepCA state from layer ID.

- 2026-08-13 Decision: No ADR proposed for the internal classification carrier.
  - Trigger / new insight: Closeout reviewed whether the WeakSet state boundary warranted a durable architecture record.
  - Plan delta (what changed): None; the internal mechanism is local, directly represented by types/tests, and inexpensive to revise.
  - Tradeoffs considered: An ADR would duplicate implementation-level rationale already captured by the plan and tests without preserving a costly external contract decision.
  - User approval: not applicable; no ADR persistence was proposed.

## Notes
- Risks: WeakSet membership must be checked before the renderer replaces the source object; collision guides mix raw and already-scaled fields and retain exact regression assertions.
- Edge cases: Deduplicated comments must not be marked, explicit command scale must override preservation, and `addComments` remains outside keepCA classification.
