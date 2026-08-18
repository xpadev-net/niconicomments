# Plan: Green な非TypeScript依存更新 PR の統合

- status: done
- generated: 2026-08-12
- last_updated: 2026-08-12
- work_type: code

## Goal
- 最新 `develop` 上で、全 checks が成功している非TypeScript依存更新 #403 と #397 の最終状態を1つのPRに統合する。

## Definition of Done
- `actions/checkout` が `9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` から `3d3c42e5aac5ba805825da76410c181273ba90b1` に全11箇所更新される。
- `softprops/action-gh-release` が `718ea10b132b3b2eba29c1007bb80653f286566b` から `3d0d9888cb7fd7b750713d6e236d1fcb99157228` に1箇所更新される。
- 変更は想定9 workflowと本計画ファイルだけで、package/lockfile/Node/pnpm/TypeScript依存を含まない。
- 静的検証、独立レビュー、統合PRのrequired checksが成功する。
- bot PRのcommitはcherry-pickせず、最新base上で意図した最終状態を直接再現する。

## Scope / Non-goals
- Scope:
  - #403 `actions/checkout` 7.0.0 → 7.0.1。
  - #397 `softprops/action-gh-release` 3.0.1 → 3.0.2。
  - `.github/workflows/` 内の該当SHA pinのみ。
- Non-goals:
  - npm/pnpm/yarn、Node/setup-node、pnpm/action-setup、TypeScript、Playwright、Rolldown、package/lockfile更新。
  - failed/pendingの依存更新PR。
  - workflow挙動の再設計、releaseの実行、既存bot PRのclose/update。
  - 既存PRブランチの再利用、rebase、amend、force-push。

## Context (workspace)
- Related files/areas: `.github/workflows/*.yml`。
- Existing patterns or references: ActionsはフルSHA pinとversionコメントを使用する。
- Repo reference docs consulted: `docs/coding-agent/lessons.md`。`docs/coding-agent/rules/` は不在。
- GitHub evidence: #403 と #397 はいずれも15/15 checks SUCCESS、`CLEAN`、`MERGEABLE`。調査時点でbaseは現在の `develop` と同じ `f03ab4f82d5307c731f02ff7f57f0974dcb96f61`。

## Open Questions (max 3)
- なし。

## Assumptions
- A1: GitHub上のchecksが実行対象のCI契約を表す。
- A2: release workflowはPR上で実リリース経路を実行しないため、静的検証と既存 #397 のgreen実績で事前検証する。

## Tasks

### Task_1: 最新develop上で2件のActions pinを再現
- type: chore
- owns:
  - `.github/workflows/*.yml`
- depends_on: []
- description: |
  #403 と #397 のnet diffを最新develop上へ直接再現し、TypeScript系や他の依存更新を混入させない。
- acceptance:
  - #403 のcheckout SHAを9 workflow・11箇所に反映する。
  - #397 のrelease action SHAを1箇所に反映する。
  - `release-publish-package.yml` の2更新を競合なく保持する。
  - TypeScript/npm/pnpm/Node dependency filesを変更しない。
- validation:
  - kind: command
    required: true
    owner: worker
    detail: "`rtk proxy ruby -e 'require \"yaml\"; Dir[\".github/workflows/*.yml\"].each { |f| YAML.parse_file(f) }'`"
  - kind: command
    required: true
    owner: worker
    detail: "`rtk git diff --check` と旧/新SHAのrepo-wide検索、変更ファイル一覧、期待件数を確認する"
  - kind: command
    required: false
    owner: worker
    detail: "利用可能なら `rtk actionlint .github/workflows/*.yml` を実行する"

### Task_2: 統合差分とPR checksを独立検証
- type: review
- owns: []
- depends_on: [Task_1]
- description: |
  統合差分が #403 と #397 の意図したnet diffに一致し、他の依存更新やworkflow挙動変更を含まないことを独立確認する。
- acceptance:
  - checkout/release action以外の依存更新が混入していない。
  - release workflowの権限・条件・入力が不変である。
  - PRのrequired checksがすべてSUCCESSである。
- validation:
  - kind: review
    required: true
    owner: reviewer
    detail: "SHA pin、期待件数、重複、workflow権限、変更範囲を独立確認する"
  - kind: command
    required: true
    owner: orchestrator
    detail: "PR上のBuild/Linter/Playwright各Node、CodeQL、Socket、Snykのcheck結論を `gh` で確認する"

## Task Waves (explicit parallel dispatch sets)

Interpretation:
- Tasks listed in the same wave are intended to be dispatched in parallel by default when owns are disjoint and dependencies are met.
- Waves are executed sequentially.

- Wave 1 (parallel): [Task_1]
- Wave 2 (parallel): [Task_2]

## Rollback / Safety
- 1 commitをrevertすればworkflow pinを元に戻せる。
- open PR作成後はrebase/amend/force-pushを行わない。
- bot PRの履歴を取り込まず、base上の最終状態だけを再現する。

## Progress Log (append-only)

- 2026-08-12 Research completed:
  - Summary: current PR、open dependency PR、green状態、TS除外、検証経路を読み取り専用で確認した。
  - Validation evidence: #403/#397は15/15 checks SUCCESS、CLEAN、MERGEABLE。両diffの同時apply checkも成功。
  - Notes: rules suiteは不在。repoのCI/workflow定義から検証を推定した。

- 2026-08-12 Wave 1 completed: [Task_1]
  - Summary: 9 workflowでcheckout pinを11箇所、release action pinを1箇所更新した。
  - Validation evidence: 全workflowのRuby YAML parse、`git diff --check`、旧SHA=0・新SHA=11/1、変更workflow=9件がpass。actionlintは未導入のためoptional skip。
  - Notes: Worker reportはcontract準拠、変更はowns内、required worker validationsは全pass、blocker/questionなし。独立Reviewerへ進む。

- 2026-08-12 Wave 2 completed: [Task_2]
  - Summary: 独立Reviewerが統合diffを #403/#397 と照合し、PR #408 上の統合CIを確認した。
  - Validation evidence: Reviewer `APPROVED`、指摘なし。PR #408はBuild/Linter/Playwright各Node 22/24/26、CodeQL、Socket、Snykの全15 checksがSUCCESSで、CLEAN/MERGEABLE。
  - Notes: actionlintは未導入のためoptional skip。release workflowの実リリース経路はPRでは実行されない残余リスクを記録済み。

## Decision Log (append-only; re-plans and major discoveries)

- 2026-08-12 Decision: 計画承認待ちを省略して実行する。
  - Trigger / new insight: ユーザーが対象条件、除外条件、1 PRへの統合を明示しており、調査で対象が一意に #403/#397 と確定した。
  - Plan delta (what changed): draftを経ずin_progressとして開始する。
  - Tradeoffs considered: 再確認待ちは安全性を増やさず、依存PRの状態driftを招くため省略する。
  - User approval: no（Orchestrator waiver。ユーザーの明示的な実行依頼と一意な対象判定を根拠とする）

- 2026-08-12 Decision: 一時的なYAML検証失敗を修正し、計画を変更せず継続する。
  - Trigger / new insight: 反復置換が非均一なcheckout stepのインデントを一時的に変え、初回YAML parseが失敗した。
  - Plan delta (what changed): なし。元のインデントを復元し、同じrequired validationを再実行してpassした。再発防止を`docs/coding-agent/lessons.md`へ記録した。
  - Tradeoffs considered: 追加の実装変更は不要。最終diffはpinとversionコメントだけに限定されている。
  - User approval: no（計画・scope・契約の変更がなく、required gateが最終的にpassしたため）

- 2026-08-12 Decision: ADRは作成しない。
  - Trigger / new insight: closeout時に全Decision LogをADR warrant criteriaで確認した。
  - Plan delta (what changed): なし。
  - Tradeoffs considered: 対象選定、計画承認waiver、一時的な検証修正はいずれもtask-localで安価に再導出でき、永続的なproduct/architecture境界を定めないためDecision Logをcanonical homeとする。
  - User approval: no（ADR warrantなし）

## Notes
- Quality routing note:
  - Routing level: L1。
  - In-scope docs: core principles、language/technology routing、testing/validation。変更対象はGitHub Actions YAML。
  - Out-of-scope docs: TypeScript/JavaScript、backend/frontend、architecture、security（runtime code、境界、権限、secret設定を変更しないため）。
  - Top risks: external-deps。
  - Risk profile: low。フルSHA pinの局所的かつ可逆な更新。
  - Required checks: YAML parse、diff integrity、exact SHA/count verification、independent review、PR CI。
  - Residual risk: release workflow本体はPRでは実行されない。
