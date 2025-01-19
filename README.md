## Lightweight Visualizations for Lightweight Formal Methods




### Relation to attribute (`attributeFields`)

These replace graph edges representing a relation with attribute fields within the source node of the edge. This is analagous to attributes in Sterling themes.
```
  "attributeFields": [
        {
          "fieldName": "rFork"
        },
        {
          "fieldName": "lFork"
        }
      ]
```


### Relation Defining a Closure (`closures`)

This aligns elements along a relation uniformly around the perimiter of a notional circle, suggesting that they form a shape.
Atoms in the relation can be laid out either `clockwise` (default) or `counterclockwise`. If a relation is not cyclic, it orders nodes based on a depth-first-search of the relation.


```
 "closures" : [
        {
            "fieldName": "leftP",
            "direction" : "counterclockwise"
        }
    ]

```


-------------------
We also support some basic layout settings that act upon Sigs (that is, atoms)

  - `hideDisconnected`: If true, hide all atoms in the graph that are not referenced by a relation.
  - `hideDisconnectedBuiltIns`: If true, hide all atoms of built-in type (ex. `Int`) that are not referenced by a relation.
  - `sigColors` : Allows specific hex-colors to be associated with Atoms of a certain type.
  ```
"sigColors" : [

        {
            "sigName": "True",
            "color": "#3cf06a"
        },
        {
            "sigName": "False",
            "color": "#f03c3c"
        }

    ]

```
By default, we assign every `sig` a random color, that is respected by all atoms of that type.


- `projections` : These allow projections over atoms of a certain type. This is currently the *only* information hiding aspect of these diagrams. Regretfully, projections (or some equivalent) are required for certain diagrams (for example `adder`).
```
    "projections" : [
        {
            "sigName": "RCA"
        }
    ]
```

## Current Issues

- [] Error reporting: We want better error messages on start.
- [] We should show unsatisfiable layout / the dynamic equivalent ON SCREEN rather than as JUST text feedback. This will allow iteration.

- [] Attributes for n-ary relations are broken (we lost the in-betweens in the attribute names)
  - What can we do here? You could extend grouping by adding more than just range and domain
- [] Struggles with groups that intersect but are not subgroups of one another

