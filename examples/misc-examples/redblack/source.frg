#lang forge


abstract sig Node {
  key: one Int,     -- every node has some key 
  left: lone Node,  -- every node has at most one left-child
  right: lone Node  -- every node has at most one right-child
}

sig Red extends Node {}
sig Black extends Node {}




fun descendantsOf[ancestor: Node]: set Node {
  ancestor.^(left + right) -- nodes reachable via transitive closure
}
pred binary_tree {
  -- no cycles (modified)
  all n: Node | 
    n not in descendantsOf[n] 
  -- connected via finite chain of left, right, and inverses
  all disj n1, n2: Node | n1 in n2.^(left + right + ~left + ~right)
  -- left+right differ (unless both are empty)
  all n: Node | some n.left => n.left != n.right 
  -- nodes have a unique parent (if any)
  all n: Node | lone parent: Node | n in parent.(left+right)

}

pred bst {
    binary_tree

    all n: Node | {
        (some (n.left ))   => ((n.left).key <= n.key)
        (some (n.right) ) => (n.key < (n.right).key)
    }

}


pred redblacktree {

    bst

    -- Red nodes have black children
    all n: Red | (some n.(left + right)) => (n.(left + right) in Black)

    -- Black height is the same for all paths
    -- Is this right?
    all n: Node | {
        #(descendantsOf[n.left] & Black) = #(descendantsOf[n.right] & Black)
    }

    -- Root is black
    --all n: Node | ((Node-n) = descendantsOf[n]) => (n in Black)

    no n : Node | {
        no left.n
        no right.n
        n in Red
    }

}

run {redblacktree and (some Node)} for exactly 7 Node
