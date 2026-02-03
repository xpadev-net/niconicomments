# Improve Rendering And Parsing Performance

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository contains `.agent/PLANS.md`. This ExecPlan must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this change, large comment datasets load faster and frame rendering does less per-frame work without changing visible behavior. A user can verify correctness by running deterministic unit tests that confirm the same inputs yield the same outputs and by confirming that the rendered output in the sample pages looks unchanged.

## Progress

- [x] (2026-02-03 22:06Z) Ran baseline lint/type check/build; Playwright tests could not run because docker-compose is unavailable in the environment.
- [x] (2026-02-03 22:10Z) Updated plan to place new unit tests under tests/ because test/ is gitignored.
- [x] (2026-02-03 22:19Z) Added vitest + deterministic unit tests under tests/ for timeline insertion, HTML5 sizing, and input parser stability.
- [x] (2026-02-03 22:19Z) Reduced redundant work in timeline/collision building and per-frame filtering while preserving rendering behavior.
- [x] (2026-02-03 22:19Z) Replaced linear resize loops in HTML5 text measurement with a bounded search while keeping visual sizes stable.
- [x] (2026-02-03 22:19Z) Removed quadratic user-id lookups in input parsers with a Map-based approach.
- [x] (2026-02-03 22:20Z) Validated with unit tests, lint/type checks, build, and manual visual check on sample page.

## Surprises & Discoveries

The current implementation re-adds comments to `timeline` and `collision` arrays when lazy positioning runs later, and it avoids duplicates by calling `Array.includes` inside per-comment loops. This makes heavy datasets expensive because it turns timeline construction into an accidental quadratic scan.

The HTML5 resize path in `src/comments/HTML5Comment.ts` shrinks or grows text one pixel at a time and calls `measure()` repeatedly. For long comments, this can trigger hundreds of calls per comment.

The XML, legacy, and v1 input parsers use `userList.indexOf` repeatedly, which scales poorly when many distinct user IDs appear.

Timing-based benchmarks fluctuate across environments, so correctness must be guarded by deterministic unit tests rather than local timing deltas.

Playwright tests could not run locally because `docker-compose` is not available in the environment, so only lint/type/build ran during baseline checks.

The unit-test harness required configuring Vitest to understand the `@/*` path alias; without the alias it could not import internal modules.

## Decision Log

- Decision: Keep public APIs and types stable, and use internal helpers (for example `WeakSet`) to track one-time timeline insertion rather than changing external interfaces.
  Rationale: This avoids breaking library users while still removing the highest-cost loops.
  Date/Author: 2026-02-03 / Codex

- Decision: Use deterministic unit tests instead of performance timing benchmarks or browser snapshot pages.
  Rationale: Timing results vary by environment and load, while unit tests can directly assert functional determinism for the refactored logic.
  Date/Author: 2026-02-03 / Codex

- Decision: Add a lightweight unit test runner (`vitest`) and keep tests in `test/unit/` to avoid Playwright picking them up.
  Rationale: The repository currently uses Playwright for browser screenshots; placing unit tests elsewhere keeps concerns separate and avoids cross-runner confusion.
  Date/Author: 2026-02-03 / Codex

- Decision: Place new deterministic unit tests under `tests/` instead of `test/` because `test/` is gitignored in this repository.
  Rationale: Using a non-ignored folder ensures the new unit tests are committed while still keeping them separate from Playwright’s `test/` conventions.
  Date/Author: 2026-02-03 / Codex

## Outcomes & Retrospective

Milestones 1-3 completed: deterministic tests cover timeline insertion, HTML5 sizing, and input parser stability, and the performance optimizations are in place without changing sample page output. Remaining gap: Playwright visual regression tests could not run locally due to missing docker-compose, so full visual diff coverage depends on CI or another environment.

## Context and Orientation

`src/main.ts` owns the main rendering loop in `NiconiComments.drawCanvas`, and it uses `this.timeline` and `this.collision` to decide which comments to draw and where. The term `vpos` refers to the comment time position in centiseconds (1/100th of a second). `this.timeline` maps a `vpos` to the list of `IComment` instances that are active at that time. `this.collision` stores per-`vpos` arrays used to avoid comment overlap.

`src/utils/comment.ts` builds the timeline and collision arrays via `processFixedComment` and `processMovableComment`, and it computes vertical positions using `getFixedPosY` and `getMovablePosY`. `src/comments/HTML5Comment.ts` handles HTML5 comment measurement and has the `_processResizeX` loop that currently adjusts sizes one pixel at a time. Input parsers live in `src/input/*.ts` and convert external formats into `FormattedComment[]`.

The sample pages in `docs/sample/` load local JSON comment data and render to a `<canvas>`. These pages are suitable for manual visual validation. Unit tests will live under `test/unit/` and will exercise deterministic, non-visual logic using a fake renderer where needed.

## Milestones

Milestone 1 introduces deterministic unit tests for calculation outputs. At the end of this milestone, unit tests assert that key functions (timeline insertion, text sizing, and input parsing) produce stable outputs given the same inputs. Success is demonstrated by the new tests passing and remaining stable across repeated runs.

Milestone 2 reduces redundant timeline and per-frame filtering work while keeping rendering behavior the same. At the end of this milestone, timeline insertion happens once per comment, lazy positioning no longer re-scans arrays with `Array.includes`, and draw-frame checks no longer create multiple filtered arrays per frame. Success is demonstrated by unchanged unit test outputs and no visible change in the sample renderings.

Milestone 3 optimizes HTML5 text resize and input parsing. At the end of this milestone, HTML5 resize uses a bounded search instead of per-pixel loops, and XML/legacy/v1 parsers use `Map` for user IDs. Success is demonstrated by unchanged unit test outputs and unchanged sample output.

## Plan of Work

First, add deterministic unit tests. Introduce `vitest` as a dev dependency, add a `vitest.config.ts` that targets the Node environment, and add a `test:unit` script in `package.json` that runs `vitest run`. Create `tests/unit/` test files that exercise the functions being refactored and assert stable outputs. Use a small fake renderer that implements `IRenderer` with deterministic `measureText` results so HTML5 sizing logic can be tested without a browser.

Next, remove redundant timeline insertion work. Add a module-scoped `WeakSet<IComment>` in `src/utils/comment.ts` to track whether a comment’s timeline and collision entries have already been inserted. Update `processFixedComment` and `processMovableComment` so they insert into `timeline`/`collision` only once per comment, and only recompute `posY` when it is still negative and `lazy` is false. Remove the `timeline[vpos]?.includes(comment)` check inside the loops once the one-time insertion guard is in place. This keeps behavior the same while eliminating repeated linear scans.

Then, reduce per-frame filtering in `src/main.ts`. Create a local helper inside `drawCanvas` that iterates `timelineRange` once to produce `hasNaka` (a boolean) and `fixedList` (an array of non-`naka` comments). Use the same helper for the current and last `vpos` ranges so filtering is single-pass and avoids repeated allocations.

After that, optimize HTML5 resizing. In `src/comments/HTML5Comment.ts`, replace the loop in `_processResizeX` that increments or decrements `charSize` one pixel at a time with a bounded search that finds the largest size whose measured width is under the limit. Keep the existing behavior for `resizedY` and line-height adjustments by applying the chosen scale back to `comment.charSize`, `comment.lineHeight`, and `comment.fontSize` the same way the current method does.

Finally, update input parsers in `src/input/xmlDocument.ts`, `src/input/xml2js.ts`, `src/input/legacy.ts`, and `src/input/v1.ts` to use a `Map<string, number>` for user ID lookup instead of `Array.indexOf`. Ensure the resulting `user_id` values are assigned in the same order as before.

## Concrete Steps

1) Create deterministic unit tests.
   - Add `vitest` to `devDependencies`, add `vitest.config.ts` with `test.environment = "node"`, and add a `test:unit` script (`vitest run`).
   - Create `tests/unit/utils-comment.spec.ts` to cover:
     - `processFixedComment` and `processMovableComment` producing identical `timeline` and `collision` contents across repeated runs with the same inputs.
     - Deterministic `posY` results when collisions are empty and canvas size is sufficient (avoid branches that call `Math.random`).
   - Create `tests/unit/html5-measure.spec.ts` to cover:
     - `HTML5Comment.getCommentSize` (or `measure`) producing the same width/height for a fixed comment using a fake `IRenderer` where `measureText` returns `text.length * constant`.
     - A case that triggers resize logic so the bounded search path is exercised.
   - Create `tests/unit/input-parsers.spec.ts` to cover:
     - `legacy`, `xmlDocument`, `xml2js`, and `v1` parsers producing identical outputs across repeated runs and stable `user_id` assignment order.

2) Update timeline insertion and lazy positioning.
   - In `src/utils/comment.ts`, create a module-scoped `WeakSet<IComment>` called `timelineInserted`.
   - In `processFixedComment`, if `timelineInserted` does not contain the comment, run the timeline/collision insertion loop and then add the comment to the set. If `lazy` is false and `comment.posY < 0`, compute and assign `posY` without re-adding to arrays.
   - In `processMovableComment`, apply the same pattern using `timelineInserted` and only compute `posY` when needed.
   - Remove `timeline[vpos]?.includes(comment)` once one-time insertion is guaranteed.

3) Reduce per-frame filtering in `drawCanvas`.
   - In `src/main.ts`, create a small helper function within `drawCanvas` that takes `IComment[] | undefined` and returns `{ fixed: IComment[]; hasNaka: boolean }` using a single pass.
   - Replace the multiple `filter` calls with this helper so only one pass and one allocation are done per range.

4) Replace the HTML5 resize linear scan.
   - In `src/comments/HTML5Comment.ts`, replace the `while` loops that adjust `_comment.charSize` one pixel at a time with a bounded search (binary search) that converges on the largest size that fits the width limit.
   - Preserve the existing logic that updates `comment.charSize`, `comment.lineHeight`, and `comment.fontSize`, especially when `comment.resizedY` is true.

5) Map-based user ID lookup.
   - For each of the input parsers (`xmlDocument.ts`, `xml2js.ts`, `legacy.ts`, `v1.ts`), replace `userList` arrays with a `Map<string, number>` and keep the numbering stable by inserting IDs in first-seen order.

## Validation and Acceptance

Run the build and the unit tests, then verify the sample pages still render correctly.

- Build the bundle so the sample pages use the latest code.
  Expected command (run in repo root, use npm when pnpm is unavailable):
    npm install
    npm run build

- Run the unit tests.
  Expected command:
    npm run test:unit

  Expected outcome:
  - The new unit tests pass and demonstrate that repeated calls with the same inputs yield the same outputs.

- Visual correctness check:
  Run `pnpm test-server`, then open `http://localhost:8080/docs/sample/test.html?video=0&time=0` and ensure the comments render without missing text or visual glitches.

- Type and lint sanity:
  Run `npm run check-types` and `npm run lint` and confirm they complete without errors.

## Idempotence and Recovery

These steps are safe to repeat. If a change causes regressions, revert the modified files or reset to the last known-good commit and reapply the steps. The unit test files are additive and can be removed cleanly if needed.

## Artifacts and Notes

Expected unit test excerpt (example assertion in prose):
  - `processFixedComment` called twice with identical inputs yields identical `timeline` arrays and `comment.posY`.
  - `HTML5Comment.getCommentSize` returns the same `width` and `height` values for identical inputs, including when resize logic is triggered.

Expected diff shape for timeline insertion (illustrative only):
  - Remove `timeline[vpos]?.includes(comment)` inside loops.
  - Add a `WeakSet<IComment>` guard and a `comment.posY` assignment when `lazy` is false.

## Interfaces and Dependencies

Add `vitest` as a dev dependency and use it for deterministic unit tests. No browser APIs are required for the unit tests because a fake renderer is used.

Introduce the following internal helpers and keep their scope local to the modules where they are used.

In `src/utils/comment.ts`, define a module-scoped guard:

  const timelineInserted = new WeakSet<IComment>();

In `src/main.ts` inside `drawCanvas`, define a helper that returns a fixed list and a `hasNaka` boolean without multiple `filter` calls:

  const splitTimeline = (items: IComment[] | undefined) => {
    const fixed: IComment[] = [];
    let hasNaka = false;
    if (items) {
      for (const item of items) {
        if (item.loc === "naka") hasNaka = true;
        else fixed.push(item);
      }
    }
    return { fixed, hasNaka };
  };

In `src/comments/HTML5Comment.ts`, define a helper that performs a bounded search for the best fitting `charSize` and returns the chosen size and lineHeight.

## Plan Change Notes

Initial version created to describe the performance improvement work and how to validate it.
Updated to remove performance timing harnesses and require deterministic tests because timing-based benchmarks are not stable across environments.
Updated to replace calc page snapshots with unit tests and a fake renderer to validate deterministic outputs without a browser.
Updated to place unit tests under tests/ because test/ is gitignored, and to document npm commands when pnpm is unavailable.
