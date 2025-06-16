# Under the Hood


> 🔧 This page is still under construction 🔧 

`CnD` uses a combination of tools to compute and render visual layouts:

- **[Cassowary](https://github.com/slightlyoff/cassowary.js)** checks whether the given set of constraints allows for a valid layout. If a solution exists, Cassowary will find it.

- **[WebCola](https://github.com/tgdwyer/WebCola)** computes the final layout based on the satisfied constraints, optimizing the spatial arrangement of elements.

- **[D3](https://d3js.org/)** helps implement visual directives such as color, icons, styling, etc.
