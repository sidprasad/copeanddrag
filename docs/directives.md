
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



### **Pictorial Directives**
Assign an icon to all atoms of a certain sig.

```yaml
directives:
  - icon:
      sig: Person
      icon:
        path: /path/to/person.png
        height: 20
        width: 20
```

#### Parameters

- `sig` : Sig name in the source specification.
- `icon` : Object describing how the icon should be displayed.
  - `path` : Path to the icon image (`png` and `jpg` supported).
  - `height` : Height with which the icon should be displayed.
  - `width` : Width with which the icon should be displayed.




### **Color Directives**

Allow specific hex-colors (or simple color names) to be associated with `sigs`.

```
directives:
    - color:
        sig: Apple
        value: "red"
```

#### Parameters

- `sig` : Sig name in the source specification.
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

