# The Views

CnD exposes four views over an instance, selected from the buttons in the top nav: **Graph**, **Table**, **Script**, and **Edit**. Only Graph and Edit are driven by the CnD spec; Table and Script are independent surfaces.

## Graph view

The default view, and the one you'll spend most of your time in. It renders the current Alloy/Forge instance as a constraint-solved diagram, using the active CnD spec to decide layout and styling.

The **Layout drawer** (right-hand side) holds the CnD editor. Projections and temporal-trace navigation also surface here — see [Projections](../cnd/projections) and [Temporal Mode](../cnd/temporal).

### Code View vs Structured Builder

Inside the Layout drawer, the CnD editor has two modes, toggled at the top of the drawer:

- **Code View** — a raw YAML editor over `constraints:` and `directives:` blocks. This is the canonical surface, and the recommended one for anyone (human or agent) already familiar with the CnD language. The full grammar is in the [YAML Specification](../cnd/yaml-spec).
- **Structured Builder** — a form-based editor where constraints and directives are added, removed, and reordered through UI controls instead of typed YAML. Useful for learning the vocabulary by exploration, and for readers who aren't comfortable editing YAML directly.

The two views share a single underlying spec: switching modes regenerates the other representation from the current one, and undo/redo works across the toggle. The Structured Builder covers constraints and directives; `projections:` and `temporal:` blocks are not yet surfaced in the form UI, but are preserved through round-trips so they won't be lost by switching.

Two actions sit above the editor:

- **Apply Layout** — commits the current spec and re-renders the diagram.
- **Upload `.cnd`** — loads a spec from a local file.

> **For agents writing `.cnd` specs:** prefer Code View and write against the grammar in [YAML Specification](../cnd/yaml-spec). The Structured Builder is a pedagogical surface, not a canonical one.

## Table view

A tabular browse of the instance: sigs and their fields rendered as HTML tables. The Table view does **not** consult the CnD spec — it's a plain data browser for the raw solver output, useful for cross-referencing what the diagram shows against what the instance actually contains.

## Script view

A split pane: a Monaco JavaScript editor on one side, a live rendering stage on the other. You write imperative visualization code against the raw instance, with D3 and the SpyTial visualization APIs available. Run with Ctrl+Enter.

The Script view is **independent of the CnD spec**. Reach for it when CnD's declarative vocabulary isn't enough and you need imperative, bespoke control over the rendering — custom charts, non-graph layouts, algorithmic visualizations. For standard relational-diagram work, Graph view is the right tool.

## Edit view

Experimental. An interactive editor for building or modifying instances by hand — add atoms, connect fields, modify relations — and then exporting the result as a Forge/Alloy `inst` block you can paste back into a model file. The Edit view respects the active CnD spec while you edit, so constraints and directives apply during construction.

→ See [Edit Mode (experimental)](./edit-mode) for the full walkthrough.
