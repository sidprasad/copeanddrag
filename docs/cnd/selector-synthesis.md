# Selector Synthesis

Writing selectors by hand is easy once you know the model; tricky when you don't. Selector synthesis lets you **point at atoms you want** and have CnD propose a selector expression that picks out exactly those atoms.

## What it does

You tell CnD "I want *these* atoms" (or *these* pairs of atoms) by selecting them across one or more instances. The synthesizer searches the space of selector expressions — identifiers, set operations, joins, closures — until it finds one that matches every example you gave and nothing else. The result is a selector you can paste directly into a `selector:` field in your spec.

Under the hood, it's a CEGIS-style (Counter-Example Guided Inductive Synthesis) search over the selector grammar.

## When to use it

- You want to color / align / group a set of atoms but don't know the relational expression that picks them out.
- You want the synthesizer to generalize: give examples across **multiple instances** and the proposed selector will be the one that fits all of them.
- You want to derive a binary selector (for `orientation`, `inferredEdge`, etc.) from example pairs.

## Using it

1. Open the **Synthesis** panel from the sidebar in the Graph view.
2. Choose **atom** (unary) or **pair** (binary) selector.
3. Pick one or more instances to pull examples from.
4. Click the atoms (or drag to pair them) that the selector should match.
5. Click **Synthesize**. The panel shows the proposed expression and which atoms/pairs it matches.
6. If it looks right, copy the expression into your `.cnd` spec.

If the synthesizer can't find a matching expression, try:

- Adding or removing examples to disambiguate.
- Raising the `maxDepth` (expression complexity) setting.
- Checking that your examples are consistent — a contradictory set has no valid selector.

## Limits

- Synthesis time grows with expression complexity and the number of identifiers in the model.
- Very complex relational patterns may fall outside the grammar the synthesizer explores — when that happens, write the selector by hand.
