# The CnD Language

**Cope and Drag (CnD)** is a small declarative language for specifying how a diagram should be laid out — not by pixel coordinates, but by *relationships between parts*. You write constraints like "group these atoms", "place this above that", "align these along a row", and the CnD engine solves for a layout that satisfies them.

## Why a language?

Traditional graph layout engines (DAGRE, force-directed, etc.) produce one "best effort" arrangement and offer limited control. CnD inverts that: you state what you want, the solver finds a valid arrangement. That makes layouts:

- **Readable** — the layout spec lives next to the model spec.
- **Composable** — constraints compose; you refine a layout by adding rules, not rewriting it.
- **Reproducible** — same model + spec produces the same layout.

## What's in this section

A CnD spec is a YAML document with four optional top-level sections — `constraints` (structural layout), `directives` (visual styling), `projections` (multi-pane views by type), and `temporal` (trace navigation policy):

- **[YAML Specification](./yaml-spec)** — the complete reference for every constraint and directive: `orientation`, `cyclic`, `align`, `group`, `atomColor`, `edgeColor`, `icon`, `attribute`, `tag`, `hideField`, `hideAtom`, `inferredEdge`, and more.
- **[Selectors](./evaluators)** — selectors inside a spec are written in a restricted subset of Alloy / Forge.
- **[Field-Based Directives with Selectors](./field-selectors)** — how `selector` and `filter` parameters scope field-based directives to specific source types or tuples.
- **[Projections](./projections)** — the `projections:` block: slice an instance along a sig axis and render multiple panes.
- **[Temporal Mode](./temporal)** — the `temporal:` block: navigate a trace from `forge/temporal` models with a chosen sequence policy.
- **[Selector Synthesis](./selector-synthesis)** — auto-generate selector expressions by picking example atoms in the UI.

## Minimal example

```yaml
constraints:
  - orientation:
      selector: parent
      directions: [above]

  - align:
      selector: siblings
      direction: horizontal

directives:
  - atomColor:
      selector: Person
      value: "#4a90d9"

  - flag: hideDisconnectedBuiltIns
```

Every piece of that spec is documented in detail in [YAML Specification](./yaml-spec).
