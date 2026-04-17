# Field-Based Directives with Selectors

Field-based directives like `edgeColor`, `attribute`, `hideField`, and `group` take an optional `selector` (and often a `filter`) parameter. This solves the specificity problem where multiple types may have relations of the same name that are semantically distinct.

## The Problem

Say your model has three relations all named `name`:

- `Person -> name`
- `Car -> name`
- `Company -> name`

Without selectors, a single `edgeColor` rule for `name` applies globally to all of them. You can't color only Person names red.

## The Solution

Add a `selector` that restricts which source atoms the directive applies to.

### Edge Colors with Selectors

```yaml
directives:
  # Color name relations red, but only for Person atoms
  - edgeColor:
      field: 'name'
      value: 'red'
      selector: 'Person'
      style: 'dashed'
      weight: 2

  # Color name relations blue, but only for Car atoms
  - edgeColor:
      field: 'name'
      value: 'blue'
      selector: 'Car'

  # Company name relations remain default (black)
```

Inferred edges take the same style/weight options:

```yaml
directives:
  - inferredEdge:
      name: 'transitive'
      selector: 'Person->Person'
      color: 'gray'
      style: 'dotted'
      weight: 1.5
```

### Attributes with Selectors

```yaml
directives:
  # Convert name relations to attributes, but only for Person atoms
  - attribute:
      field: 'name'
      selector: 'Person'

  # Car and Company name relations remain as edges
```

### Attributes with Value Filters

For relations with arity > 2 (e.g., `rel: X -> Y -> Bool`), use `filter` to restrict which tuples to display:

```yaml
directives:
  # Show 'likes' only where the value is True
  - attribute:
      field: 'likes'
      filter: 'likes & (univ -> univ -> True)'

  # Only for Student atoms, and only where active=True
  - attribute:
      field: 'active'
      selector: 'Student'                # Unary source filter
      filter: 'active & (univ -> True)'  # Tuple filter
```

The two parameters compose:

- **selector** — unary selector that filters which *source* atoms show the attribute.
- **filter** — tuple selector that filters which *specific attribute tuples* to display.

### Hide Fields

```yaml
directives:
  # Hide name relations, but only for Car atoms
  - hideField:
      field: 'name'
      selector: 'Car'

  # Hide 'active' edges only where the value is False
  - hideField:
      field: 'active'
      filter: 'active & (univ -> False)'
```

### Edge Color with Value Filters

```yaml
directives:
  # Color 'active' edges green where value is True
  - edgeColor:
      field: 'active'
      value: 'green'
      filter: 'active & (univ -> True)'

  # Red where value is False
  - edgeColor:
      field: 'active'
      value: 'red'
      filter: 'active & (univ -> False)'
```

### Group by Field with Selectors

```yaml
constraints:
  # Group by 'owns', but only for relations involving Person atoms
  - group:
      field: 'owns'
      groupOn: 0
      addToGroup: 1
      selector: 'Person'
```

---

## Backward Compatibility

Directives without `selector` continue to work as before — applying to *all* relations with the given field name:

```yaml
directives:
  # Applies to ALL name relations (legacy behavior)
  - edgeColor:
      field: 'name'
      value: 'green'
```

---

## How Evaluation Works

For each field-based directive:

1. Filter by field name.
2. If a `selector` is specified, evaluate it and keep only relations whose *source* atom is in the selected set.
3. If a `filter` is specified, evaluate it and keep only tuples matching both `selector` and `filter`.
4. With neither, apply to all relations with that field name (legacy behavior).

The `filter` parameter is available on: `attribute`, `hideField`, `edgeColor`.
