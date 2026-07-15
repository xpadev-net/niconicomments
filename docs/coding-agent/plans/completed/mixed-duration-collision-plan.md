# Plan: Mixed-duration movable comment collision detection

- status: done
- generated: 2026-07-15
- last_updated: 2026-07-15
- work_type: code

## Goal
- Prevent movable comments with different normalized durations from overlapping between the existing left/right collision lines while preserving the current fast path for equal-duration comments.

## Definition of Done
- Equal-`long` pairs retain the existing left/right collision behavior.
- Different-`long` pairs are separated when their continuous horizontal trajectories intersect during their shared active interval.
- Public types and exported function signatures remain unchanged.
- Required correctness, performance, build, and visual validations pass and an independent Reviewer approves the change.

## Scope / Non-goals
- Scope: movable `naka` comment positioning, targeted unit coverage, and collision benchmarks.
- Non-goals: changing fixed comment placement, `@逆` semantics, public configuration, or public collision types.

## Context (workspace)
- Related files/areas: `src/utils/comment.ts`, `tests/unit/`, `tests/bench/collision.bench.ts`.
- Existing pattern: speed is derived from width and normalized `long`; collision placement currently samples occupancy at two vertical lines.
- Repo reference docs consulted: repository rule suite absent; validation inferred from `package.json` and `.github/workflows/`.

## Open Questions (max 3)
- None.

## Assumptions
- Normalized `comment.long`, not computed pixel velocity, selects the fast path.
- Missing `@` and `@3` both normalize to `300` and use the existing path.
- Existing reverse-direction collision semantics remain unchanged.

## Tasks

### Task_1: Implement hybrid movable collision detection
- type: impl
- owns:
  - `src/utils/comment.ts`
- depends_on: []
- description: |
  Add a private, collision-instance-scoped temporal candidate index. Keep existing left/right placement for equal-duration comments and add analytic shared-interval trajectory collision checks only for different-duration candidates.
- acceptance:
  - Same-`long` candidates do not enter the analytic full-interval path.
  - Different-`long` candidates that overlap horizontally anywhere in their shared active interval participate in vertical placement.
  - Candidate lookup avoids all-comment scans by using 100-centisecond temporal buckets with per-comment deduplication.
  - Existing collision padding, owner/layer filtering, lazy reprocessing, timeline population, collision visualization buckets, and `addComments()` behavior remain intact.
  - No exported signature or public type changes.
- validation:
  - kind: command
    required: true
    owner: worker
    detail: `pnpm check-types`
  - kind: review
    required: true
    owner: reviewer
    detail: Review analytic interval correctness, hot-path behavior, index lifetime, and public API compatibility.

### Task_2: Add regression and performance coverage
- type: test
- owns:
  - `tests/unit/movable-collision.spec.ts`
  - `tests/bench/collision.bench.ts`
- depends_on: [Task_1]
- description: |
  Add focused regression cases for mixed durations and benchmark equal-duration and dense mixed-duration workloads.
- acceptance:
  - A slow short leading comment and later normal comment that meet only in the center are placed on different rows.
  - Different-duration trajectories that do not intersect may share a row.
  - Equal-duration, default-versus-`@3`, owner/layer, lazy reprocessing, and dynamic-order cases preserve expected behavior.
  - Benchmarks cover 1000 equal-duration comments and 1000 dense mixed-duration comments.
- validation:
  - kind: command
    required: true
    owner: worker
    detail: `pnpm test:unit` with a positive executed-test count.
  - kind: performance
    required: true
    owner: orchestrator
    detail: Compare collision benchmark results across five comparable runs; equal-duration median regression must be <=10%, mixed-duration must remain <=2x baseline.

### Task_3: Independent review and visual acceptance
- type: review
- owns: []
- depends_on: [Task_1, Task_2]
- description: |
  Independently review the diff, run required repository checks, and visually validate the mixed-duration scenario.
- acceptance:
  - Reviewer status is APPROVED.
  - Required command checks pass.
  - Required visual artifact exists and shows separate rows at the center-intersection timestamp.
- validation:
  - kind: command
    required: true
    owner: reviewer
    detail: `pnpm check-types`, `pnpm test:unit`, `pnpm lint`, and `pnpm build`.
  - kind: e2e
    required: true
    owner: reviewer
    detail: Run the E2E specification below and verify the artifact on disk.

## Task Waves (explicit parallel dispatch sets)
- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]
- Wave 3 (parallel): [Task_3]

## E2E / Visual Validation Spec
- provider: playwright-cli
- artifact_root: `.playwright-cli`
- base_url: `http://127.0.0.1:8080`
- app_start_command: `pnpm build`, then `pnpm test-server -- -p 8080`
- readiness_check: `http://127.0.0.1:8080/docs/sample/test.html?video=-1&time=0` returns and `#loaded` appears.
- flows: Inject a deterministic `@10` short leading comment plus a later default-duration comment into the sample canvas, draw at their center-intersection timestamp, and confirm they occupy separate rows.
- viewports: desktop 1920x1080.
- evidence_requirements: `.playwright-cli/mixed-duration-collision.png`, no console errors, and no failed local asset requests.
- known_flakiness: Wait for BrowserSync notification detachment before capture.

## Rollback / Safety
- Revert the implementation and its focused tests; no persisted data, migrations, or public contracts are involved.

## Progress Log (append-only)
- 2026-07-15 15:45 Plan approved and execution started.
  - Summary: User approved the hybrid `long`-based strategy.
  - Validation evidence: Baseline `pnpm check-types` and `pnpm test:unit` passed before execution.
  - Notes: Repository rule suite is absent; existing untracked `.serena/` is preserved.
- 2026-07-15 16:05 Wave 1 completed: [Task_1].
  - Summary: Added a private Collision-keyed 100-centisecond temporal index and analytic mixed-duration trajectory checks in the existing fixed-point placement loop.
  - Validation evidence: Worker `pnpm check-types`, file-scoped Biome check, and orchestrator scope/diff inspection passed.
  - Notes: Only `src/utils/comment.ts` changed; public exports and signatures remain unchanged; no blockers or rule candidates.
- 2026-07-15 16:25 Wave 2 completed: [Task_2].
  - Summary: Added eight focused movable-collision regression tests and explicit 1000-comment equal/mixed-duration benchmarks.
  - Validation evidence: Focused 8/8, full unit suite 197/197, `pnpm check-types`, file-scoped Biome, and benchmark smoke passed. Five-run medians: equal-duration baseline 32.8791ms versus current 32.8042ms (-0.23%); mixed-duration baseline 39.5354ms versus current 60.3396ms (1.53x).
  - Notes: Performance gates passed. The initial non-intersection fixture also hit the legacy sampled line and was corrected without a plan or scope change; no durable rule promotion is needed.
- 2026-07-15 16:45 Wave 3 completed: [Task_3].
  - Summary: Independent deep review found no findings and returned APPROVED after command and visual validation.
  - Validation evidence: Reviewer `pnpm check-types`, 197/197 unit tests, `pnpm lint`, and `pnpm build` passed. `.playwright-cli/mixed-duration-collision.png` is a readable 1920x1084 PNG showing separate rows; positions were 0 and 92.3174 with no console errors or failed requests.
  - Notes: The existing Playwright Firefox suite could not launch reliably in this environment, so the required deterministic browser flow was completed with installed headless Chromium against the same built bundle; no source or snapshot files were changed for the probe.

## Decision Log (append-only; re-plans and major discoveries)
- 2026-07-15 15:45 Decision: use normalized `comment.long` as the fast-path discriminator.
  - Trigger / new insight: Computed pixel speed also varies with comment width, so speed equality would route normal comments into the expensive path.
  - Plan delta (what changed): Analytic full-interval checks apply only to different normalized durations.
  - Tradeoffs considered: Full scanning, adding a center point, and targeted duration-based analytic checks.
  - User approval: yes.
- 2026-07-15 16:45 Decision: complete the deterministic visual flow with installed headless Chromium.
  - Trigger / new insight: The configured Firefox runner and initial standalone Firefox/Chromium attempts could not complete in the sandbox, while a minimal same-origin Chromium probe was reliable.
  - Plan delta (what changed): The same 1920x1080 flow and artifact requirements were executed through the local Playwright library instead of the `playwright-cli` wrapper.
  - Tradeoffs considered: Waiving visual evidence versus preserving the required flow with an equivalent local browser engine.
  - User approval: no; Orchestrator-approved validation-provider substitution with equivalent evidence and independent Reviewer approval.

## Notes
- Risks: hot-path allocations, candidate-index lifetime, fixed-point interaction between legacy and analytic collisions, and accidental public declaration changes.
- Edge cases: equal normalized duration, no shared active interval, coincident trajectories, lazy reprocessing, owner/layer separation, and comments wider than the canvas.
