# Getting Started

> This guide is under construction.

Cope and Drag (CnD) is a diagramming approach built on top of [Sterling](https://sterling-js.github.io/), the model visualizer for [Alloy](https://alloytools.org/) and [Forge](https://forge-fm.org/). Instead of relying on a force-directed or hierarchical layout engine, CnD lets you describe *spatial relationships* — "this is above that", "these group together", "this flows left-to-right" — and solves for a layout that satisfies them.

## What you'll find here

- **[CnD Language](/cnd/)** — the selector and constraint DSL.
- **Guide** (this section) — install, embed, and use CnD with Alloy or Forge.

## Install and run from source

```bash
git clone https://github.com/sidprasad/copeanddrag.git
cd copeanddrag
yarn install
yarn run dev:forge   # or: yarn run dev:alloy
```

The app serves on `http://localhost:8081`. If you're pointing at a Forge provider on a non-default port, append it as a query parameter — e.g. `http://localhost:8081/?62703`.

## Next steps

More content is coming. In the meantime:

- Poke at the [examples in the repo](https://github.com/sidprasad/copeanddrag/tree/main/demos).
- Read the [CnD language overview](/cnd/).
