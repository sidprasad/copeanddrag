## Penrose Visualizations for Forge

1. Run `npm install`
2. Run in dev mode using `nodemon --exec ts-node src/index.ts`
3. Application should be available at `localhost:3000`. It expects an Alloy datum and visualization constraints (see the `/examples` folder)


###Layout Settings


We currently support:
4 types of layout settings that act upon relations (also called fields)


### Directional Relationships (`fieldDirections`)

These specify that a field must be laid out in a particular direction (any combination of "left", "right", "above", "below")

```
{
  "fieldName": "afield",
  "directions": ["below", "left"]
}
```

*Limitations*: Currently, we do not deal well with conflicting directions (say `["left", "right"]). The rendering engine may fail to settle on a layout here.

### Grouping by field (`groupBy`)

These specify that the atoms related by a field should be grouped together. This can be configured for the grouping key to be the range (default) or domain of a relation. The node associated with the grouping key (and its related edges) are removed from the graph.

```
"groupBy": [
  {
    "fieldName" : "pos"
    "groupOn" : "range"
  },
  {
    "fieldName" : "bank"
    "groupOn" : "domain"
  }
]
```

*Limitations* : WebCola layouts currently struggle to lay out groups that intersect but are not subsumed by one another. This is a webcola limitation that needs to be addressed, either by us or them.


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


- [] Currently only show a visualizations for a single alloy instance in the datum


### WebCola

- [] Better Label Layout: https://medium.com/@adarshlilha/removing-label-overlapping-from-pretty-charts-8dd2e3581b71
- [] Struggles with groups that intersect but are not subgroups of one another
- [] WebCola struggles with variable link length. 
    - Minimum link length does not always serve us, since it really tries to enforce that min length.
    - Perhaps we need to force super large links and also force all nodes within the frame?
- [] Attributes for n-ary relations are broken (we lost the in-betweens in the attribute names)

- Groups: Information related to groups should not be lost, right?
  - [] Centroids are not necessarily included in groups, which causes issues.

- **Grids**
- Arrows to groups not nodes in groups
- Relation colors?