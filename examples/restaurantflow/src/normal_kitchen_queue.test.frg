#lang forge

open "front_of_house.frg"
open "normal_kitchen_queue.frg"

option problem_type temporal 


----- TESTING -----

----- TESTING ENQUEUE -----
test suite for enqueue {
    test expect {
        -- enqueue -> enqueue
        simpleOrderTickets: {
            some order1, order2: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1 
                next' = none->none

                // State 2 - 2nd order in!
                q.placedOrder'' = order2 
                next'' = order2->order1 

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state enqueue[q, order2]
            }
        }  is sat 

        negSimpleOrderTickets: {
            some order1, order2: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1 
                next' = none->none 

                // State 2 - 2nd order in!
                q.placedOrder'' = order2 
                next'' = none->none

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state enqueue[q, order2]
            }
        } is unsat
    }
}
----- TESTING DEQUEUE -----

test suite for dequeue {
    test expect {
        -- enqueue -> dequeue
        simpleServeTickets: {
            some order1: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1 
                next' = none->none

                // State 2 - 2nd order in!
                q.placedOrder'' = none
                next'' = none->none 

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state dequeue[q]
            }
        }  is sat 

        -- enqueue -> dequeue (but form enqueue) should be unsat
        negSimpleServeTickets: {
            some order1, order2: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1
                next' = none->none 

                // State 2 - 2nd order in! - but we want to dequeue so second order cant be in before we dequeue 
                q.placedOrder'' = order2
                next'' = order2->order1 

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state dequeue[q]
            }
        } is unsat

        -- enqueue -> dequeue -> enqueue
        serveAndOrder1: {
            some order1, order2: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1 
                next' = none->none 

                // State 2 - 1st order out!
                q.placedOrder'' = none 
                next'' = none->none 

                //State 3 - 2nd order in! 
                q.placedOrder''' = order2
                next''' = none->none

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state dequeue[q]
                next_state next_state enqueue[q, order2]
            }
        } is sat 
        
        -- enqueue -> eneque -> dequeue -> enqueue
        serveAndOrder2: {
            some order1, order2, order3: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1 
                next' = none->none 

                // State 2 - 2nd order in!
                q.placedOrder'' = order2 
                next'' = order2->order1 

                //State 3 - 1st order out! 
                q.placedOrder''' = order2
                next''' = none->none

                //State 4 - 3rd order in! 
                q.placedOrder'''' = order3
                next'''' = order3->order2


                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state enqueue[q, order2]
                next_state next_state dequeue[q]
                next_state next_state next_state enqueue[q, order3]
            }
        } is sat 
    }
}

----- TESTING WELLFORMEDNESS -----

// for wellformed assertion 
pred validWellformed {
    all order: Ticket | {
        // the same order cannot be linked to itself - cannot be transitive 
        order not in order.^next
    }
}

// for wellformed assertion 
pred nonvalidWellformed {
    not kitchen_init // not at the empty state (stuff in queue)
    all order: Ticket | {
        // the same order cannot be linked to itself - but for a bad wellformed 
        // it can 
        order in order.^next
    } 
}

// for wellformed assertion 
pred notNonvalidWellformed {
    not nonvalidWellformed
}

test suite for wellformed {
    test expect {
        -- enqueue -> dequeue
        wellformedimpleServeTickets: {
            wellformed
            some order1: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1 
                next' = none->none

                // State 2 - 2nd order in!
                q.placedOrder'' = none
                next'' = none->none 

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state dequeue[q]
            }
        }  is sat  

        nonWellformedimpleServeTickets: {
            wellformed
            some order1: Ticket, q: Kitchen | {
                // State 0 - empty kitchen
                kitchen_init

                // State 1 - 1st order in!
                q.placedOrder' = order1  // points to itself when in queue -- dont really care what happens outside of queue? but can probably implement it
                next' = order1->order1

                // State 2 - 2nd order in!
                q.placedOrder'' = none
                next'' = none->none 

                // make sure that it follows our enqueue model 
                enqueue[q, order1]
                next_state dequeue[q]
            }
        }  is unsat  
    }

    // assert common logical statements about wellformed
    assert validWellformed is necessary for wellformed
    assert notNonvalidWellformed is necessary for wellformed
}

