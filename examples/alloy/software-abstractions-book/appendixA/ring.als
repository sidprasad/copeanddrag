module appendixA/ring

sig Node { next: set Node }

pred isRing {
	// You have to fill in the appropriate formula here
	all n: Node | one n.next
}

run isRing for exactly 4 Node
