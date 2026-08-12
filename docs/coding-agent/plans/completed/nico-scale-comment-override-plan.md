# Plan: Per-comment `nico:scale` render override

- status: done
- generated: 2026-08-12
- last_updated: 2026-08-12
- work_type: mixed

## Goal
- Add format-independent `nico:scale:<number>` support as an absolute per-comment render-scale override while preserving all behavior when the command is absent or invalid.

## Definition of Done
- Valid decimal values in `(0, 8]` parse from normalized comment commands, with the first valid value winning.
- HTML5 and Flash measurement, allocation, rendering, collision geometry, and Flash button hit testing use one effective render scale.
- Explicit comment scale overrides `options.scale` and applies to comments on non-default/keepCA layers.
- Invalid commands are ignored safely and existing no-command behavior remains unchanged.
- Public English and Japanese documentation describes syntax, range, absolute semantics, and precedence.
- Required focused, type, lint, unit, build, review, and rendering validation pass.

## Scope / Non-goals
- Scope:
  - Shared custom-command parsing and internal render-scale propagation.
  - HTML5 and Flash scale consumers.
  - Focused unit/regression coverage and public custom-command documentation.
- Non-goals:
  - Input-format schema changes.
  - Callbacks, layer maps, owner-specific controls, or plugin API changes.
  - Changes to the default or semantics of `options.scale` when `nico:scale` is absent.
  - Unrelated renderer/resource refactors.

## Context (workspace)
- Related files/areas: `src/utils/comment.ts`, `src/@types/types.ts`, `src/comments/BaseComment.ts`, `src/comments/HTML5Comment.ts`, `src/comments/FlashComment.ts`, `tests/unit/**`, `docs/index.html`, `docs/localize.js`.
- Existing patterns or references: `nico:opacity:*` parsing and documentation; current layer-dependent option scale expressions in HTML5 and Flash comments.
- Repo reference docs consulted: `docs/coding-agent/lessons.md`; repository rule suite under `docs/coding-agent/rules/` is absent, so package scripts and GitHub workflows are the validation source.

## Open Questions (max 3)
- None.

## Assumptions
- A1: `nico:scale` is an absolute scale relative to the original comment size, not a multiplier of `options.scale`.
- A2: Accepted syntax is unsigned decimal notation including `.5`; signs, exponent notation, non-finite values, zero, values above 8, and trailing junk are ignored.
- A3: Raw mail is already part of the image-cache key, so explicit scale commands do not require a separate cache-key field.

## Tasks

### Task_1: Implement and document the per-comment render-scale override
- type: impl
- owns:
  - src/@types/types.ts
  - src/utils/comment.ts
  - src/comments/BaseComment.ts
  - src/comments/HTML5Comment.ts
  - src/comments/FlashComment.ts
  - tests/unit/**
  - docs/index.html
  - docs/localize.js
- depends_on: []
- description: |
  Parse a dedicated per-comment render scale, centralize effective-scale selection, route every HTML5/Flash scale-sensitive path through it, add regression tests, and document the command.
- acceptance:
  - `nico:scale:<number>` accepts unsigned decimals in `(0, 8]`, ignores invalid values, and uses the first valid occurrence.
  - The public override uses a dedicated internal field and does not reuse the existing line-break/overflow resize `scale` field.
  - Explicit scale overrides global/layer fallback in HTML5 and Flash, including `layer !== -1`; no-command behavior remains byte-for-byte equivalent in intent.
  - Measurement, image bounds/transform, collision dimensions/guides, and Flash hover coordinates use one effective scale definition.
  - Tests cover syntax/range, precedence, both render modes, non-default layers, and Flash hover alignment.
  - English and Japanese docs describe syntax, examples, range, absolute semantics, and precedence.
- validation:
  - kind: unit
    required: true
    owner: worker
    detail: "Run focused Vitest tests for the new command with a positive executed-test count."
  - kind: typecheck
    required: true
    owner: worker
    detail: "Run `rtk pnpm check-types`."
  - kind: lint
    required: true
    owner: orchestrator
    detail: "Run `rtk pnpm lint`."
  - kind: full-unit
    required: true
    owner: orchestrator
    detail: "Run `rtk pnpm test:unit`."
  - kind: build
    required: true
    owner: orchestrator
    detail: "Run `rtk pnpm build`."

### Task_2: Independently review behavior and rendering evidence
- type: review
- owns: []
- depends_on: [Task_1]
- description: |
  Review the completed implementation against acceptance criteria and independently validate representative HTML5 and Flash rendering behavior.
- acceptance:
  - Reviewer confirms all duplicated legacy layer-scale consumers now share the same command-aware effective scale.
  - Reviewer confirms invalid/absent commands preserve compatibility and explicit commands override keepCA/non-default layer suppression.
  - Reviewer records focused rendering evidence for one HTML5 and one Flash comment at a non-default command scale, including no unexpected console errors.
  - Reviewer status is APPROVED.
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "Review the diff and focused unit evidence against every acceptance criterion."
  - kind: e2e
    required: true
    owner: reviewer
    detail: "Run the repository Playwright/render-equivalence path for representative HTML5 and Flash scaled comments, or provide an explicit evidence-backed waiver if the existing harness cannot isolate the command."

## Task Waves (explicit parallel dispatch sets)

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]

## E2E / Visual Validation Spec

- provider: repository Playwright test runner
- artifact_root: `test-results/`
- base_url: repository-managed test server
- app_start_command: repository Playwright configuration
- readiness_check: repository Playwright web-server readiness
- flows:
  - Render one HTML5 comment with `options.scale` differing from `nico:scale` and verify the explicit scale wins.
  - Render one Flash comment, including button/hit-test behavior where supported, and verify visual/cursor alignment at explicit scale.
- viewports: repository defaults
- evidence_requirements: command result, representative artifact or deterministic render assertion, and console-error note
- known_flakiness: full visual snapshots may vary by browser/font environment; prefer existing deterministic equivalence fixtures where available

## Rollback / Safety
- Remove the command parser field/helper, restore the legacy layer-scale expressions, remove focused tests/docs, and leave `options.scale` unchanged.

## Progress Log (append-only)

- 2026-08-12 Wave 0 completed: research and plan approval
  - Summary: Read-only research mapped parsing, scale consumers, compatibility constraints, and CI validation; user explicitly directed implementation.
  - Validation evidence: Exact call-site inventory across HTML5, Flash, shared collision geometry, cache behavior, tests, and workflows.
  - Notes: Repository rule suite is absent; package scripts and CI workflows define inferred required checks.

- 2026-08-12 Wave 1 completed with an environment-command waiver: [Task_1]
  - Summary: Added parser/type propagation, centralized effective scale, updated HTML5/Flash consumers, added focused regression coverage, and documented the command in English and Japanese.
  - Validation evidence: Targeted tests 20/20; related HTML5/Flash suites 62/62; full unit suite 219/219; direct tsc, docs-version/Biome, and rolldown build commands passed; `git diff --check` passed.
  - Notes: Standard and nested pnpm invocations fail before script execution because `pnpm-workspace.yaml` lacks a packages entry. The Orchestrator accepted equivalent `--ignore-workspace`/direct-binary evidence; no tracked dependency metadata changed. Reviewer must pay particular attention to debug collision-guide scale arithmetic and absent-command compatibility.

- 2026-08-12 Wave 2 completed after review follow-up: [Task_2]
  - Summary: Reviewer found an HTML5 collision-guide double-scale defect; the follow-up corrected HTML5/Flash explicit-versus-fallback guide arithmetic and added exact `strokeRect` regressions.
  - Validation evidence: Focused tests 24/24; full unit suite 223/223; direct tsc, docs-version/Biome over 74 files, JS build, DTS build, and `git diff --check` passed. Direct local browser probes rendered HTML5 and Flash command scale 2 on a non-default layer and verified Flash hover alignment; artifacts exist under `test-results/nico-scale-review/`.
  - Notes: Reviewer delta re-review status APPROVED with no remaining findings. Repository-managed Firefox was unavailable, so the plan accepts the feature-specific direct Playwright artifacts plus deterministic renderer tests as the E2E-path waiver.

## Decision Log (append-only; re-plans and major discoveries)

- 2026-08-12 Decision: Implement only global and per-comment scale controls.
  - Trigger / new insight: Layer IDs are not a stable general public control surface, while all formats already normalize commands into comment mail.
  - Plan delta (what changed): Rejected input-format extensions, callbacks, layer maps, and owner-specific options in favor of `nico:scale:<number>`.
  - Tradeoffs considered: Users perform thread/fork batch assignment before passing input; the library keeps a small format-independent API.
  - User approval: yes, via explicit instruction to proceed with `nico:scale:<number>`.

- 2026-08-12 Decision: Accept equivalent validation commands for the malformed pnpm workspace boundary.
  - Trigger / new insight: The checked-in workspace metadata causes normal pnpm commands to fail before invoking tsc, Biome, Vitest, or rolldown.
  - Plan delta (what changed): Required validation content remains unchanged, but evidence comes from `--ignore-workspace` or the exact direct binaries underlying package scripts.
  - Tradeoffs considered: Repairing workspace metadata is unrelated scope and could alter repository-wide package behavior; direct commands validate this change without that expansion.
  - User approval: no additional approval required; this is an evidence-backed Orchestrator validation waiver, not a product-scope change.

- 2026-08-12 Decision: No ADR proposed for the scale-control surface.
  - Trigger / new insight: Closeout ADR warrant sweep considered the global-plus-comment command decision and its rejected input/layer/callback alternatives.
  - Plan delta (what changed): None; the plan Decision Log and public command documentation remain the appropriate homes.
  - Tradeoffs considered: The decision is externally observable but inexpensive to re-derive from the existing command namespace and cheap to revise through normal API review, so it does not meet the costly-to-detect-or-undo ADR threshold.
  - User approval: not applicable; no ADR persistence was proposed.

## Notes
- Risks: A missed duplicated scale expression could desynchronize measurement, rasterization, collision placement, or Flash hover coordinates.
- Edge cases: Fixed-comment overflow resizing, keepCA layers, duplicate commands, decimal aliases in cache keys, and bounded canvas allocation.
