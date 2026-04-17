# Projections

A **projection** slices an instance along a type axis: instead of one big diagram containing every atom of every type, you render one sub-diagram per atom of a chosen type (a "sig"). Projections are how you visualize trace-like, state-indexed, or time-indexed data without the diagram collapsing into noise.

Projections are specified in the top-level `projections:` block of a `.cnd` file.

## Syntax

```yaml
projections:
  - sig: State
    orderBy: "next"
  - sig: Time
```

Each entry has:

| Field | Required | Description |
|-------|----------|-------------|
| `sig` (or `type`) | yes | The type / sig to project over. One sub-diagram per atom of this type. |
| `orderBy` | no | A [selector](./evaluators) whose tuples define the ordering of atoms of `sig`. Typically a `next`-style relation for trace data. |

Shorthand: a bare string is interpreted as just `sig`.

```yaml
projections:
  - State       # equivalent to { sig: State }
```

## What happens

When a projection is active, CnD:

1. Enumerates the atoms of `sig` (ordered by `orderBy` if given).
2. For each atom, builds a filtered copy of the instance where the `sig` atoms are restricted to that one.
3. Renders those copies as multiple panes — the user selects which atoms to show at a time from the sidebar.

The multi-pane rendering is driven by [MultiProjectionGraph](https://github.com/sidprasad/copeanddrag/blob/main/packages/sterling/src/components/GraphView/MultiProjectionGraph.tsx) and the projection filtering itself by [alloy-instance/projection.ts](https://github.com/sidprasad/copeanddrag/blob/main/packages/alloy-instance/src/projection.ts).

## Interacting in the UI

Open the **Projections** sidebar control in the Graph view (or Edit view). It lists every projected sig and lets you multi-select atoms: each selection adds a pane.

## Worked example

From [`demos/gc/gc.cnd`](https://github.com/sidprasad/copeanddrag/blob/main/demos/gc/gc.cnd), projecting a garbage-collector trace along `State`:

```yaml
projections:
  - sig: State
    orderBy: "Initial->Changed + Changed->Marked + Marked->Swept"
```

The `orderBy` selector specifies the transition edges, so CnD lays the panes out in the correct phase order: Initial → Changed → Marked → Swept.

## Interaction with other top-level blocks

- Projections compose with [temporal mode](./temporal): a temporal model with projections shows *both* time steps and projected sig atoms, as separate axes.
- Projection filtering runs before `constraints:` and `directives:` are applied — each projected sub-instance is laid out independently.
