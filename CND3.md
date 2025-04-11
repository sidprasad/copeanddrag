# Documenting CnD 3 Syntax Changes


We *should* largey support previous CnD operations, but not quite.

### Tested:

Group constraints either work :

- On a field (as below). Range and domain are replaced by the index in the tuple. One could imagine Range and Domain being implemented as syntactic sugar / views. However, these are tricky since you need to
know the arity of the relation (which is determinable, I guess, but a pain.)


- Based on an arbitrary Forge expression (`elementSelector`) that returns singletons. Things returned by the relation are in the group.
- Unfortunately, set comprehension syntax is not supported.

```

  - group:
      field: animals
      groupOn: 0
      addToGroup: 1

  - group:
      elementSelector: "Wolf"
      name: "everythingGroup"


```





### Not Tested Yet


The big change is the `appliesTo` field, which now takes a single Forge expression and only applies (`orientation` or `cyclic`) layout 
if it evaluates to true (`#t`). PRevious sig / layout / field are relatively easy to compile to this from this but need to be tested.





# PROS

- MUCH more expressive
- More extensible -- can imagine writing your own sugar / views via a plugin system.

# Cons
- A lot slower since we have to invoke the Forge evaluator a lot.

#### TODO:

New Structured editor


-- Evaluator bugs:

- `A in A` is false in the `ab` test