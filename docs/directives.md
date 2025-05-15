
# Directives
Directives control the visual representation of elements, including icons, colors, attributes, and visibility.

### **Attribute Directives**

These replace graph edges representing a relation with attribute fields within the source node of the edge. 

```
directives:
    - attribute: {field: id}
```

#### Parameters
- `field` : Name of the field in the source specification upon which the constraint acts.


### Size Directives

Assign a size to all atoms that meet a certain selector.

```yaml
directives:
  - size:
      selector: "Person"
      height: 20
      width: 20
```

#### Parameters

- `selector` : A Forge expression that determines which elements upon which the constraint acts. This expression must return a set of singletons.
- `height` : Height with which the node should be displayed.
- `width` : Width with which the node should be displayed.



### **Pictorial Directives**
Assign an icon to all atoms of a certain sig.

```yaml
directives:
  - icon:
      selector: Person
      path: /path/to/person.png
```

#### Parameters

- `selector` : A Forge expression that determines which elements upon which the constraint acts. This expression must return a set of singletons.
- `path` : Path to the icon image (`png` and `jpg` supported). This path must be a publicly accessible URI.
- `showLabels` : [Optional, default `false`] Should atom labels (e.g., atom name, attributes) be shown in addition to icons. If `true`, the icon is made smaller to prevent overlap with label text. 

#### Built In Icons
Cope and Drag also includes a selection of [built in icons](/copeanddrag/bundledicons) for ease of use.


### **Color Directives**

Allow specific hex-colors (or simple color names) to be associated with selected atoms.

```
directives:
    - color:
        selector: "Apple"
        value: "red"
```

#### Parameters

- `selector` : A Forge expression that determines which elements upon which the constraint acts. This expression must return a set of singletons.
- `value` : Hex (or simple english) description of the color to be applied.




### **Projection**
These allow [projections](https://alloy.readthedocs.io/en/latest/tooling/visualizer.html#projection) over atoms of a certain type. 

```
directives:
    - projection: {sig: Ord}
```

#### Parameters
- `sig` : Sig name in the source specification.



### **Visibility Flags**
Controls which elements are hidden. 

```yaml
directives:
    - flag: hideDisconnectedBuiltIns
```

Current flags are:
  - `hideDisconnected`: If true, hide all atoms in the graph that are not referenced by a relation.
  - `hideDisconnectedBuiltIns`: If true, hide all atoms of built-in type (ex. `Int`) that are not referenced by a relation.


### Inferred Edge

The `inferredEdge` directive introduces visually distinct edges that represent inferred relationships — connections the diagrammer wants the viewer to see to better understand the model. These edges are not part of the model itself but help the viewer mentally hold and interpret higher-level connections.

```yaml
directives:
  - inferredEdge:
      selector: '{n1 : Node, i : Int, n2 : Node | n1->n2->i in edges }'
      name: weight
```

#### Parameters
- `selector` : A Forge expression that determines which elements upon which the constraint acts. This expression must return a set of elements of arity >= 2, and the first and last of each tuple will be used.
- `name` : The label to be given to this edge. Any ''middle'' tuple elements in the selector (i.e. elements that are not first or last in the tuple) are appended to this name to better identify edges.