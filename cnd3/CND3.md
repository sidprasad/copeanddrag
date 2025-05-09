# CND 3


Cope and Drag v3 addresses several of the limitations of CnD 1 and 2 but 
adopting a selector-based approach to determine which atoms/fields in
a forge instance constraints shoudl apply to.

This means that, instead of being limited to `sig` types and `fields`, users can
build diagrams by refinement over any constructs capture-able by a Forge expression.

These selectors can also be applied to a range of directives (with the notable exception of `projection` and `attribute`).

This added expressivity addresses the following limitations of CnD 2:
- Meaningful layout along n-ary relations
- Layout of  non-functional, non-hierarchical relations
- Partial constraint application
- Cyclic constraint application and grouping across non-relations.




## Justification for `inferredEdge` in *Cope and Drag*

*Cope and Drag* builds diagrams *by refinement* from Alloy/Forge models, maintaining structural fidelity. However, true understanding often requires visualizing relationships that are not explicitly present in the model but are essential for mental comprehension.

The `inferredEdge` directive introduces **visually distinct edges** that represent **inferred relationships** — connections the diagrammer wants the viewer to see to better understand the model. These edges are **not part of the model itself** but help the viewer mentally hold and interpret higher-level connections.

This approach is grounded in Barbara Tversky's research on *external representations* and *tools of thought*. Tversky emphasizes that diagrams are more than data representations — they act as cognitive aids, making complex relationships more perceivable and interpretable.

> "External representations enhance cognition by providing an array that can be perceived and interpreted more easily than internal representations alone."  
> — *Barbara Tversky, 2011*

`inferredEdges` support this principle by enriching diagrams with **semantic scaffolding**, helping users perceive meaningful structure that isn’t explicitly modeled.



