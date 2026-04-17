#lang forge

option run_sterling "bst.cnd"

/**
This is a simple Alloy model of binary search trees (BSTs).
*/
sig Tree {
    val: one Int,
    left, right: lone Tree
}

/** 
multiline docstr
*/
pred bst {
    all t: Tree | {
        t not in t.^(left+right)
        some t.left => t.left != t.right
        all t2: t.left.*(left+right) | t2.val <= t.val
        all t3: t.right.*(left+right) | t3.val > t.val     
    }
    one t: Tree | no t.~(left+right)

    
}

run {bst} 





-- racket bst.frg -O sterling_port 17100
-- then open http://localhost:8081?17100 in a web browser

