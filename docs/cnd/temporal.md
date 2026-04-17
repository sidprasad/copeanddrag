# Temporal Mode

A temporal model (for example, a Forge model written in `#lang forge/temporal`) produces a **trace** — a sequence of instances representing states over time. CnD's temporal mode lets you navigate that trace and render multiple states side-by-side.

Temporal mode is configured in the top-level `temporal:` block of a `.cnd` file. (`sequence:` is accepted as an alias.)

## When it applies

Temporal mode is only meaningful when the solver produces a trace — i.e., a model with more than one instance. For single-instance outputs (standard Alloy / Forge), the UI hides temporal controls.

## Syntax

```yaml
temporal:
  policy: stability
```

Shorthand — a bare string is interpreted as `policy`:

```yaml
temporal: stability
```

## Sequence policies

The `policy` field controls how layout evolves as you move between states in the trace. All four are defined in [cndPreParser.ts](https://github.com/sidprasad/copeanddrag/blob/main/packages/sterling/src/utils/cndPreParser.ts).

| Policy | Behavior |
|--------|----------|
| `ignore_history` (default) | Lay out each state independently. No attempt to preserve positions across transitions. |
| `stability` | Minimize movement. Atoms that persist keep their positions where possible. Good for "what changed?" reading. |
| `change_emphasis` | The inverse of stability — reposition to make changes visually prominent. |
| `random_positioning` | Re-randomize positions between states. Useful for shaking loose from a bad equilibrium. |

If the policy string is misspelled or omitted, CnD falls back to `ignore_history` and logs a warning.

## Interacting in the UI

The **Time** sidebar control in the Graph view (or Edit view) shows a trace index slider and lets you pick which states to display. Multi-select renders panes side-by-side via [MultiTemporalGraph](https://github.com/sidprasad/copeanddrag/blob/main/packages/sterling/src/components/GraphView/MultiTemporalGraph.tsx).

## Worked example

From [`demos/rc2/goats_and_wolves.cnd`](https://github.com/sidprasad/copeanddrag/blob/main/demos/rc2/goats_and_wolves.cnd):

```yaml
temporal:
  policy: stability

constraints:
  - orientation: {directions: [right, below], selector: GWFar->GWAnimal & gw}
  - orientation: {directions: [left,  below], selector: GWNear->GWAnimal & gw}
  - orientation: {directions: [directlyRight], selector: GWNear->GWBoat + GWBoat->GWFar}
  - group: {addEdge: true, selector: gw, name: gw}

directives:
  - icon: {showLabels: true, selector: Goat, path: https://www.siddharthaprasad.com/uploads/goat.png}
  - icon: {showLabels: true, selector: Wolf, path: https://www.siddharthaprasad.com/uploads/wolf.png}
  - hideField: {field: gw}
  - flag: hideDisconnectedBuiltIns
```

`stability` keeps the goats and wolves in roughly the same place across states, so the eye picks up *which animal moved* on each boat crossing.

## Interaction with other top-level blocks

- `constraints:` and `directives:` apply uniformly to every state in the trace.
- Projections and temporal mode compose: a projected, temporal model shows time × projected-sig panes.
