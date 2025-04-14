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







