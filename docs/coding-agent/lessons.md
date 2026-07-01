# Coding Agent Lessons

## 2026-07-01: Preserve Source Semantics In Regression Fixtures

- tags: issue-378, fixtures, nicoscript, owner-semantics
- symptom: Real `sm34256261` comments were initially appended to the regression fixture with `owner:false`, matching the converted JSON but not the source semantics needed for `@置換 ... 投コメ`.
- root cause: The fixture generation trusted the formatted JSON field literally without accounting for the known conversion artifact that drops owner status.
- fix: Rebuild the fixture from a clean base and set both the `@置換` script comments and their visible target comments to `owner:true`.
- prevention: When using external converted data as a regression fixture, explicitly validate semantic fields that affect behavior, especially `owner`, before generating snapshots.
