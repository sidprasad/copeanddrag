
An urban planner is trying to design a new subway system. They have represented their design with a diagram,
where:
- Subway stations are represented by graph nodes.
- The next station accessible via the train from a station is represented by edges labelled `next`.
  
- The relative positions of stations are represented by edges labelled `north` and `east`. 
  - A `north` edge means that the pointed at station is directly north of the pointing station.
  - An `east` edge means that the pointed at station is directly east of the pointing station.



### Question 1
What is the southern most station in diagram?
Answer: Station0

### Question 2

The subway system is designed so that riders can get to the downtown station from *any other* station. In terms of the diagram, this means that there is a station that can be reached following `next` edges from any other station. 

Which station represents this downtown station?

Answer: Station3


### Question 3

Which is the northernmost station from which you can get to Station2?

Answer: Station 4

### Question 4

A good subway system is resilient to train breakdowns and slowdowns. This means that there
are sometimes multiple paths between important stations.

How many paths are there from Station1 to Station4?


Answer : 0