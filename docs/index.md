# Cope and Drag

CnD is a lightweight diagramming language designed for use with Alloy-like languages.


Diagrams are built by refining default Alloy output, rather than requiring users to build 
visualizations from scratch. 
This approach lets you get started quickly! Every well formed CnD spec
(*even an empty spec*) produces a diagram.

## What do CnD specs look like?

CnD uses a YAML-like syntax to define constraints and directives for refining Alloy-generated diagrams. A CnD specification consists of two primary components:

- **[Constraints](constraints.md)** that define spatial relationships between elements.
- **[Directives](directives.md)** that Control visual styling and representation.

These are combined to form a full CnD spec:

```yaml
constraints:
  - <constraint-type>: <parameters>
  - <constraint-type>: <parameters>
  .
  .
  .
directives:
  - <directive-type>: <parameters>
  - <directive-type>: <parameters>
  .
  .
  .
```

---


![Teaser Image](img/teaser.png)

More [examples](examples.md) are available here.

