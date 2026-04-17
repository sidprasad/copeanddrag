# Selectors

Every `selector:`, `filter:`, and `field:` value in a CnD spec is a **selector expression**.

Selectors are written in a **restricted subset of the Alloy / Forge relational language** — the standard operators (`.`, `+`, `&`, `-`, `^`, `*`, `~`, `->`) evaluated against the current instance. If you've written Alloy or Forge, selectors will feel familiar.

If a selector doesn't match what you expect, use the **Evaluator** sidebar tab to run it directly against the current instance.
