# Lightweight Visualizations for Lightweight Formal Methods


![Latest Release](https://img.shields.io/github/v/release/sidprasad/copeanddrag)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen)](https://sidprasad.github.io/copeanddrag)

Cope and Drag (or `CnD`) is a constraint-based language 
designed to help users quickly build, modify, and explore
diagrams based on Alloy and Forge instances.
The language is based on a small number of orthogonal primitives,
and is grounded in the cognitive science literature on 
effective diagramming.




## TODO:

CnD should have a 3rd section for (~ arrangement ~)
1. Projection
2. Permutation along fields (e.g. Node->Node->Weight to Node->Weight->Node)
3. Hiding Flags (hide disconnected built ins, hide disconnected)

OR should these stay within directives. 

We would have to change HOW we compute tuples for groupOn if we implement arrangement.

[ OR, could we do the permutations RIGHT at the end? No I think they sort of break "GROUP BY FIELD" OR CAN we somehow do GROUPBYFIELD differently?]


## TODO:
Diagram compactness has been broken somewhere :(

## TODO:
- Write an n-ary group example

## TODO:
- Hide disconnected builtins needs some help.