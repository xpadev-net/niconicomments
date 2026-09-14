# Plan: CI テスト workflow の整理

- status: done
- generated: 2026-09-14
- last_updated: 2026-09-14
- work_type: code

## Goal
- CI の workflow/job 名を実際の検証内容に合わせ、Build/Linter の重複した matrix 実行と Playwright 側の重複検証を整理する。

## Definition of Done
- `BuildTests` と `LinterTests` を廃止し、型チェック・unit test・build・package artifact 検証と lint を明示する単一の CI workflow に統合する。
- Node 22/24/26 の互換性検証は型チェック・unit test・build・package artifact 検証の matrix として維持する。
- lint は Node 24 で一度だけ実行し、`--frozen-lockfile` を使う。
- Playwright workflow は E2E に専念し、CI で既に実施する型チェックを重複実行しない。E2E は Node 24 で一度実行し、既存の失敗 artifact/comment 連携を壊さない。
- 全 workflow が YAML として解釈でき、変更後の workflow/job 名・artifact 名・参照関係が整合する。

## Scope / Non-goals
- Scope:
  - `.github/workflows/ci.yml` の新設と、`pr-test-build.yml` / `pr-test-linter.yml` の統合・撤去。
  - `.github/workflows/pr-test-playwright.yml` の E2E 専用化。
  - 必要な workflow 名・job 名・artifact 連携の整理。
- Non-goals:
  - ソースコード、テストコード、package script、依存関係の変更。
  - CodeQL、release、deploy、Playwright screenshot の保存仕様そのものの変更。
  - Node 22/24/26 の互換性 matrix を削除すること。

## Compatibility stance
- surface: GitHub Actions workflow/job check names and Playwright failure-artifact workflow trigger
- stance: ask-user
- justification: `BuildTests` / `LinterTests` の廃止と新しい check 名への移行はユーザー要求に沿うが、GitHub API で master の branch protection は未設定でも ruleset・外部 consumer までは検証できない。実装前に下記の check-name 対応表と移行をユーザーに承認してもらう。`Playwright Tests` の workflow 名は維持して `workflow_run` 契約を保存する。

### Check-name migration

| Existing check | New check |
| --- | --- |
| `BuildTests / test (22)` | `CI / Build, Type Check, Unit Test, and Package (Node 22)` |
| `BuildTests / test (24)` | `CI / Build, Type Check, Unit Test, and Package (Node 24)` |
| `BuildTests / test (26)` | `CI / Build, Type Check, Unit Test, and Package (Node 26)` |
| `LinterTests / test (22)` | `CI / Lint (Node 24)` |
| `LinterTests / test (24)` | `CI / Lint (Node 24)` |
| `LinterTests / test (26)` | `CI / Lint (Node 24)` |
| `Playwright Tests / test (22)` | `Playwright Tests / Playwright E2E (Node 24)` |
| `Playwright Tests / test (24)` | `Playwright Tests / Playwright E2E (Node 24)` |
| `Playwright Tests / test (26)` | `Playwright Tests / Playwright E2E (Node 24)` |

## Context (workspace)
- Related files/areas: `.github/workflows/pr-test-build.yml`, `.github/workflows/pr-test-linter.yml`, `.github/workflows/pr-test-playwright.yml`, `.github/workflows/pr-test-playwright-comment.yml`, `package.json`。
- Existing patterns or references: `package.json` の `check-types`、`test:unit`、`build`、`check-package-artifacts`、`lint`、`test:playwright`。
- Repository rules: `docs/coding-agent/rules/` は存在しない。`docs/coding-agent/lessons.md` と既存の完了済み CI plan を確認した。
- Research: ローカル inventory と独立 Researcher の読み取り専用調査を実施済み。`actionlint` は環境にないため optional validation とする。

## Open Questions (max 3)
- Q1: 上記の旧 check 名を新しい `CI` / `Playwright Tests` check 名へ移行する方針を承認するか。Node 24 への lint/E2E 集約を含む。

## Assumptions
- A1: Node 22/24/26 の差異を確認する対象は package の型・unit・build・artifact 生成であり、lint とブラウザ E2E を全 Node version で反復する必要はない — source: `package.json:76-78`, existing workflow matrices。
- A2: Playwright の screenshot comment workflow は `workflow_run.workflows` の名前に依存するため、`Playwright Tests` は変更しない — source: `.github/workflows/pr-test-playwright-comment.yml:8`。
- A3: `pnpm test:playwright` は build を内包するため、Playwright workflow はその script を直接実行する — source: `package.json:29`。

## Tasks

### Task_1: CI workflow と E2E workflow を整理
- type: impl
- owns:
  - `.github/workflows/ci.yml`
  - `.github/workflows/pr-test-build.yml`
  - `.github/workflows/pr-test-linter.yml`
  - `.github/workflows/pr-test-playwright.yml`
- depends_on: []
- description: |
  Build/Linter workflow を一つの明示的な CI workflow に統合し、Node compatibility checks と一度だけの lint を分離する。Playwright workflow は型チェックの重複を取り除き、Node 24 の E2E と既存 artifact 形式を保つ。
- acceptance:
  - `ci.yml` の先頭名が `CI`、compatibility job の name が `Build, Type Check, Unit Test, and Package (Node ${{ matrix.node-version }})` であり、Node 22/24/26 の各 matrix job で `pnpm check-types`、`pnpm test:unit`、build 前の `pnpm check-package-artifacts --allow-missing-dist`、`pnpm build`、build 後の `pnpm check-package-artifacts` を実行する。
  - `ci.yml` の lint job の name が `Lint (Node 24)` であり、Node 24 の一実行のみで `pnpm install --frozen-lockfile` と `pnpm lint` を使う。
  - `ci.yml` と `pr-test-playwright.yml` はともに `push` / `pull_request` の `master` / `develop` トリガーを維持する。
  - `pr-test-build.yml` と `pr-test-linter.yml` が不要な重複 workflow として残らない。
  - `pr-test-playwright.yml` は型チェックを実行せず、job 名を `Playwright E2E (Node 24)` として Node 24 で `pnpm test:playwright` と既存の `test-results-node-24` artifact を生成する。
  - `Playwright Tests` の workflow 名と screenshot comment workflow の関係を維持し、CodeQL/release/deploy workflow は変更しない。
- validation:
  - kind: command
    required: true
    owner: worker
    detail: "`rtk proxy ruby -e 'require \"yaml\"; Dir[\".github/workflows/*.yml\"].each { |f| YAML.parse_file(f) }'`、tracked diff の `rtk git diff --check`、全 workflow の trailing whitespace check、削除対象の `pr-test-build.yml`/`pr-test-linter.yml`、相対パス、`uses: ./.github/workflows/`、旧 workflow 名、`test-results-node-` の repo-wide 検索を実行する"
  - kind: command
    required: true
    owner: worker
    detail: "`pnpm check-types`、`pnpm test:unit`、`pnpm lint`、`pnpm build`、build 前後の `pnpm check-package-artifacts` を実行する。Playwright は `pnpm playwright install-deps && pnpm playwright install firefox && pnpm test:playwright` で確認する"

### Task_2: CI 整理後の独立レビュー
- type: review
- owns: []
- depends_on: [Task_1]
- description: |
  変更差分がユーザー要求の「重複削減」と「実態に合う命名」を満たし、CI の外部契約を意図せず壊していないか確認する。
- acceptance:
  - Reviewer が `APPROVED` を返し、未解決の required validation がない。
  - workflow/job 名、Node matrix、Playwright artifact、workflow_run 参照の整合性が確認される。
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "全 CI workflow 差分を acceptance criteria と既存 package scripts に照合し、check-name 対応表、Node 22/24/26 の責務、`Playwright Tests` workflow 名、`test-results-node-24` artifact、comment workflow の download pattern/許可 artifact 名/失敗時処理の整合性を確認する"
  - kind: command
    required: false
    owner: orchestrator
    detail: "GitHub run が利用可能な場合のみ `gh run view` で CI の3 matrix job、lint、Playwright E2E の実行結果と最終 check 名を確認する。run が利用できない場合は、必須の YAML/static/package validation を根拠に optional check を waiver として記録する"

## Task Waves (explicit parallel dispatch sets)

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]

## Rollback / Safety
- workflow 変更だけを revert すれば元の Build/Linter/Playwright workflow 構成に戻せる。
- branch が detached HEAD のため、commit・push・force-push は行わない。
- workflow 名の変更は `Playwright Tests` を除き、既存の screenshot comment 契約を壊さない範囲に限定する。

## Progress Log (append-only)

  - 2026-09-14 Research completed:
  - Summary: CI workflow、package scripts、Playwright comment 連携、branch protection の有無を読み取り専用で確認した。
  - Validation evidence: `BuildTests` と `LinterTests` は同じ Node 22/24/26 setup を持ち、Playwright は型チェック/build を再実行する。master の required status checks は GitHub API で未設定だった。
  - Notes: repo-local rules は不在。独立 Researcher は `BuildTests`/`LinterTests`/Playwright の重複、package script の実態、comment workflow の artifact 契約、`actionlint` 不在を確認した。

- 2026-09-14 Plan review completed:
  - Summary: 独立 Reviewer は初回案を `NEEDS_REVISION` とし、check-name 対応表、Node matrix の具体的 acceptance、Playwright artifact/comment の具体的 validation、validation ownership の重複解消を要求した。
  - Validation evidence: 上記指摘を本計画へ反映し、更新差分の独立再レビューは `APPROVED`。残存指摘なし。
  - Notes: 外部 check consumer を検証できないため compatibility stance を `ask-user` に変更した。ユーザー承認済み。

- 2026-09-14 Wave 1 completed: [Task_1]
  - Summary: `ci.yml` を新設し、Build/Linter workflow を削除して統合した。Playwright は Node 24 の E2E 専用に整理し、既存の `Playwright Tests` workflow 名と `test-results-node-24` artifact 契約を維持した。
  - Validation evidence: 全 workflow YAML parse、tracked diff check、workflow 契約/static assertions、dependency install、type check、210 unit tests、pre/post package artifact check、build、lint が pass。Playwright は依存導入に passし、46 tests pass / 7 missing macOS snapshot failures。全 workflow trailing whitespace は変更範囲外の既存行で fail。
  - Notes: Worker report は契約準拠。Task_1 の required whitespace gate は下記の限定 waiver で統合する。独立 Reviewer へ進む。

- 2026-09-14 Wave 2 completed: [Task_2]
  - Summary: 独立 Reviewer が変更差分と CI/E2E 契約を確認し、`APPROVED` とした。
  - Validation evidence: 10 workflow の YAML parse、CI matrix/job 名、trigger、権限、SHA pin、Playwright artifact/comment 連携、削除 workflow の参照残りを確認。指摘なし。
  - Notes: 外部の branch protection / third-party check consumer は repo 内から検証できないため、最初の post-push CI run で確認する residual risk として残す。今回 commit/push はしていない。

- 2026-09-14 Improvement loop completed:
  - Summary: 変更範囲外の既存 whitespace gate、platform-specific Playwright snapshot 不足、Corepack executable mode の3件を `docs/coding-agent/lessons.md` に記録した。
  - Validation evidence: 既存 release workflow の違反は限定 waiver、Playwright は optional residual risk、Corepack は環境復旧後に build pass として記録した。
  - Notes: 次回から broad hygiene gate は baseline と changed surface を分離し、ローカル visual snapshot と package-manager cache の環境差を明示する。

## Decision Log (append-only; re-plans and major discoveries)

- 2026-09-14 Decision: CI の検証責務を「compatibility checks」「lint」「browser E2E」に分ける。
  - Trigger / new insight: 現在の Build/Linter workflow は同じ Node matrix を重複して実行し、Playwright workflow も型チェックを再実行している。
  - Plan delta (what changed): Build/Linter を `ci.yml` に統合し、lint と Playwright E2E は Node 24 の一実行へ整理する。
  - Tradeoffs considered: Node matrix を全 workflow に残すと互換性の網羅性は高いが、lint/E2E の重複コストと check の意味不明瞭さが残る。互換性確認は型/unit/build/artifact matrix に集中する。
  - User approval: yes（2026-09-14、ユーザーの「よさそう」により承認）
  - Record proposed: none（CI の実行構成であり、永続的な product/architecture decision ではない）

- 2026-09-14 Decision: 変更範囲外の既存 workflow whitespace 検査を限定 waiver とする。
  - Trigger / new insight: 全 workflow の trailing whitespace 検査が `.github/workflows/release-create-release.yml` の既存行 42、51、135 を検出したが、Task_1 の owns 外かつ今回の差分では変更していない。
  - Plan delta (what changed): なし。新規/変更 workflow の YAML parse と tracked diff check は pass とし、既存 release workflow の3行は別 cleanup として残す。
  - Tradeoffs considered: release workflow を同じ差分で整形すれば gate は通るが、CI整理の scope を広げ不要な release 差分を混ぜるため採用しない。
  - User approval: no（Orchestrator waiver。変更範囲外の既存問題で、CI YAML parse と変更差分の whitespace は passしているため）
  - Record proposed: none（既存の軽微な整形問題に対する task-local waiver）

## Notes
- Quality routing note:
  - In-scope docs: core principles、testing/validation、GitHub Actions workflow contract。変更対象は CI YAML のみ。
  - Out-of-scope docs: TypeScript/JavaScript architecture、runtime security、UI/E2E visual policy（ブラウザフロー自体は変更しないため）。
  - Top risks: external-deps, contract。
  - Risk profile: medium。workflow/job 名と matrix を変更するが、実行対象と Playwright artifact 契約を保持する。
  - Validation depth: extended。
  - Required checks: YAML parse、diff check、package checks、artifact/trigger contract review、独立 Reviewer。
  - Residual risk / follow-up: GitHub の branch protection API にない外部 check consumer は検証できないため、変更後の PR check 名を確認する。
