<h1 align="center">Cope and Drag</h1>

<p align="center">
  <strong>Diagramming by spatial refinement.</strong>
</p>

<p align="center">
  <a href="https://sidprasad.github.io/copeanddrag/"><img alt="Docs" src="https://img.shields.io/badge/docs-copeanddrag-blue?style=flat-square"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=flat-square"></a>
  <a href="./package.json"><img alt="Version" src="https://img.shields.io/badge/version-4.0.0-brightgreen?style=flat-square"></a>
  <a href="https://github.com/sidprasad/copeanddrag/actions/workflows/deploy-pages.yml"><img alt="Docs deploy" src="https://img.shields.io/github/actions/workflow/status/sidprasad/copeanddrag/deploy-pages.yml?branch=main&label=docs%20deploy&style=flat-square"></a>
</p>

Cope and Drag (CnD) is a fork of the [Sterling](https://sterling-js.github.io/) visualizer that replaces the default layout engine with a spatial-refinement approach. You describe *how parts of a diagram should relate in space* — "above", "grouped", "aligned" — and the CnD engine solves for a layout that satisfies those constraints. It works with [Alloy](https://alloytools.org/) and [Forge](https://forge-fm.org/).

**v4** is the TypeScript/Sterling-based rewrite of the original copeanddrag. The v3.x JavaScript implementation is preserved in this repo's history via tags (`v3.4.8` and earlier).

## Quick links

- **[Documentation →](https://sidprasad.github.io/copeanddrag/)**
- **[CnD Language reference →](https://sidprasad.github.io/copeanddrag/cnd/yaml-spec)**
- **[Developer guide →](./DEVGUIDE.md)** — run, build, code layout, feature flags

## Quick start

```bash
yarn install
yarn run dev:forge   # or: yarn run dev:alloy
```

The app runs on `http://localhost:8081`. For the full dev walkthrough — building, synthesis mode, code layout, feature flags — see **[DEVGUIDE.md](./DEVGUIDE.md)**.

## License

[MIT](./LICENSE)
