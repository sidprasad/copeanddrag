
# Directives

[TODO: Rewrite]

Directives are statements on how (and which) elements in the graph should be rendered.

### Attributes

These replace graph edges representing a relation with attribute fields within the source node of the edge. This is analogous to attributes in Sterling themes. In the example below, the relation `id` is shown as an attribute.
```
directives:
    - attribute: {field: id}
```

### Icons

These associate specific icons with atoms of a certain `sig` type.

```
  - icon:
      sig: Apple
      icon:
        path: 'http://<website>/img/apple.png'
        height: 70
        width: 70
```

### Color

Allows specific hex-colors (or simple color names) to be associated with `sigs`.

```
directives:
    - color:
        sig: Apple
        value: "red"
```
By default, we assign every `sig` a random color, that is respected by all atoms of that type.

### Projection
These allow [projections](https://alloy.readthedocs.io/en/latest/tooling/visualizer.html#projection) over atoms of a certain type. 
In the example below, the sig `Ord` is projected over.
```
directives:
    - projection: {sig: Ord}
```


### Flags

We also support some basic layout settings that act upon atoms of specific `sig` types.

  - `hideDisconnected`: If true, hide all atoms in the graph that are not referenced by a relation.
  - `hideDisconnectedBuiltIns`: If true, hide all atoms of built-in type (ex. `Int`) that are not referenced by a relation.


```
directives:
    - flag: hideDisconnectedBuiltIns
```


