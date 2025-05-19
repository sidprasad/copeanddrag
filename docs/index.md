# Cope and Drag

**Cope and Drag** (or `CnD`) is a lightweight diagramming language designed for use with the [Forge](https://forge-fm.org/) lightweight formal methods tool.

The key idea is that `CnD` starts with a meaningful default visualization. Each operation added refines it. For example, you can *constrain* spatial layout (e.g., child nodes in a binary tree below their parents), *group* elements (e.g., nodes representing related components in a software architecture), or *direct* drawing style (e.g., color nodes in a red-black tree based on their color).

The goal isn’t to create pretty diagrams but to generate *useful* ones. Diagrams respect the model’s structure and spatial relationships. If the diagram doesn’t match the model, no diagram is generated, and a solver-generated error is produced. This helps identify *bad instances*, where the model doesn’t match the author's intent, making `CnD` a meaningful debugging tool.

> 🔍 *See our upcoming [paper in ECOOP 2025](https://www.siddharthaprasad.com/unpublished/pgnk-lightweight-diagramming.pdf).*
>


## Grounded In Cognitive Science

Cope and Drag is informed by findings from cognitive science about how people draw, interpret, and are confused by diagrams. 

### Spatial Relationships Matter

> *“Spatial thinking is the foundation of abstract thought”* - [Barbara Tversky](https://en.wikipedia.org/wiki/Barbara_Tversky)
> 

People read meaning into position - above, below, inside. Cope and Drag's **constraints** allow authors to shape diagram layouts to reflect these meaningful relationships. When spatial relationships in a diagram reflect domain relationships, they serve as cognitive aids. For example, placing a parent above its children in a family tree matches conveys a model of generational relationships, while nesting elements inside containers effectively shows membership.

These spatial choices aren't just aesthetic; they help convey the semantics of the underlying model more intuitively. By making these relationships explicit through layout, Cope and Drag helps create useful, domain specific visualizations.

### Visual Differences

> 💡 *In cognitive psychology, pre-attentive processing refers to how we perceive certain visual features—like color, size, and position—almost instantly, before focused attention.*
>

Visual features like color, size, and position are processed by our brains almost instantly. Cope and Drag uses these features strategically to make diagrams easier to understand at a glance. Directives allow diagrammers to control *how* elements are displayed (color, shapes, or size), resulting in diagrams that focus the audience on what matters most.



## Next Steps

- [Getting Started](/copeanddrag/getting-started): Install the tool, explore how it interfaces with Forge.
- [Examples](/copeanddrag/examples): Play with some pre-built example diagrams.


