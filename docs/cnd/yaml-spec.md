# YAML Specification

The CnD layout specification describes how diagrams are laid out as a YAML document. A spec has two top-level sections — both optional:

```yaml
constraints:
  - # ... constraint definitions

directives:
  - # ... directive definitions
```

An empty specification is valid.

**Constraints** control the structural layout of nodes and their spatial relationships.
**Directives** control visual styling and presentation without affecting layout structure.

---

## Constraints

### Orientation

Specifies the relative positioning of elements selected by a binary/n-ary selector.

```yaml
- orientation:
    selector: <binary-selector>    # Required: selector returning pairs (source -> target)
    directions: [<direction>, ...] # Required: array of positioning directions
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `selector` | yes | string | Binary selector (e.g., `parent`, `Node->Node`) |
| `directions` | yes | array | One or more positioning directions |

**Available directions:**

- `above` — source is above target (with flexibility)
- `below` — source is below target (with flexibility)
- `left` — source is left of target (with flexibility)
- `right` — source is right of target (with flexibility)
- `directlyAbove` — source is directly above target (strict vertical alignment)
- `directlyBelow` — source is directly below target (strict vertical alignment)
- `directlyLeft` — source is directly left of target (strict horizontal alignment)
- `directlyRight` — source is directly right of target (strict horizontal alignment)

**Examples:**

```yaml
# Parent nodes appear above child nodes
- orientation:
    selector: parent
    directions: [above]

# Nodes flow left to right with strict horizontal alignment
- orientation:
    selector: next
    directions: [directlyLeft]

# Multiple directions: source is above and to the left
- orientation:
    selector: precedes
    directions: [above, left]
```

**Restrictions:**

- Cannot combine `above` with `below`
- Cannot combine `left` with `right`
- `directly*` variants can only combine with their non-direct counterpart (e.g., `directlyAbove` with `above`)

---

### Cyclic

Arranges elements along the perimeter of a circle based on selector order.

```yaml
- cyclic:
    selector: <binary-selector>  # Required: selector defining circular ordering
    direction: <rotation>        # Optional: rotation direction (default: clockwise)
```

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `selector` | yes | string | — | Binary selector defining the cycle order |
| `direction` | no | string | `clockwise` | `clockwise` or `counterclockwise` |

**Examples:**

```yaml
# Arrange states in a clockwise cycle
- cyclic:
    selector: nextState
    direction: clockwise

# Counter-clockwise arrangement
- cyclic:
    selector: follows
    direction: counterclockwise
```

---

### Align

Ensures elements are aligned horizontally or vertically.

```yaml
- align:
    selector: <n-ary-selector>   # Required: selector returning elements to align
    direction: <alignment>       # Required: horizontal or vertical
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `selector` | yes | string | Selector returning atoms to align |
| `direction` | yes | string | `horizontal` or `vertical` |

**Examples:**

```yaml
# Align all Person nodes horizontally (same Y coordinate)
- align:
    selector: Person
    direction: horizontal

# Align selected nodes vertically (same X coordinate)
- align:
    selector: Node.selected
    direction: vertical
```

---

### Group (by Selector)

Groups elements based on a selector expression.

```yaml
- group:
    selector: <n-ary-selector>   # Required: selector returning elements to group
    name: <group-name>           # Required: display name for the group
    addEdge: <boolean>           # Optional: add visual edge to group members
```

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `selector` | yes | string | — | Selector returning atoms to include in group |
| `name` | yes | string | — | Display name shown on the group box |
| `addEdge` | no | boolean | `false` | Whether to add visual edges between group members |

**Examples:**

```yaml
# Group all Team members together
- group:
    selector: Team.members
    name: "Team Members"

# Group with connecting edges
- group:
    selector: Department.employees
    name: "Department"
    addEdge: true
```

---

### Group (by Field)

Groups elements based on a relational field (tuple-based grouping).

```yaml
- group:
    field: <field-name>          # Required: relation field name
    groupOn: <index>             # Required: tuple index for the group key (0-based)
    addToGroup: <index>          # Required: tuple index for grouped element (0-based)
    selector: <unary-selector>   # Optional: filter which source atoms apply
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `field` | yes | string | Name of the relation/field |
| `groupOn` | yes | integer | Index of the tuple element to use as group key |
| `addToGroup` | yes | integer | Index of the tuple element to add to the group |
| `selector` | no | string | Unary selector to filter which atoms this applies to |

**Examples:**

```yaml
# Group employees by their department
# For relation: worksIn: Employee -> Department
- group:
    field: worksIn
    groupOn: 1      # Department is the group key
    addToGroup: 0   # Employee gets added to the group

# Group with selector filter
- group:
    field: owns
    groupOn: 0
    addToGroup: 1
    selector: Person
```

---

### Negation (`hold: never`)

Any constraint can be negated by adding `hold: never`. By default, all constraints implicitly have `hold: always`. A negated constraint asserts that the relationship must **never** hold.

```yaml
- orientation:
    selector: <binary-selector>
    directions: [<direction>, ...]
    hold: never

- align:
    selector: <binary-selector>
    direction: <alignment>
    hold: never

- cyclic:
    selector: <binary-selector>
    direction: <rotation>
    hold: never

- group:
    selector: <n-ary-selector>   # name is optional for hold: never
    hold: never
```

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `hold` | no | string | `always` | `always` (constraint must hold) or `never` (constraint must not hold) |

**Semantics:**

| Positive | `hold: never` meaning |
|----------|----------------------|
| `above` | A.y ≤ B.y (at same level or below) |
| `below` | A.y ≥ B.y (at same level or above) |
| `left` | A.x ≥ B.x (at same position or right) |
| `right` | A.x ≤ B.x (at same position or left) |
| `align horizontal` | Must have different Y coordinates (disjunction: one above the other) |
| `align vertical` | Must have different X coordinates (disjunction: one left of the other) |
| `cyclic clockwise` | No valid clockwise rotation holds (De Morgan over rotational alternatives) |
| `group` | No clean bounding rectangle can contain exactly these members |

For groups, `hold: never` asserts that no axis-aligned rectangle can contain exactly the group's members without also containing a non-member. No visual rectangle is drawn. The `name` field is optional (auto-generated if omitted).

**Examples:**

```yaml
# Ensure children NEVER appear above parents
- orientation:
    selector: parent
    directions: [above]
    hold: never

# Nodes must NEVER be horizontally aligned
- align:
    selector: A->B
    direction: horizontal
    hold: never

# Do NOT arrange states clockwise
- cyclic:
    selector: nextState
    direction: clockwise
    hold: never

# No clean rectangle can contain just these nodes
- group:
    selector: Alpha
    hold: never
```

**Restrictions:** double negation is not supported.

---

### Size

Sets the width and height of nodes matching a selector. (Can also be used as a directive.)

```yaml
- size:
    selector: <unary-selector>   # Required: selector for nodes to resize
    width: <number>              # Optional: width in pixels
    height: <number>             # Optional: height in pixels
```

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `selector` | yes | string | — | Unary selector for target nodes |
| `width` | no | number | `100` | Width in pixels (must be > 0) |
| `height` | no | number | `60` | Height in pixels (must be > 0) |

```yaml
- size:
    selector: ImportantNode
    width: 150
    height: 80
```

---

### Hide Atom

Hides atoms matching a selector from the visualization. (Can also be used as a directive.)

```yaml
- hideAtom:
    selector: <unary-selector>   # Required: selector for atoms to hide
```

```yaml
- hideAtom:
    selector: InternalNode
```

---

## Directives

### Atom Color

Sets the color of atoms matching a selector.

```yaml
- atomColor:
    selector: <unary-selector>   # Required
    value: <color>               # Required: CSS color
```

```yaml
- atomColor:
    selector: Person
    value: "#ff5733"

- atomColor:
    selector: Error
    value: red
```

---

### Edge Style (`edgeColor`)

Customizes the appearance of edges for a specific field/relation.

```yaml
- edgeColor:
    field: <field-name>          # Required: relation/field name
    value: <color>               # Required: edge color
    selector: <unary-selector>   # Optional: filter by source atom
    filter: <n-ary-selector>     # Optional: filter which tuples apply
    style: <line-style>          # Optional: line style
    weight: <number>             # Optional: line thickness
    showLabel: <boolean>         # Optional: show edge label
    hidden: <boolean>            # Optional: hide the edge entirely
```

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `field` | yes | string | — | Name of the relation |
| `value` | yes | string | — | CSS color value |
| `selector` | no | string | — | Unary selector to filter source atoms |
| `filter` | no | string | — | N-ary selector to filter specific tuples |
| `style` | no | string | `solid` | `solid`, `dashed`, or `dotted` |
| `weight` | no | number | — | Line thickness in pixels |
| `showLabel` | no | boolean | `true` | Whether to display the edge label |
| `hidden` | no | boolean | `false` | Hide the edge from display |

```yaml
# Color all 'parent' edges blue
- edgeColor:
    field: parent
    value: blue

# Dashed red edges for specific source type
- edgeColor:
    field: references
    value: red
    selector: Document
    style: dashed
    weight: 2

# Hide edges but keep the relationship
- edgeColor:
    field: internal
    value: gray
    hidden: true
```

---

### Icon

Assigns an icon to atoms matching a selector.

```yaml
- icon:
    selector: <unary-selector>   # Required
    path: <icon-path>            # Required: path or name of the icon
    showLabels: <boolean>        # Optional: show text labels alongside icon
```

```yaml
- icon:
    selector: Person
    path: "user"
    showLabels: true

- icon:
    selector: File
    path: "/icons/file.svg"
```

---

### Attribute

Converts edge relationships into node attributes (displayed as key-value pairs on nodes).

```yaml
- attribute:
    field: <field-name>          # Required
    selector: <unary-selector>   # Optional: filter which source atoms apply
    filter: <n-ary-selector>     # Optional: filter which tuples to include
```

**Behavior:** removes the edge from the graph; displays the target value as an attribute on the source node. Multiple targets become a list.

```yaml
# Show 'age' as an attribute instead of an edge
- attribute:
    field: age

# Only for Person nodes
- attribute:
    field: name
    selector: Person

# Filter to only show active relationships
- attribute:
    field: status
    filter: 'status & (univ -> Active)'
```

---

### Tag

Adds computed attributes to nodes based on selector evaluation. Unlike `attribute`, this doesn't remove edges.

```yaml
- tag:
    toTag: <unary-selector>      # Required: atoms to receive the tag
    name: <attribute-name>       # Required: attribute name to display
    value: <n-ary-selector>      # Required: selector whose result becomes the value
```

**Behavior:** for binary results displays as `name: value`; for n-ary results displays as `name[key1][key2]: value`.

```yaml
# Simple binary tag
- tag:
    toTag: Person
    name: age
    value: age

# Ternary selector — shows as score[Math]: 95, score[English]: 87
- tag:
    toTag: Student
    name: score
    value: grades
```

---

### Hide Field

Hides edges for a specific field/relation.

```yaml
- hideField:
    field: <field-name>          # Required
    selector: <unary-selector>   # Optional: filter by source atom
    filter: <n-ary-selector>     # Optional: filter which tuples to hide
```

```yaml
# Hide all 'internal' edges
- hideField:
    field: internal

# Hide only from certain source types
- hideField:
    field: debug
    selector: Production
```

---

### Hide Atom

Hides atoms matching a selector.

```yaml
- hideAtom:
    selector: HelperNode
```

---

### Inferred Edge

Creates visual edges based on a selector expression (edges that don't exist in the data).

```yaml
- inferredEdge:
    name: <edge-label>           # Required
    selector: <binary-selector>  # Required: pairs to connect
    color: <color>               # Optional
    style: <line-style>          # Optional
    weight: <number>             # Optional
```

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `name` | yes | string | — | Label displayed on the edge |
| `selector` | yes | string | — | Binary selector returning (source, target) pairs |
| `color` | no | string | `#000000` | CSS color value |
| `style` | no | string | `solid` | `solid`, `dashed`, or `dotted` |
| `weight` | no | number | — | Line thickness in pixels |

```yaml
# Show transitive closure as inferred edges
- inferredEdge:
    name: "reachable"
    selector: "^parent"
    color: gray
    style: dotted

# Highlight computed relationships
- inferredEdge:
    name: "sibling"
    selector: "~parent.parent - iden"
    color: purple
    style: dashed
    weight: 2
```

---

### Flag

Sets global visualization flags.

```yaml
- flag: <flag-name>
```

| Flag | Description |
|------|-------------|
| `hideDisconnected` | Hide all nodes with no edges |
| `hideDisconnectedBuiltIns` | Hide built-in type nodes (Int, String, etc.) with no edges |

```yaml
- flag: hideDisconnected
- flag: hideDisconnectedBuiltIns
```

---

## Selector Syntax

Selectors are expressions that identify atoms or tuples. The syntax depends on your data format (Forge, Alloy, etc.); common patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| `TypeName` | All atoms of a type | `Person` |
| `fieldName` | All tuples in a relation | `parent` |
| `Type.field` | Field access | `Person.age` |
| `selector1 + selector2` | Union | `Student + Teacher` |
| `selector1 & selector2` | Intersection | `Person & Employee` |
| `selector1 - selector2` | Difference | `Person - Manager` |
| `~selector` | Transpose | `~parent` (child relation) |
| `^selector` | Transitive closure | `^parent` (all ancestors) |
| `*selector` | Reflexive transitive closure | `*parent` |
| `selector1 -> selector2` | Product | `Person -> Int` |
| `selector1.selector2` | Join | `Person.parent` |

See [Evaluators](./evaluators) for the full query languages.

---

## Complete Example

```yaml
constraints:
  # Layout structure
  - orientation:
      selector: parent
      directions: [above]

  - align:
      selector: siblings
      direction: horizontal

  # Grouping
  - group:
      selector: Team.members
      name: "Team"

  # Circular layout for a state machine
  - cyclic:
      selector: nextState
      direction: clockwise

  # Negation: siblings must NEVER be vertically stacked
  - orientation:
      selector: siblings
      directions: [above]
      hold: never

directives:
  # Visual styling
  - atomColor:
      selector: Person
      value: "#4a90d9"

  - atomColor:
      selector: Error
      value: red

  - icon:
      selector: File
      path: "file-icon"
      showLabels: true

  # Edge styling
  - edgeColor:
      field: error
      value: red
      style: dashed
      weight: 2

  # Convert to attributes
  - attribute:
      field: age
      selector: Person

  - tag:
      toTag: Student
      name: grade
      value: currentGrade

  # Hide clutter
  - hideField:
      field: internal

  - hideAtom:
      selector: HelperNode

  - flag: hideDisconnectedBuiltIns

  # Show computed relationships
  - inferredEdge:
      name: "ancestor"
      selector: "^parent"
      color: gray
      style: dotted
```
