#lang forge 

option problem_type temporal 

---------------- Menu ----------------
abstract sig Dish {}
-- menu options 
one sig Chicken, Burger, Tofu extends Dish {}

---------------- Kitchen ----------------
-- kitchen queue node that points to other nodes in queue -- 
sig Ticket {
    var next: lone Ticket,
    foodOrder: one Dish
}

-- pointer to tail of kitchen queue --
one sig Kitchen { // Queue Data Structure
    var placedOrder: lone Ticket // tail of the Queue
}

-- enqueue a ticket to tail of queue --
pred enqueue[q: one Kitchen, order: one Ticket] {
    // if there is no queue - the tail is empty - then make the order the tail and have no other pointer
    (q.placedOrder = none) implies { // empty queue
        q.placedOrder' = order and order.next' = none   
    }
    // if there is one node in the queue but its only the tail, then
    // set the tail as the new Ticket order (add to the bottom of queue)and point the previous tail to the front of the queue
    (some q.placedOrder and no q.placedOrder.next) implies { // one thing in the queue 
        q.placedOrder' = order and order.next' = q.placedOrder
    }
    // if there is a valid queue such that there is more than the tail and head, then 
    // set the tail as the new Ticket order (add to the bottom of queue), and point the previous tail as the next node from the new tail
    // additionally, make sure that the Ticket orders/nodes are all connected by the tail such that in the next state, the queue 
    // remains the same and is connected to the 
    // 
    (some q.placedOrder and some q.placedOrder.next) implies { // more than one thing in the queue 
        q.placedOrder' = order
        order.next' = q.placedOrder
        all links: q.placedOrder.^next | { // for all the nodes that are linked together such that their relation is transitive 
                                // node a to b and node b to c implies node a to c - all nodes linked from the placedOrder (tail) in the og state
            links.next' = links.next // ensure the rest of the queue does not change between states
        }
    }
}

-- dequeue a ticket from head of queue --
pred dequeue[q: one Kitchen] { 
    q.placedOrder != none // the queue cannot be empty 
    // if there just the tail (no next) - one order in queue 
    (some q.placedOrder and no q.placedOrder.next) implies { 
        // the tail is none and next remains none and queue is empty 
        (q.placedOrder' = none) and (q.placedOrder'.next' = none)
    }
    // if there is a tail and there is there is a pointer to the next order/node from the tail
    // there are two orders or more than two orders in the queue 
    (some q.placedOrder and some q.placedOrder.next) implies {
        // the tail will remain the same in FIFO queue implementation
        q.placedOrder' = q.placedOrder
        // there exists some node in the linked/reachable nodes from the queue tail such that.. 
        {some head: q.placedOrder.^next | {
            // the head next pointer is none (is the head)
            head.next = none 
            // and we remove that head node from the queue such that we only keep the other reachable nodes
            // in the next state 
            q.placedOrder.^next' = q.placedOrder.^next - head 
        }
        }
    } 
}

------------ Wellformed Kitchen ------------
-- ensure wellformness for the kitchen queue --
pred wellformed {   
    // for all the Tickets
    all order: Ticket | {
        // the same order cannot be linked to itself - cannot be transitive 
        order not in order.^next
        // if the order is not linked in the queue... yet :0
        // then there cannot be an pointer to the next order or a next order node - until its in the queue 
        (order not in Kitchen.placedOrder.^next) implies {
            no order.next 
            no next.order
        }
    }
}
