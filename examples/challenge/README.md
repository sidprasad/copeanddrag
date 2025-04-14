# This folder contains examples of problems we are not sure CnD solves correctly

-[x] `cycle-and-orientation` : The issue here is that cyclic constraints *implicitly* introduce a start position for the ''first'' element in the ordering. This doesn't show up as much if a cycle is closed, since we pick a random element each time, btu may for a fragment. A fix here would involve looking at various permutations!
-[] `undirected-tree` : Symmmetric relations are not dealt with easily.
-[] `prims-algorithm` : Ideal layout here requires the *re-layout* of a arrows (a ternary relation, since ...)




### TO ADD

- http://nifty.stanford.edu/2025/tralie-phylogenetic-trees/