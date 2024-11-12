#lang forge

open "normal_kitchen_queue.frg"

option problem_type temporal 

// EXTRA FUNCTIONALITY:
--> add price to dish 
--> have a set --> cardinality is number of custiomers in party, each set element represents a menu option, each num coresponds to menu item 

------------- DEFINITIONS -------------
-------- Employees & Customers --------

abstract sig Person {}

sig Customer extends Person {
  var status: one CustomerStatus
}

abstract sig CustomerStatus {}
one sig Waiting, Seated, Ordered, Ready4Check extends CustomerStatus {} //state changes

sig Party {
  people: set Customer,
  size: one Int, 
  var spot: lone Table
}

sig Server extends Person {
  myTables: set Table
}

---------------- Table ----------------

sig Table {
  customersAtTable: set Customer, //take this out 
  tableNumber: one Int,
  capacity: one Int,
  var orders: set Dish
}

abstract sig TableStatus {
  var tables: set Table
}
one sig Available, Full extends TableStatus {} 

/*
--------------- VALID STATE --------------
/*Ensures that each state is valid - no crazy instances
--> Tables are either Available OR Full | can't be both
--> Customers are either Waiting or Seated or Ordered or Ready4Check | cant be none
--> Table numbers must be positive/in a specific range [1-5]
--> Each Table should have a unique table number
--> rn we only have 6 tables in our resturant!
*/

pred valid_state {
  --> Tables are either full or occupied, cannot be both
  Table = Available.tables + Full.tables
  no t : Table | {t in Available.tables and t in Full.tables}

  --> Customers are either Waiting or Seated or Ordered or Ready4Check
  all c: Customer | c.status != none

 --> Tables numbers cannot be negative / need to be in a specific range (1-5)
 all t: Table | t.tableNumber > 0 and t.tableNumber < 6
 all t: Table | {#{t}<6}

 --> Each table has a unique table #
  all disj t1, t2: Table | {
    //assign unique table number 
    //for future consideration: consider limiting table number scope in 
    //more generalizable way 
    t1.tableNumber != t2.tableNumber 
  }
} 

/*
--------------- INIT STATES --------------
The following predicates work together to Initialize Resturant at the beginning of the day | Opening State 
-- TABLE INIT
-- CUSTOMER INIT 
-- PARTY INIT 
-- SERVER INIT
-- KITCHEN INIT
*/

--------------- init tables --------------
--> All Tables are available
--> No customers at any table
--> No orders at the table
--> Setting capacity to specified range {2, 4}
--> Must be at least one table in the resturant 

pred table_init {
  Table = Available.tables

  all t: Table | {
    no c : Customer | c in t.customersAtTable
    t.orders = none
  }

  all t: Table | {
    t.capacity = 2 or t.capacity = 4
    #{c: Customer | c in t.customersAtTable} = 0 //duplicate?
  }

  #{Table} >= 1 
}

--------------- init customers --------------
--> All Customers are Waiting (none are in the resturant yet)
--> each customer is part of ONE party 

pred customer_init {
  all c: Customer | c.status = Waiting

  all c: Customer | some p: Party | {c in p.people}
}

--------------- init party --------------
--> each party has 1 or more people & the party size = the size of the customer list
--> no customer can be in two partys

pred party_init {
  all p: Party | {
    p.size > 0
    #{p.people} = {p.size}
    p.spot = none
  }

  all disj p, q: Party | {
    all c: Customer | {
      c in p.people => c not in q.people
    }
  }
}

--------------- init servers --------------
--> There are not more servers than tables in resturant
--> Each table only has one server
--> Every table has a server 

pred server_init {
  valid_state implies {
    all s: Server, t: Table | {
      #{s} <= #{t}
    }
  }
  
  all disj s1, s2: Server | {
    s1.myTables != s2.myTables
    no t: Table | t in s1.myTables and t in s2.myTables // this might be better 
  }

  all s: Server | {
    s.myTables != none
  }

  #{Server.myTables} = #{Table}
}

--------------- init kitchen --------------
--> the kitchen is empty with no orders 
--> no ticket points to another ticket 
pred kitchen_init {
    Kitchen.placedOrder = none // no queue 
    next = none->none  // there is no next yet 
}


----------- CUSTOMER TRANSITIONS ----------
------------------- seat ------------------
--> assigns a customer party, p, to a table in resturant 

pred seat[p: Party] {
  -- GAURD
  --> Party does not have a spot
  p.spot = none 

  -- ACTION[s]
  --> trantision customers state in party, p, to seated 
  --> assings some table, t, to the parties spot field 
  --> Marks table as Full
  all c: Customer | { 
    {c in p.people => {
       c.status = Waiting => c.status' = Seated 
    } else {
      c.status = Waiting => c.status' = Waiting
    } } 
  }

  some t: Table | {
    (t in Available.tables and t.capacity >= p.size) => 
    {
      p.spot' = t
      Available.tables' = Available.tables - t
      Full.tables' = Full.tables + t
    } 
  }
}

------------------- order ------------------
--> takes party, p's, order and sends it into kitchen queue

pred order[p: Party] {
  -- GUARD
  --> no orders | table is full
  no p.spot.orders and p.spot in Full.tables

  -- CONSTANTS
  --> table spots should not change
  --> available and full tables 
  p.spot' = p.spot
  Available.tables' = Available.tables
  Full.tables' = Full.tables

  -- ACTION
  --> transition customers in table to orderd 
  --> collect customers/entrire table's orders and sends to kitchen
  order_ticket[p]

  all c: Customer | {
    c in p.people => {
      c.status = Seated => c.status' = Ordered
    } else {
      c.status' = c.status
    }
  }
}


pred order_ticket[p: Party] {
  -- there exists the party's entire order/ticket 
  some partyOrder: Ticket | {
    -- GUARD 
    --> ensure that there is nothing in the Kitchen yet 
    --> ensure that the table doesn't have any food yet 
    kitchen_init
    p.spot.orders = none

    -- ACTION
    --> place the party's order into the queue 
    --> set the next order to the current party's order (none for this instance)
    --> next state doesn't have any food yet considering they've only ordered 
    Kitchen.placedOrder' = partyOrder
    next' = none->none 
    p.spot.orders' = p.spot.orders

    --> ensure it follows our enqueue predicate
    enqueue[Kitchen, partyOrder]
  }
}

------------------- eating ------------------
--> represents customers recieving their food, eating, and getting ready to leave

pred eating[p: Party] {
  -- GUARD
  --> make sure that the our kitchen has our order (single order)
  some t: Ticket | {
    Kitchen.placedOrder = t
  }

  -- CONSTANTS
  --> table spots should not change
  p.spot' = p.spot

  --> available and full tables 
  Available.tables' = Available.tables
  Full.tables' = Full.tables

  -- ACTION
  --> serve the table their order and clear their order from the Kitchen
  serve_ticket[p]
  --> ensure customers are ready for their checks and have eaten 
  all c: Customer | {
    c in p.people => {
        c.status = Ordered => c.status' = Ready4Check
    } else 
      c.status = c.status'
  }
}

--> Helper for eating
pred serve_ticket[p: Party] {
    -- ACTION
    --> add the tickets orders to their corresponding party's (only one party for now)
    --> clear the kitchen of that specific order 
    p.spot.orders' = p.spot.orders + Kitchen.placedOrder.foodOrder
    Kitchen.placedOrder' = none
    next = none->none

    // ensure dequeue was enforced 
    dequeue[Kitchen]
}

------------------- leave ------------------
--> represents customers leaving the resturant, resets all fields 

pred leave[p: Party] {
  -- GUARD 
  p.spot.orders not in Kitchen.placedOrder.^next
  --> ACTION
  --> reset customer status to waiting
  --> restet party spot to none 
  --> mark table as Available 

  all c: Customer | {
    c in p.people => {
      c.status = Ready4Check => c.status' = Waiting 
    } else {
      c.status = Ready4Check => c.status' = Ready4Check 
    }
  }

  p.spot' = none 
  Available.tables' = Available.tables + p.spot
  Full.tables' = Full.tables - p.spot
}

------------------- customerTransistion ------------------
--> Transitions customers through CustomerStatus with their assigned party - does not control any other fields 

pred customerTransistion[p: Party] {  
  all c: Customer | {
    c in p.people => {
       c.status = Waiting => c.status' = Seated 
       c.status = Seated => c.status' = Ordered
       c.status = Ordered => c.status' = Ready4Check
        c.status = Ready4Check => c.status' = Waiting 
    } else {
      c.status = Waiting => c.status' = Waiting
      c.status = Seated => c.status' = Seated
      c.status = Ordered => c.status' = Ordered
      c.status = Ready4Check => c.status' = Ready4Check 
    }
  }
}

--> cycles customers through resturant
pred run_states[p: Party] {
  some c: Customer | {
    c in p.people 
    c.status = Waiting => seat[p]
    c.status = Seated => order[p]
    c.status = Ordered => eating[p]
    c.status = Ready4Check => leave[p]
  }
} 

--------------- RUN STATEMENTS for front_of_house.frg --------------
 
--> Beginning of the day represents the resturant in its opening state
pred beginning_of_day {
  always valid_state
  table_init
  server_init
  customer_init
  party_init
  kitchen_init
}

--> customers_transition_with_party shows customers transitioning through the CustomerStatus states with their parties
-- only customer states change here --> tables/orders/etc. don't 
pred customers_transition_with_party {
  beginning_of_day
  always {
    some p: Party {
      customerTransistion[p]
    }
  }
}

--> customer_lifecycle takes one party through a full resturant lifecycle 
pred customer_lifecycle {
  beginning_of_day
  always wellformed
  some p: Party | {always run_states[p]}
}

// run {beginning_of_day} for 5 Int, exactly 7 Person, exactly 5 Customer, exactly 2 Server, exactly 4 Table
// run {customer_lifecycle} for 5 Int, exactly 7 Person, exactly 5 Customer, exactly 2 Server, exactly 4 Table, exactly 2 Party
// run {seat_customers} for 5 Int, exactly 7 Person, exactly 5 Customer, exactly 2 Server, exactly 4 Table, exactly 2 Party

--------------- RUN STATEMENTS for normal_kitchen_queue.frg --------------

-- Only Enqueuing Trace --
pred four_tickets{
  some order1, order2, order3, order4: Ticket | {
    #(order1 + order2 + order3 + order4) = 4
    // State 0 - empty kitchen
    kitchen_init

    // State 1 - 1st order in!
    Kitchen.placedOrder' = order1 // just the tail of queue - 1st order in!
    next' = none->none // no next node yet since only one node in queue

    // State 2 - 2nd order in!
    Kitchen.placedOrder'' = order2 // new Ticket is added to the tail of the queue - 2nd order in!
    next'' = order2->order1 // previous tail becomes head/next 

    // State 3 - 3rd order in!
    Kitchen.placedOrder''' = order3
    next''' = order3->order2 + order2->order1

    // State 4 - 4th order in!
    Kitchen.placedOrder'''' = order4
    next'''' = order4->order3 + order3->order2 + order2->order1

    // make sure that it follows our enqueue model 
    enqueue[Kitchen, order1]
    next_state enqueue[Kitchen, order2]
    next_state next_state enqueue[Kitchen, order3]
    next_state next_state next_state enqueue[Kitchen, order4]
  }
}

-- Enqueue and Dequeue Trace --
pred order_and_serve {
  some order1, order2: Ticket, t: Table | {
    // State 0 - nothing in kitchen
    kitchen_init
    t.orders = none

    // State 1 - 1st order in!
    Kitchen.placedOrder' = order1 // just the tail of queue - 1st order in!
    next' = none->none // no next node yet since only one node in queue
    t.orders' = t.orders


    // State 2 - 2nd order in!
    Kitchen.placedOrder'' = order2 // new Ticket is added to the tail of the queue - 2nd order in!
    next'' = order2->order1 // previous tail becomes head/next 
    t.orders'' = t.orders'


    // State 3 - 1st order out!
    Kitchen.placedOrder''' = order2
    next''' = none->none
    t.orders''' = t.orders'' + order1.foodOrder

    // State 4 - 2nd order out!
    kitchen_init
    t.orders'''' = t.orders''' + order2.foodOrder

    // make sure that it follows our enqueue and dequeue model 
    enqueue[Kitchen, order1]
    next_state enqueue[Kitchen, order2]
    next_state next_state dequeue[Kitchen]
    next_state next_state next_state dequeue[Kitchen]
  }
}

--- Run Statements --

--> Only shows enqueing for 4 tickets in a queue  
run {
    wellformed
    four_tickets
} for 4 Ticket, 1 Kitchen

--> Shows enqueing and dequing 2 tickets in a queue 
// run {
//     wellformed
//     order_and_serve
// } for 2 Ticket, 1 Kitchen
// run {
//     wellformed
//     order_and_serve
// } for 2 Ticket, 1 Kitchen

