# Edit Mode

> **Experimental.** Edit mode is under active development — behavior and export format may change.

## The idea

Because CnD rules are declarative, the same rules that describe how a structure should *appear* can also dictate how it should *take shape* during construction. Every CnD rule tells us about valid edits: **what** may be added, **how** it should appear, **where** it may go, and **how** existing parts should adjust.

Edit mode turns this inside out. Instead of reading a solver-produced instance, you build one: add atoms, set fields, connect relations — and the `.cnd` spec continuously governs layout, styling, and structural validity as you go. The spec isn't just a renderer; it's the editor's rulebook.

## How to access

Click the **EditView** tab in the main sidebar. The pane header shows an "Experimental feature" banner to remind you the feature is still stabilizing.

## What you can do

- **Build or modify an instance.** Atoms and fields are individually editable; as you edit, the active `.cnd` spec re-applies constraints and directives so the visual stays consistent with the rules.
- **Load from Instance.** The "Load from Instance" button hydrates the editor with the current solver-produced instance — a starting point for a manual edit, or a way to revert after changes.
- **Export as `inst`.** The "Export as inst" button serializes the current editor state and copies it to your clipboard. Paste the result directly into a Forge or Alloy model as an instance definition.

## Validation

On export, the edited instance is run through structural validation against the original instance's schema. Wrong atom types, missing required fields, or arity mismatches surface as error/warning banners in the header. The clipboard still receives the export so you can fix the destination in context, but the banner tells you what to look for.

## Feature interaction

The same sidebar controls that apply in Graph view apply here:

- [Projections](../cnd/projections) — slice the edited instance along a sig axis.
- [Temporal mode](../cnd/temporal) — navigate between states of a trace; edits apply to the currently selected state.
- Layout — your `.cnd` spec drives layout inside the editor just as it does in Graph view, *and* governs what edits are structurally valid.
