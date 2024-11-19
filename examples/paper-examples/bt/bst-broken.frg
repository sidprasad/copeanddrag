#lang forge
option run_sterling "bst.js"

/*
  Model of binary search trees
  Tim, 2024
*/

sig Node {
  key: one Int,     -- every node has some key 
  left: lone Node,  -- every node has at most one left-child
  right: lone Node  -- every node has at most one right-child
}

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

pred binary_tree_buggy {
  -- no cycles (modified)
  all n: Node | n not in descendantsOf[n] 
  -- connected via finite chain of left, right, and inverses
  
  
  
  all disj n1, n2: Node | n1 in n2.^(left + right + ~left + ~right)



  -- left+right differ (unless both are empty)
   all n: Node | n.left = n.right //some n.left => n.left != n.right 
  -- nodes have a unique parent (if any)
   all n: Node | lone parent: Node | n in parent.(left+right)
}
--run {binary_tree} for 7 Node



run {binary_tree_buggy and !binary_tree} 
