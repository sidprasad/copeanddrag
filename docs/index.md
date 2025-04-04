# Cope and Drag

CnD is a lightweight diagramming language designed for use with Alloy-like languages.


Diagrams are built by refining default Alloy output, rather than requiring users to build 
visualizations from scratch. 
This approach lets you get started quickly! Every well formed CnD spec
(*even an empty spec*) produces a diagram.

## Installing CnD

`CnD` is packaged as an easy to install webserver! Download `CnD` from [Releases](https://github.com/sidprasad/copeanddrag/releases),
and launch it by running `node index.js`. This will make the `CnD` server available on `localhost:3000`.


## What do CnD specs look like?

A CnD specification consists of two primary components:

- **[Constraints](constraints.md)** that define spatial relationships between elements.
- **[Directives](directives.md)** that Control visual styling and representation.

These can be expressed both via YAML and a structured, no code interface. 


### YAML Syntax

CnD code is written in a YAML-like syntax. These are combined to form a full CnD spec:

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


### No Code Interface

The structured view provides a no code interface for authoring CnD specifications.

![No Code Interface Screenshot](img/nocode.png)

----


