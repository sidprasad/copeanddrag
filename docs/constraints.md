# Constraints
Constraints define spatial relationships between elements in the diagram. Each constraint consists of a **type** and associated **parameters**.

## **Cyclic Constraints**
Cyclic constraints arrange related elements in a circular layout [^1]. The layout below is used in the [Ring Lights](/copeanddrag/examples#ringlights)
example to arrange a ring of lights along the boundary of a pentagon.
```yaml
constraints:
  - cyclic:
      selector: left
      direction: clockwise
directives:
  - flag: hideDisconnectedBuiltIns
```


[^1]: To be more precise, related elements are laid out roughly as a regular shape of n sides, where there are n related elements in the selector.



#### Parameters

- `selector` : A Forge expression that determines which elements upon which the constraint acts. This expression must return a set of elements of arity >= 2, and the first and last of each tuple will be used. If multiple closed relations are returned, multiple cycles are  generated. For example, a selector evaluating to `{(A, B), (B, C), (C,D), (E,F), (F,E)}` will construct two independent shapes -- one relating `A, B, C` and another relating `E,F`.
- `direction` : [Optional] Direction in which elements will be laid out. One of `clockwise` or `counterclockwise`. Defaults to `clockwise`




## **Orientation Constraints**
Specify the relative positioning of elements in a graph. The layout below is used in the [binary tree example](/copeanddrag/examples/#bt) shows how
to ensure that a node's right children are laid out below it and to its right, and that its left children are laid out below it and to its left.

```yaml
constraints:
  - orientation:
      selector: right
      directions:
        - right
        - below
  - orientation:
      selector: left
      directions:
        - left
        - below
directives:
  - attribute:
      field: key
  - flag: hideDisconnectedBuiltIns
```

#### Parameters

- `selector` : A Forge expression that determines which elements upon which the constraint acts. This expression must return a set of elements of arity >= 2, and the first and last of each tuple will be used.
- `directions` : Directions in which elements will be laid out. List of directions, which can be
                `left`, `right`, `above`, `below`, `directlyAbove`, `directlyBelow`, `directlyLeft`, `directlyRight`.



## **Grouping Constraints**

Group elements together based on either a **selector** OR a **field**. Groups **cannot** intersect unless one is subsumed by another.


### Grouping by Field
Grouping by field removes multiple edges between the group source(s) and target(s), and replaces them with the lowest number of arrows between group and element. The layout below shows the pertinent part of the [Fruit in Baskets](/copeanddrag/examples/#fruit) example, which uses the 0th element 
of the `fruit` relation as a key and adds elements in the 1st part of the relation to the associated group.


```yaml
- group:
      field: fruit
      groupOn: 0
      addToGroup: 1
```

#### Parameters
- `field` : Name of the field in the source specification upon which the constraint acts.
- `groupOn` : The 0 indexed element of the field that is used to group elements.
- `addToGroup`: The 0 indexed element of the field which should be added to the group.

### Grouping by Selector 


Grouping by selector affords a more flexible way to create groups. This operation, however, does not have required context to collapse multiple graph edges. As a result, it **does not remove any edges from the graph**. The layout below shows the pertinent part of the [Fruit in Baskets](/copeanddrag/examples/#fruit) example, which uses a n-ary selector to group rotten fruit that are in the same basket together.

```yaml
  - group:
      selector: '{b : Basket, a : Fruit | (a in b.fruit) and a.status = Rotten }'
      name: rottenFruit

```

#### Parameters

- `selector` : A Forge expression that determines which elements upon which the constraint acts.
    - If the selector evaluates to a set of singletons, all singletons are added to the group.
    - If the selector evaluates to a set of tuples, the first element of the tuple is used as as a key upon which to group, while the last element of the tuple is added to the group associated with that key. For example, 
- `name` : Name of the group to be displayed.
  




## When Constraints Cannot Be Satisfied

All CnD constraints are **hard constraints**, and thus must be satisfied for a diagram to be produced. Constraints might not be satisfied for one of two reasons:

**A single CnD constraint definition could be inherently unsatisfiable.** For example, a constraint on the `next` field that requires the same field to be laid out both leftwards and rightwards:

```yaml
- orientation:
    selector: next
    directions: [right, left]
```

This represents a bug in the CnD spec, and can be identified statically. In this case, CnD produces an error message in terms of the constraints that could not be satisfied.


**Some constraints may be individually satisfiable, but become contradictory when laying out a specific instance.** This is akin to a dynamic error, as it depends on the structure of the instance being visualized. 


In both these cases, CnD **does not produce a diagram**. Instead, it provides an error message explaining that the constraints could not be met. 
