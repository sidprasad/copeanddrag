# Syntax

Cope-and-Drag (CnD) uses a YAML-like syntax to define constraints and directives for refining Alloy-generated diagrams. A CnD specification consists of two primary components:

- **Constraints**: Define spatial relationships between elements.
- **Directives**: Control visual styling and representation.

## Structure of a CnD Program

A basic CnD specification follows this structure:

```yaml
constraints:
  - <constraint-type>: <parameters>

directives:
  - <directive-type>: <parameters>
```

---

## Constraints
Constraints define spatial relationships between elements in the diagram. Each constraint consists of a **type** and associated **parameters**.

### **Cyclic Constraints**
Arranges elements related by a field in a circular layout.

```yaml
constraints:
  - cyclic:
      field: next
      direction: clockwise  # or counterclockwise
```

### **Orientation Constraints**
Specifies the relative positioning of elements.

```yaml
constraints:
  - orientation:
      field: left
      directions: [left, below]  # Multiple allowed
  - orientation:
      field: right
      directions: [right, below]
```

Alternatively, orientation can apply to entire signatures:

```yaml
constraints:
  - orientation:
      sigs: [A, B]
      directions: [above]
```

### **Grouping Constraints**
Groups elements together based on a field.

```yaml
constraints:
  - group:
      field: category
      target: domain  # or range
```

---

## Directives
Directives control the visual representation of elements, including icons, colors, attributes, and visibility.

### **Pictorial Directives**
Assigns an icon to a signature.

```yaml
directives:
  - pictorial:
      sig: Person
      icon:
        path: person.svg
        height: 20
        width: 20
```

### **Theming Directives**
Controls color, attributes, projections, and visibility.

#### **Color Assignment**
```yaml
directives:
  - theming:
      sig: Node
      color: red
```

#### **Displaying Field Attributes**
```yaml
directives:
  - theming:
      field: name
      attribute: true
```

#### **Projection**
Focuses the diagram on a specific signature.
```yaml
directives:
  - theming:
      projection: Process
```

#### **Visibility Flags**
Controls which elements are hidden.

```yaml
directives:
  - theming:
      visibility: hideDisconnected  # or hideDisconnectedBuiltIns
```

---

This syntax provides a structured and lightweight way to refine Alloy visualizations without requiring complex custom code.
