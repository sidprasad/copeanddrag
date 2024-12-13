#lang forge

/*
  Model of ROBDDs
  Tim Nelson (December 2024)
*/


sig Variable {}

abstract sig Node {}
sig Split extends Node {
    v: one Variable,
    t: one Node,
    f: one Node
}

// Allow duplicate True, False nodes in the overall model, so we can show reduction.
sig True, False extends Node {}

pred is_bdd {
    // There is only one split node with no parents
    one s: Split | no s.(~t + ~f)
    // There are no cycles (including no self loops)
    all n1, n2: Node | n1 in n2.^(t+f) implies n2 not in n1.^(t+f)
}

pred is_ordered {
    // There is an ordering of variables that the induced node-ordering of t, f respects. 
    // We won't make this explicit, but rather will say that any time there is reachability 
    // from n1 to n2, no other reachability with opposite variables exists. 
    all disj n1, n2: Split | n2 in n1.^(t+f) => {
        no m1, m2: Split | {
            m2 in m1.^(t+f)
            m1.v = n2.v
            m2.v = n1.v
        }
    }
}

pred is_reduced {
    // No node has the same t-child and f-child
    all s: Split | s.t != s.f
    // No 2 nodes are roots are isomorphic subgraphs. We'll encode this in a way that 
    // doesn't require a notion of isomorphism. Instead, we'll take advantage of an
    // induction property. 
    // Base case: no duplicate terminal nodes.
    lone True
    lone False 
    // Inductive case, on reverse-depth, no two nodes point to same T/F children.
    all disj s1, s2: Split | {
        s1.t != s2.t or s1.f != s2.f
    }
}

run {
    is_bdd
    is_ordered
    is_reduced
} for exactly 10 Node