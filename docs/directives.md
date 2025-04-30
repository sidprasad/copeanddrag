
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

```
directives:
    - flag: hideDisconnectedBuiltIns
```

Current flags are:
  - `hideDisconnected`: If true, hide all atoms in the graph that are not referenced by a relation.
  - `hideDisconnectedBuiltIns`: If true, hide all atoms of built-in type (ex. `Int`) that are not referenced by a relation.

