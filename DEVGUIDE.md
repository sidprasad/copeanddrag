# Developer Guide

How to run, build, and work on Cope and Drag locally.

## Prerequisites

- Node 18+ (for the app) / Node 20+ (for the docs — VitePress)
- Yarn 1.x

## Running the app

```bash
yarn install
yarn run dev:forge   # dev mode for Forge
# or
yarn run dev:alloy   # dev mode for Alloy (also needed for the mock provider)
```

The app runs on `http://localhost:8081`. When running against a Forge provider, the instance-provider port is appended as a query parameter — e.g. `http://localhost:8081/?62703` if the provider port is `62703`. In Forge, you can set `sterling_port` in the run options to pin the provider port so the URL stays stable across runs.

### Synthesis dev mode

Selector synthesis UI is gated on a provider capability flag (see below). To run locally with synthesis forced on:

```bash
yarn run dev:forge:synthesis
yarn run dev:alloy:synthesis
```

### Loading a mock trace directly

Use `Manual Datum` near the bottom of the screen and paste in Alloy-style instance XML.

## Building

```bash
yarn run build:forge   # for Forge
yarn run build:alloy   # for Alloy
```

Both produce output in `dist/` (with subfolders). To update Forge, copy the contents of `dist/` into Forge's `sterling/build` folder after deleting everything that was already there.

## Working on the docs

Docs are a [VitePress](https://vitepress.dev/) site under [`docs/`](./docs).

```bash
yarn docs:dev       # local dev server on :5173
yarn docs:build     # static build to docs/.vitepress/dist
yarn docs:preview   # preview the production build
```

On push to `main`, `.github/workflows/deploy-pages.yml` builds and deploys the docs site to GitHub Pages.

### Docs gotchas

- The docs site has its own `docs/package.json` — VitePress is not a root devDependency.
- `docs/postcss.config.cjs` is intentionally empty; it overrides the root Tailwind PostCSS config so VitePress doesn't try to run Tailwind on its theme CSS.

## Code layout

### Layout and theme

- `RelationStylePanel.tsx`
- `alloy-graph/srcnew` + `generateGraph.ts` — graph layout; the theme is applied here.

### SpyTial / CnD integration

The Graph view uses SpyTial (Cope and Drag) for visualization instead of DAGRE.

- `GraphView/SpyTialGraph.tsx` — React component wrapping the SpyTial `webcola-cnd-graph` custom element.
- `AppDrawer/graph/theme/GraphLayoutDrawer.tsx` — the layout drawer where you can edit and apply CnD specifications.
- CnD specifications are stored in Redux state and trigger re-renders of the SpyTial graph.

## Provider-driven feature flags

The app hides/shows UI features based on capabilities advertised by the provider. The provider may include an optional `features: string[]` field in the meta payload it sends at startup:

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

## Release flow

Version bumps go in `package.json`. See `RELEASE.md` for the full release checklist.
