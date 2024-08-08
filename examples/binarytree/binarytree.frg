#lang forge


// Define the Binary Tree signature
sig Node {
    left: lone Node,
    right: lone Node,
    value : one Int
}



pred binaryTree {

    // One root Node
    (some Node) => {
        one r : Node | {
            Node in r.*(left + right)
            no p: Node | r in p.left + p.right
        } 
    }

    all n : Node | {
        no m : Node | {
            m in (n.left).*(left + right) 
            m in (n.right).*(left + right) 
        }
    }
    // No cycles
    no n: Node | n in n.^(left + right)

}


// Run the binary tree model
run {binaryTree} for exactly 5 Node