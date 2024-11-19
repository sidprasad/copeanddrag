

sig Node {
  key: one Int,     -- every node has some key 
  left: lone Node,  -- every node has at most one left-child
  right: lone Node  -- every node has at most one right-child
}


fun descendantsOf[ancestor: Node]: set Node {
  ancestor.^(left + right) -- nodes reachable via transitive closure
}
pred binary_tree {

  all n: Node | n not in descendantsOf[n] 
  all disj n1, n2: Node | n1 in n2.^(left + right + ~left + ~right)
  all n: Node | some n.left => n.left != n.right 
  all n: Node | lone parent: Node | n in parent.(left+right)
}




run {binary_tree} for exactly 5 Node
