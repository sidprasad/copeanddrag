# Getting Started

> This guide is under construction.

Cope and Drag (CnD) is a diagramming approach built on top of [Sterling](https://sterling-js.github.io/), the model visualizer for [Alloy](https://alloytools.org/) and [Forge](https://forge-fm.org/). Instead of relying on a force-directed or hierarchical layout engine, CnD lets you describe *spatial relationships* — "this is above that", "these group together", "this flows left-to-right" — and solves for a layout that satisfies them.

## What you'll find here

- **[CnD Language](/cnd/)** — the selector and constraint DSL.
- **Guide** (this section) — install, embed, and use CnD with Alloy or Forge.

## Feature tour

- **[CnD language](/cnd/)** — constraints and directives for spatial layout.
- **[Projections](/cnd/projections)** — slice an instance along a sig axis, render multiple panes.
- **[Temporal mode](/cnd/temporal)** — navigate traces from `forge/temporal` models with a sequence policy.
- **[Edit mode](/guide/edit-mode)** *(experimental)* — modify an instance in-browser and export as `inst`.

Poke at the [demos](https://github.com/sidprasad/copeanddrag/tree/main/demos) to see each feature in use — notably [`demos/gc`](https://github.com/sidprasad/copeanddrag/tree/main/demos/gc) (projections), [`demos/rc2/goats_and_wolves.cnd`](https://github.com/sidprasad/copeanddrag/blob/main/demos/rc2/goats_and_wolves.cnd) (temporal), and [`demos/bst`](https://github.com/sidprasad/copeanddrag/tree/main/demos/bst) (pure layout).

## Install and run from source

```bash
git clone https://github.com/sidprasad/copeanddrag.git
cd copeanddrag
yarn install
yarn run dev:forge   # or: yarn run dev:alloy
```

The app serves on `http://localhost:8081`. If you're pointing at a Forge provider on a non-default port, append it as a query parameter — e.g. `http://localhost:8081/?62703`.

To explore CnD without running a solver, use `yarn run dev:mock` — it serves bundled Alloy/Forge XML fixtures over an in-process fake WebSocket, with no provider process required. Good for UI work, docs screenshots, demos, and deterministic test scenarios.

Each fixture is exposed as a Sterling "generator" — pick one in the Explorer tab and click **Run** to load it, the same flow as a real Forge/Alloy run. To skip the picker on load, pass a `?fixture=<name>` query param (e.g. `http://localhost:8081/?fixture=rc`) and the mock auto-serves that fixture. The registry lives at [packages/sterling-connection/src/mock/fixtures.ts](https://github.com/sidprasad/copeanddrag/blob/main/packages/sterling-connection/src/mock/fixtures.ts) — add a new `.xml` fixture by dropping it in the tree and registering one line.

## Next steps

- Read the [CnD language overview](/cnd/).
- Skim the [YAML specification](/cnd/yaml-spec) for the full constraint and directive reference.

## Explain a Forge UNSAT result

Run your Forge model as usual. In Cope and Drag, select an UNSAT command in **Explorer** and click **Find a counterfactual**. A counterfactual is an instance that becomes possible when a minimal set of source rules is relaxed; the original command remains UNSAT. **Choose rules that must hold** lets you keep individual source rules enforced during the search. This action is available when the Forge provider advertises diagnostic support for a static relational run or check.

To try the review branches before the next bundled UI update, start `yarn dev:forge` in this checkout. In a second terminal here, run `racket demos/near-miss/storage.frg -O run_sterling serve -O sterling_port 17100`. Open [the local CnD visualizer](http://localhost:8081/?17100) and select **placement**. With both source rules available to relax, one counterfactual stores two replicas on one disk. **Find another counterfactual** keeps disk separation and leaves replicas unstored. Each instance highlights the available atom and relation evidence. Restoring any one of its relaxed rules makes the command UNSAT again within the original bounds.

The explanation places the requirement in a schematic `pred name { ... }` excerpt when its predicate is known, alongside the instance binding and evaluated expression. Ellipses mark surrounding source context that was not supplied. The displayed requirement is the expanded formula reported by Forge, rather than an exact copy of the original declaration. Its file location points back to the model. A short note identifies the requirement being relaxed to resolve the conflict. Hover over the code or controls for additional context. **Instance binding** identifies which atom Forge used for a quantified rule variable in the reported evidence; it is not a source assignment or a new constraint. The evaluated expression retains Forge’s backtick notation for atom references. Results use instance labels and relational notation: `Replica0 + Replica1` for a union, `Disk0 -> Replica0` for a tuple, and `none` for an empty value. These values describe the counterfactual, not source declarations or new bounds. Only the first reported binding and up to eight tuples per expression are displayed and highlighted; abbreviated results are labeled explicitly.

**Find another counterfactual** searches for a different minimal set of relaxed rules under the same kept rules. It does not simply generate another instance for the current relaxation. When the search is exhausted, the last diagram stays visible. Use **Back to rule selection** to choose which rules must hold in a new search.
