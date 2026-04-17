# Cope and Drag

**Diagramming by spatial refinement.**

Cope and Drag (CnD) is a fork of the [Sterling](https://sterling-js.github.io/) visualizer that replaces the default layout engine with a spatial-refinement-based approach: you describe *how parts of a diagram should relate in space*, and the CnD engine solves for a layout. It's designed to work with [Alloy](https://alloytools.org/) and [Forge](https://forge-fm.org/).

Docs: **https://sidprasad.github.io/copeanddrag/** (in progress)

> This repository is the continuation of the earlier [copeanddrag](https://github.com/sidprasad/copeanddrag/tree/legacy-main) prototype; that work now lives on the `legacy-main` branch / `legacy-v1` tag.

## How to run

```
yarn install
```

and then either:

* `yarn run dev:forge` — run in dev mode for Forge
* `yarn run dev:alloy` — run in dev mode for Alloy (needed if you use the mock provider)

Now CnD runs on `localhost:8081`. If you're running versus Forge, note the instance-provider port and append it to the URL. E.g., `localhost:8081/?62703` if the provider port is `62703`. In Forge, you can use the `sterling_port` option to set the provider port to something constant, so you can avoid having to edit the URL every run.

### How to load a mock trace directly

Go to `Manual Datum` near the bottom of the screen and paste in Alloy-style instance XML.

### Notes on locations

- For layout/theme changes:
  - `RelationStylePanel.tsx`
  - `alloy-graph/srcnew` + `generateGraph.ts` is the new graph layout (and this is where the theme is applied)

- **SpyTial/CnD Integration**: The Graph view uses SpyTial (Cope and Drag) for visualization instead of DAGRE
  - `GraphView/SpyTialGraph.tsx` — React component that wraps the SpyTial `webcola-cnd-graph` custom element
  - `AppDrawer/graph/theme/GraphLayoutDrawer.tsx` — layout drawer where you can edit and apply CnD specifications
  - CnD specifications are stored in Redux state and trigger re-renders of the SpyTial graph

### Feature flags (provider-driven)

CnD can hide/show UI features based on capabilities advertised by the provider. The provider may include an optional `features: string[]` field in the meta payload it sends at startup. Example:

```json
{
  "type": "meta",
  "version": 1,
  "payload": {
    "name": "my-provider",
    "views": ["graph", "table", "script"],
    "generators": ["run", "check"],
    "features": ["synthesis"]
  }
}
```

- Selector synthesis in the Graph drawer is hidden unless the provider includes `"synthesis"` in `features`.

## How to build

To build:
* `yarn run build:forge` (use this if updating Forge), or
* `yarn run build:alloy`

Building will produce many files in `dist` (there are subfolders). To update Forge, copy these into the `sterling/build` folder, after deleting everything that is already there (including subfolders).

## Docs

Docs are a [VitePress](https://vitepress.dev/) site under [`docs/`](./docs).

```
yarn docs:dev      # local dev server
yarn docs:build    # static build to docs/.vitepress/dist
yarn docs:preview  # preview the production build
```
