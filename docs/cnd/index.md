# CnD Language

> This section is under construction. The full language reference will be ported from [spytial-core](https://github.com/sidprasad/spytial-core) in a follow-up.

**Cope and Drag (CnD)** is a small declarative language for specifying how a diagram should be laid out — not by pixel coordinates, but by *relationships between parts*. You write constraints like "group these atoms", "place this above that", "align these along a row", and the CnD engine solves for a layout that satisfies them.

## Why a language?

Traditional graph layout engines (DAGRE, force-directed, etc.) produce one "best effort" arrangement and offer limited control. CnD inverts that: you state what you want, the solver finds a valid arrangement. This makes layouts:

- **Readable** — the layout spec lives next to the model spec.
- **Composable** — constraints compose; you can refine a layout by adding rules, not rewriting it.
- **Reproducible** — the same model + spec produces the same layout.

## What's in the language

- **Selectors** — pick out atoms, tuples, and relations to constrain.
- **Spatial constraints** — relative position, alignment, grouping, orientation.
- **Visual directives** — styling, labels, edge routing hints.

## Learn more

- **[Reference](/cnd/reference)** — selector and constraint reference (coming soon).
- Source of truth for the language lives in [spytial-core](https://github.com/sidprasad/spytial-core).
